import requests
from datetime import datetime
from typing import Optional
from transformers import pipeline
import logging
from newspaper import Article
import newspaper
import re

logger = logging.getLogger(__name__)

# Load the model once globally
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

BLOCKED_DOMAINS = ["wsj.com", "barrons.com", "forbes.com", "politico.com"]

def is_blocked_url(url):
    return any(domain in url for domain in BLOCKED_DOMAINS)

def clean_url(url):
    return re.sub(r'\\u003d', '=', url)


def summarize_article(text: str) -> str:
    if not text:
        return "No summary available."
    
    try:
        # Truncate long content to stay within token limits
        result = summarizer(text[:1000], max_length=30, min_length=10, do_sample=False)
        return result[0]["summary_text"]
    except Exception as e:
        logger.warning(f"Summarization failed: {e}")
        return "Summary generation failed."
    
def extract_full_text(url: str) -> str:
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text
    except Exception as e:
        logger.warning(f"Failed to extract article from {url}: {e}")
        return ""

class NewsFetcher:
    def __init__(self, api_key: str, db):
        self.api_key = api_key
        self.base_url = "https://newsapi.org/v2"
        self.db = db  # ✅ Properly assign db to instance

    async def fetch_and_save_business_us(self):
        try:
            url = f"{self.base_url}/top-headlines"
            params = {
                "country": "us",
                "category": "business",
                "pageSize": 50,
                "apiKey": self.api_key
            }

            response = requests.get(url, params=params)
            response.raise_for_status()

            articles = response.json().get("articles", [])
            processed = 0

            for article in articles:
                full_text = extract_full_text(article["url"])
                summary = summarize_article(full_text or article.get("content") or article.get("description") or article.get("title"))

                processed_article = {
                    "source": article["source"]["name"],
                    "author": article.get("author"),
                    "title": article["title"],
                    "description": article.get("description"),
                    "url": article["url"],
                    "urlToImage": article.get("urlToImage"),
                    "publishedAt": datetime.fromisoformat(article["publishedAt"].replace('Z', '+00:00')),
                    "content": article.get("content"),
                    "category": "business-us",
                    "summary": summary,
                    "content": full_text or article.get("content")
                }

                try:
                    await self.db.upsert_article(processed_article)
                    processed += 1
                except Exception as e:
                    logger.error(f"Error upserting article: {e}")

            logger.info(f"Processed {processed} articles out of {len(articles)}")
            return processed

        except Exception as e:
            logger.error(f"Error fetching news: {e}")
            return 0
