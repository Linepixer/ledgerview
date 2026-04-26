from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional

class AssetPriceBase(BaseModel):
    price: Decimal
    source: Optional[str] = None

class AssetPriceCreate(AssetPriceBase):
    asset_id: UUID

class AssetPriceResponse(AssetPriceCreate):
    id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
