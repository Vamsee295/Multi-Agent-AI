"""
Async MongoDB connection (Motor) with lazy singleton client.
Falls back gracefully with persistent local file-backed Mock Database
so user accounts and chat sessions are NEVER lost on server reload.
"""
import os
import json
import copy
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import get_settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None
_use_mock_db: bool = False
_mock_db = None

DB_CACHE_FILE = os.path.join(os.path.dirname(__file__), ".mock_db_store.json")


def _json_serial(obj):
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


def _deserialize_doc(doc: dict) -> dict:
    d = copy.deepcopy(doc)
    if "_id" in d and isinstance(d["_id"], str):
        try:
            d["_id"] = ObjectId(d["_id"])
        except Exception:
            pass
    for k, v in d.items():
        if isinstance(v, str) and (k.endswith("_at") or k == "timestamp"):
            try:
                d[k] = datetime.fromisoformat(v)
            except Exception:
                pass
    return d


class MockInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class MockCursor:
    def __init__(self, data):
        self.data = data
        self._index = 0

    def sort(self, key, direction=1):
        self.data = sorted(
            self.data,
            key=lambda x: x.get(key) if x.get(key) is not None else datetime.min,
            reverse=(direction == -1)
        )
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self.data):
            raise StopAsyncIteration
        val = self.data[self._index]
        self._index += 1
        return val


class MockCollection:
    def __init__(self, name, parent_db):
        self.name = name
        self.parent_db = parent_db
        self.docs = []

    async def create_index(self, key, unique=False, **kwargs):
        pass

    async def find_one(self, query):
        for doc in self.docs:
            if self._matches(doc, query):
                return copy.deepcopy(doc)
        return None

    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(copy.deepcopy(doc))
        self.parent_db.save()
        return MockInsertResult(doc["_id"])

    async def find_one_and_update(self, query, update, return_document=True):
        doc = await self.find_one(query)
        if not doc:
            return None
        
        # Apply $set update
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = copy.deepcopy(v)
                
        # Update the document inside self.docs list too
        for idx, d in enumerate(self.docs):
            if str(d.get("_id")) == str(doc.get("_id")):
                self.docs[idx] = copy.deepcopy(doc)
                break
                
        self.parent_db.save()
        return doc

    def _matches(self, doc, query):
        for k, v in query.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v):
                    return False
            elif doc.get(k) != v:
                return False
        return True

    def find(self, query):
        matched = [copy.deepcopy(d) for d in self.docs if self._matches(d, query)]
        return MockCursor(matched)

    async def delete_many(self, query):
        orig_len = len(self.docs)
        self.docs = [d for d in self.docs if not self._matches(d, query)]
        self.parent_db.save()
        class MockDeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return MockDeleteResult(orig_len - len(self.docs))

    async def delete_one(self, query):
        for idx, doc in enumerate(self.docs):
            if self._matches(doc, query):
                self.docs.pop(idx)
                self.parent_db.save()
                class MockDeleteResult:
                    def __init__(self, deleted_count):
                        self.deleted_count = deleted_count
                return MockDeleteResult(1)
        class MockDeleteResultZero:
            def __init__(self):
                self.deleted_count = 0
        return MockDeleteResultZero()

    def aggregate(self, pipeline):
        docs = copy.deepcopy(self.docs)
        for stage in pipeline:
            if "$match" in stage:
                match_query = stage["$match"]
                docs = [d for d in docs if self._matches(d, match_query)]
            elif "$sort" in stage:
                sort_config = stage["$sort"]
                for field, order in reversed(list(sort_config.items())):
                    def make_sort_key(f):
                        def _key(x):
                            val = x.get(f)
                            if val is None:
                                return (0, datetime.min, "")
                            if isinstance(val, datetime):
                                return (1, val, "")
                            return (1, datetime.min, str(val))
                        return _key
                    docs = sorted(docs, key=make_sort_key(field), reverse=(order == -1))
            elif "$unwind" in stage:
                field = stage["$unwind"]
                if field.startswith("$"):
                    field = field[1:]
                unwound_docs = []
                for doc in docs:
                    val = doc.get(field)
                    if isinstance(val, list):
                        for item in val:
                            new_doc = copy.deepcopy(doc)
                            new_doc[field] = item
                            unwound_docs.append(new_doc)
                    elif val is not None:
                        unwound_docs.append(doc)
                docs = unwound_docs
            elif "$group" in stage:
                group_config = stage["$group"]
                group_id_expr = group_config.get("_id")
                groups = {}
                for doc in docs:
                    if isinstance(group_id_expr, str) and group_id_expr.startswith("$"):
                        key = doc.get(group_id_expr[1:])
                    else:
                        key = group_id_expr
                    if key not in groups:
                        groups[key] = []
                    groups[key].append(doc)
                grouped_docs = []
                for key, group_items in groups.items():
                    res = {"_id": key}
                    for out_field, accum in group_config.items():
                        if out_field == "_id":
                            continue
                        if isinstance(accum, dict):
                            if "$sum" in accum:
                                sum_expr = accum["$sum"]
                                if sum_expr == 1:
                                    res[out_field] = len(group_items)
                                elif isinstance(sum_expr, str) and sum_expr.startswith("$"):
                                    res[out_field] = sum(item.get(sum_expr[1:], 0) for item in group_items)
                                else:
                                    res[out_field] = sum_expr * len(group_items)
                            elif "$avg" in accum:
                                avg_expr = accum["$avg"]
                                if isinstance(avg_expr, str) and avg_expr.startswith("$"):
                                    vals = [item.get(avg_expr[1:]) for item in group_items if item.get(avg_expr[1:]) is not None]
                                    res[out_field] = sum(vals) / len(vals) if vals else 0.0
                                else:
                                    res[out_field] = avg_expr
                            elif "$first" in accum:
                                first_expr = accum["$first"]
                                if isinstance(first_expr, str) and first_expr.startswith("$"):
                                    res[out_field] = group_items[0].get(first_expr[1:]) if group_items else None
                                else:
                                    res[out_field] = first_expr
                    grouped_docs.append(res)
                docs = grouped_docs
            elif "$count" in stage:
                count_field = stage["$count"]
                docs = [{count_field: len(docs)}]
        return MockCursor(docs)


