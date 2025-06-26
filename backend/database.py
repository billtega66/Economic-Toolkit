from pymongo import MongoClient, DESCENDING
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
from pymongo import ASCENDING


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

class Database:
    def __init__(self, mongo_uri="mongodb://localhost:27017", db_name="economic_toolkit", collection_name="articles"):
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]  # ✅ This is what was missing
        logger.info("Database connection established and indexes created")

    async def upsert_article(self, article: dict) -> bool:
        try:
            await self.collection.update_one(
                {"url": article["url"]},
                {"$set": article},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error upserting article: {e}")
            return False

    async def get_articles(self, category: str = None, limit: int = 20):
        try:
            query = {"category": category} if category else {}
            cursor = self.collection.find(query).sort("publishedAt", ASCENDING).limit(limit)
            articles = await cursor.to_list(length=limit)
            # Remove MongoDB's ObjectId before returning
            for article in articles:
                article.pop("_id", None)
            return articles
        except Exception as e:
            logger.error(f"Error retrieving articles: {e}")
            return []

# Global instance
db = Database()