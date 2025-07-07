from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from dotenv import load_dotenv
from contextlib import asynccontextmanager

import time
# Load environment variables
load_dotenv()
import logging
import os
import requests
import asyncio


from typing import List
from database import db
from news_fetcher import NewsFetcher
from retirement_planner import router as retirement_router, initialize_app
from functools import lru_cache
import finnhub

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")


scheduler = AsyncIOScheduler()




# Initialize NewsFetcher
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "d403798f40db4331bae14a26284e9d71")
news_fetcher = NewsFetcher(api_key=NEWS_API_KEY, db=db)

def fetch_with_retry(ticker, retries=3):
    for i in range(retries):
        try:
            return ticker.history(...)
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                wait = 2 ** i
                logger.warning(f"Rate limited. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise

# FastAPI app with lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting lifespan")

    # Initialize resources for retirement planner
    initialize_app()

    scheduler.add_job(news_fetcher.fetch_and_save_business_us, 'interval', hours=1)
    scheduler.start()
    logger.info("Scheduler started")

    await news_fetcher.fetch_and_save_business_us()

    yield

    scheduler.shutdown()
    logger.info("Scheduler shut down")


app = FastAPI(title="News Digest API", lifespan=lifespan)

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache stock data for 5 minutes to avoid rate limiting
@lru_cache(maxsize=1)
def get_cached_stock_data(cache_key: str):
    return None, 0  # (data, timestamp)

async def get_stock_data_with_cache(symbols: List[str]):
    cache_key = ",".join(sorted(symbols))
    cached_data, timestamp = get_cached_stock_data(cache_key)

    if cached_data and time.time() - timestamp < 300:
        return cached_data

    stock_data = []

    for symbol in symbols:
        try:
            # Get quote data
            quote = finnhub_client.quote(symbol)
            profile = finnhub_client.company_profile2(symbol=symbol)
            
            # Get historical candle data (5-minute intervals for today)
            now = int(time.time())
            start = now - 24 * 60 * 60  # last 24 hours

            candles = finnhub_client.stock_candles(symbol, '5', start, now)

            historical_data = []
            if candles.get("s") == "ok":
                for ts, close in zip(candles["t"], candles["c"]):
                    time_str = datetime.fromtimestamp(ts).strftime("%H:%M")
                    historical_data.append({"time": time_str, "value": close})

            stock_data.append({
                "symbol": symbol,
                "name": profile.get("name", symbol),
                "price": quote.get("c", 0),
                "change": round(((quote.get("c", 0) - quote.get("pc", 0)) / quote.get("pc", 1e-6)) * 100, 2),
                "data": historical_data
            })

            await asyncio.sleep(0.2)  # Avoid hitting 60 req/min limit

        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            continue

    # Cache the result
    get_cached_stock_data.cache_clear()
    get_cached_stock_data(cache_key)
    return stock_data



# Mount routers
app.include_router(retirement_router)

# Endpoint to get articles with optional category and limit
@app.get("/api/articles")
async def get_articles(
    category: str = Query(None, description="Article category"),
    limit: int = Query(20, ge=1, le=50, description="Number of articles to return")
):
    try:
        filt = {"category": category} if category else {}
        # Project out _id by passing {"_id": 0} as the second arg to find()
        cursor = (
            db.collection
              .find(filt, {"_id": 0})
              .sort("publishedAt", -1)
              .limit(limit)
        )
        articles = await cursor.to_list(length=limit)
        return {"articles": articles}

    except Exception as e:
        logger.error(f"Error retrieving articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve articles")
    
@app.get("/api/stocks")
async def get_stock_data(symbols: List[str] = Query(["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"])):
    try:
        stock_data = await get_stock_data_with_cache(symbols)
        if not stock_data:
            return {"stocks": [], "message": "No stock data available"}
        return {"stocks": stock_data}
    except Exception as e:
        logger.error(f"Error fetching stock data: {e}")
        return {"error": str(e)}
    

if __name__ == "__main__":
    port = int(os.getenv('PORT', 4000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
