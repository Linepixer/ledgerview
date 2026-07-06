from pydantic import BaseModel
from typing import List
import uuid

class AssetBase(BaseModel):
    ticker: str
    name: str
    type: str
    currency: str

class AssetCreate(AssetBase):
    pass

class AssetResponse(AssetBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class AssetWithPriceResponse(AssetResponse):
    current_price_usd: float = 0.0
    current_price_ars: float = 0.0

class AssetHistoryPoint(BaseModel):
    date: str
    price_usd: float
    price_ars: float

class AssetHistoryResponse(BaseModel):
    ticker: str
    name: str
    history: List[AssetHistoryPoint]
