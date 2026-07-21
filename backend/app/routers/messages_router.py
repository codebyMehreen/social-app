from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/messages", tags=["messages"])


def _are_friends(db: Session, user_a_id: int, user_b_id: int) -> bool:
    fr = (
        db.query(models.FriendRequest)
        .filter(
            or_(
                and_(models.FriendRequest.sender_id == user_a_id, models.FriendRequest.receiver_id == user_b_id),
                and_(models.FriendRequest.sender_id == user_b_id, models.FriendRequest.receiver_id == user_a_id),
            ),
            models.FriendRequest.status == models.FriendStatus.accepted,
        )
        .first()
    )
    return fr is not None


@router.get("/conversations", response_model=List[schemas.ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """All friends, each with a preview of the last message exchanged (if any)."""
    accepted = (
        db.query(models.FriendRequest)
        .filter(
            or_(
                models.FriendRequest.sender_id == current_user.id,
                models.FriendRequest.receiver_id == current_user.id,
            ),
            models.FriendRequest.status == models.FriendStatus.accepted,
        )
        .all()
    )

    conversations = []
    for fr in accepted:
        friend = fr.receiver if fr.sender_id == current_user.id else fr.sender
        last_msg = (
            db.query(models.Message)
            .filter(
                or_(
                    and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == friend.id),
                    and_(models.Message.sender_id == friend.id, models.Message.receiver_id == current_user.id),
                )
            )
            .order_by(models.Message.created_at.desc())
            .first()
        )
        conversations.append(
            schemas.ConversationOut(
                friend=friend,
                last_message=last_msg.content if last_msg else None,
                last_message_at=last_msg.created_at if last_msg else None,
            )
        )

    conversations.sort(key=lambda c: c.last_message_at or c.friend.id, reverse=True)
    return conversations


@router.get("/{friend_id}", response_model=List[schemas.MessageOut])
def get_conversation(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not _are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only message friends")

    messages = (
        db.query(models.Message)
        .filter(
            or_(
                and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == friend_id),
                and_(models.Message.sender_id == friend_id, models.Message.receiver_id == current_user.id),
            )
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@router.post("/{friend_id}", response_model=schemas.MessageOut, status_code=201)
def send_message(
    friend_id: int,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not payload.content.strip():
        raise HTTPException(400, "Message can't be empty")

    if not _are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only message friends")

    msg = models.Message(
        sender_id=current_user.id,
        receiver_id=friend_id,
        content=payload.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg