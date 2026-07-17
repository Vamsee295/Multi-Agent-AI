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


class MockDatabase:
    def __init__(self):
        self.users = MockCollection("users")
        self.messages = MockCollection("messages")
        self.escalations = MockCollection("escalations")


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