class MockDatabase:
    def __init__(self):
        self.users = MockCollection("users", self)
        self.messages = MockCollection("messages", self)
        self.escalations = MockCollection("escalations", self)
        self.feedback = MockCollection("feedback", self)
        self.session_titles = MockCollection("session_titles", self)
        self.load()

    def save(self):
        try:
            data = {
                "users": self.users.docs,
                "messages": self.messages.docs,
                "escalations": self.escalations.docs,
                "feedback": self.feedback.docs,
                "session_titles": self.session_titles.docs,
            }
            with open(DB_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, default=_json_serial, indent=2)
        except Exception as e:
            print(f"[MockDB] Warning: Failed to save cache: {e}")

    def load(self):
        if os.path.exists(DB_CACHE_FILE):
            try:
                with open(DB_CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.users.docs = [_deserialize_doc(d) for d in data.get("users", [])]
                self.messages.docs = [_deserialize_doc(d) for d in data.get("messages", [])]
                self.escalations.docs = [_deserialize_doc(d) for d in data.get("escalations", [])]
                self.feedback.docs = [_deserialize_doc(d) for d in data.get("feedback", [])]
                self.session_titles.docs = [_deserialize_doc(d) for d in data.get("session_titles", [])]
            except Exception as e:
                print(f"[MockDB] Warning: Failed to load cache: {e}")
        
        # Ensure default seed accounts always exist
        self._ensure_seed_users()

    def _ensure_seed_users(self):
        default_pwd_hash = "legacy_seed_hash_not_used"
        
        seed_accounts = [
            {"email": "student@gmail.com", "name": "Student User"},
            {"email": "demo@techmart.com", "name": "Demo User"},
            {"email": "admin@techmart.com", "name": "Admin User"},
            {"email": "you@company.com", "name": "Test User"},
            {"email": "test@company.com", "name": "Test User"},
        ]
        
        existing_emails = {u.get("email") for u in self.users.docs}
        changed = False
        for acc in seed_accounts:
            if acc["email"] not in existing_emails:
                self.users.docs.append({
                    "_id": ObjectId(),
                    "email": acc["email"],
                    "name": acc["name"],
                    "hashed_password": default_pwd_hash,
                    "created_at": datetime.now(timezone.utc),
                    "is_active": True,
                })
                changed = True
        if changed:
            self.save()


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
    return _client


def get_db():
    global _db, _use_mock_db, _mock_db
    if _use_mock_db:
        if _mock_db is None:
            _mock_db = MockDatabase()
        return _mock_db
    if _db is None:
        settings = get_settings()
        _db = get_client()[settings.MONGO_DB_NAME]
    return _db


async def ping() -> bool:
    global _use_mock_db, _mock_db
    try:
        await get_client().admin.command("ping")
        _use_mock_db = False
        return True
    except Exception:
        import sys
        print("\n=== [DATABASE] MongoDB offline. Active with Persistent File Storage (.mock_db_store.json) ===\n", file=sys.stderr)
        _use_mock_db = True
        if _mock_db is None:
            _mock_db = MockDatabase()
        return False


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("supabase_uid", unique=True, sparse=True)
    await db.messages.create_index("session_id")
    await db.messages.create_index([("user_id", 1), ("timestamp", -1)])
    await db.escalations.create_index("session_id")
    await db.escalations.create_index([("status", 1), ("created_at", -1)])
