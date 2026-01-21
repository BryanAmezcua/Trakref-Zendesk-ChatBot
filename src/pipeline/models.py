from dataclasses import dataclass
from typing import Dict, Any

class Document:
    id: str
    text: str
    metadata: Dict[str, Any]