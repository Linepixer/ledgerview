import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    quantity = Column(Numeric(24, 8), nullable=False)
    price_per_unit = Column(Numeric(24, 8), nullable=False)

    user = relationship("User")
    asset = relationship("Asset")
