from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- User ----------
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    bio: str
    created_at: datetime


class UserPublic(BaseModel):
    """Safe subset shown when browsing/searching other users."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    bio: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None


class UserProfile(BaseModel):
    """A user's public profile plus how the current user relates to them."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    bio: str
    created_at: datetime
    friend_status: str
    friend_request_id: int | None = None


# ---------- Friend requests ----------
class FriendRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender: UserPublic
    receiver: UserPublic
    status: str
    created_at: datetime


# ---------- Messages ----------
class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    friend: UserPublic
    last_message: str | None = None
    last_message_at: datetime | None = None