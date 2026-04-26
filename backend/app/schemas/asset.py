from pydantic import BaseModel, ConfigDict
from uuid import UUID

class AssetBase(BaseModel):
    ticker: str
    name: str
    type: str
    currency: str

class AssetCreate(AssetBase):
    pass

class AssetResponse(AssetBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
