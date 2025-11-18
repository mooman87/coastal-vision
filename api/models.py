# api/models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(Text, nullable=False)

    # RBAC role: 'broker' or 'agent' (you can add 'admin' later if you want)
    role = Column(String(20), nullable=False, default="agent")

    # For agents, which broker they belong to (self-referential FK)
    broker_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('broker','agent')", name="role_check"),
    )


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    mls_id = Column(String(50), nullable=True)
    address = Column(Text, nullable=False)
    city = Column(Text, nullable=False)
    state = Column(String(2), nullable=False)
    zip_code = Column(String(10), nullable=False)
    price = Column(Numeric(12, 2), nullable=True)
    beds = Column(Integer, nullable=True)
    baths = Column(Numeric(4, 1), nullable=True)
    sqft = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Who owns/manages this listing
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Soft delete
    is_archived = Column(Boolean, default=False)
    
    images = relationship(
        "PropertyImage",
        back_populates="property",
        cascade="all, delete-orphan"
    )

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    caption = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=True)

    property = relationship("Property", back_populates="images")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_identifier = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender = Column(String(10), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("sender IN ('user', 'bot')", name="sender_check"),
    )
