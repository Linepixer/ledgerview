from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class TransactionBase(BaseModel):
    type: str
    quantity: Decimal
    price_per_unit: Decimal

class TransactionCreate(TransactionBase):
    user_id: UUID
    asset_id: UUID

class TransactionResponse(TransactionCreate):
    id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
