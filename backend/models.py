from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class Article(BaseModel):
    source: str
    author: Optional[str] = None
    title: str
    description: Optional[str] = None
    url: str
    urlToImage: Optional[str] = None
    publishedAt: datetime
    content: Optional[str] = None
    category: str = Field(default="business-us")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }