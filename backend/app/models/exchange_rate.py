import uuid
from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class ExchangeRateHistory(Base):
    __tablename__ = "exchange_rate_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    rate_type = Column(String(20), nullable=False, index=True) # "blue", "mep", "cripto"
    rate_value = Column(Numeric(24, 8), nullable=False)
