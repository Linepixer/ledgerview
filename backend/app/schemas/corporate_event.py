from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class CorporateEventBase(BaseModel):
    asset_id: UUID
    type: str
    ratio: float
    timestamp: datetime

class CorporateEventCreate(CorporateEventBase):
    pass

class CorporateEventResponse(CorporateEventBase):
    id: UUID
    asset_ticker: Optional[str] = None # Added for easier display in UI

    model_config = ConfigDict(from_attributes=True)
