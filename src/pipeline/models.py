from dataclasses import dataclass, field
from typing import Dict, Any

@dataclass
class Category:
    id: int
    name: str

@dataclass
class Section:
    id: int
    name: str
    category_id: int
    category_name: str | None = None

@dataclass
class Article:
    id: str # article_id#chunk_n
    text: str  # chunk text
    article_name: str
    category_id: int
    category_name: str
    section_id: int
    section_name: str
    url: str
    title: str
    updated_at: str