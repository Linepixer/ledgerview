from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class CorporateEvent(Base):
    __tablename__ = "corporate_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False) # e.g., 'split'
    ratio = Column(Float, nullable=False) # e.g., 2.0 for 2:1, 0.5 for 1:2
    timestamp = Column(DateTime(timezone=True), nullable=False)

    asset = relationship("Asset")
