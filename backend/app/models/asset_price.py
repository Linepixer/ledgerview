import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AssetPrice(Base):
    __tablename__ = "asset_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False, index=True)
    price = Column(Numeric(24, 8), nullable=False)
    source = Column(String(100), nullable=True)

    asset = relationship("Asset")
