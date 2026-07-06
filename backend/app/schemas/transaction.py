from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class TransactionBase(BaseModel):
    timestamp: datetime | None = None
    type: str
    quantity: Decimal
    price_per_unit: Decimal
    total_value: Decimal
    operated_currency: str | None = None
    exchange_rate: Decimal | None = None
    platform: str | None = None
    notes: str | None = None

class TransactionCreate(TransactionBase):
    ticker: str
    asset_type: str = "Stock" # "Stock", "Crypto", etc.

class TransactionResponse(TransactionCreate):
    id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
