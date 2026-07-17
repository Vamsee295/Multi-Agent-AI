"""
Async MongoDB connection (Motor) with lazy singleton client.
Falls back gracefully with a clear error if MongoDB is unreachable.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import get_settings

from datetime import datetime
from bson import ObjectId
import copy

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None
_use_mock_db: bool = False
_mock_db = None


class MockInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class MockCursor:
    def __init__(self, data):
        self.data = data
        self._index = 0

    def sort(self, key, direction=1):
        self.data = sorted(self.data, key=lambda x: x.get(key) if x.get(key) is not None else datetime.min)
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
    def __init__(self, name):
        self.name = name
        self.docs = []

    async def create_index(self, key, unique=False):
        pass

    async def find_one(self, query):
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(doc.get("_id")) != str(v):
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(copy.deepcopy(doc))
        return MockInsertResult(doc["_id"])

    def find(self, query):
        matched = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(doc)
        return MockCursor(matched)

    def aggregate(self, pipeline):
        docs = copy.deepcopy(self.docs)
        for stage in pipeline:
            if "$match" in stage:
                match_query = stage["$match"]
                filtered_docs = []
                for doc in docs:
                    match = True
                    for k, v in match_query.items():
                        if doc.get(k) != v:
                            match = False
                            break
                    if match:
                        filtered_docs.append(doc)
                docs = filtered_docs
            elif "$sort" in stage:
                sort_config = stage["$sort"]
                for field, order in reversed(list(sort_config.items())):
                    # Use default-arg capture to avoid late-binding closure bug
                    def make_sort_key(f):
                        def _key(x):
                            val = x.get(f)
                            if val is None:
                                # Return a sentinel that is always less-than any real value
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
        self.users = MockCollection("users")
        self.messages = MockCollection("messages")
        self.escalations = MockCollection("escalations")
        self.feedback = MockCollection("feedback")
        self.session_titles = MockCollection("session_titles")


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    global _db
    if _use_mock_db:
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
        print("\n=== WARNING: MongoDB is unreachable. Falling back to In-Memory Mock Database. ===\n", file=sys.stderr)
        _use_mock_db = True
        if _mock_db is None:
            _mock_db = MockDatabase()
        return False


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.messages.create_index("session_id")
    await db.messages.create_index([("user_id", 1), ("timestamp", -1)])
    await db.escalations.create_index("session_id")
    await db.escalations.create_index([("status", 1), ("created_at", -1)])
