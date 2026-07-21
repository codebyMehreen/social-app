import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class FriendStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    bio = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class FriendRequest(Base):
    """
    A directed friend request from sender -> receiver.
    Status starts 'pending', becomes 'accepted' or 'rejected'.
    """
    __tablename__ = "friend_requests"
    __table_args__ = (
        UniqueConstraint("sender_id", "receiver_id", name="unique_friend_request"),
    )

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(FriendStatus), default=FriendStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class Block(Base):
    """
    A directed block: blocker_id has blocked blocked_id.
    Blocking someone also removes any existing friendship/request between them.
    """
    __tablename__ = "blocks"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="unique_block"),
    )

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])


class Message(Base):
    """A single chat message between two friends."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])