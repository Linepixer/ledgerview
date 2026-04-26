import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ticker = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    currency = Column(String(10), nullable=False)
