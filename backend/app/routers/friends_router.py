from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/friends", tags=["friends"])


def _is_blocked_either_way(db: Session, user_a_id: int, user_b_id: int) -> bool:
    block = (
        db.query(models.Block)
        .filter(
            or_(
                and_(models.Block.blocker_id == user_a_id, models.Block.blocked_id == user_b_id),
                and_(models.Block.blocker_id == user_b_id, models.Block.blocked_id == user_a_id),
            )
        )
        .first()
    )
    return block is not None


@router.get("/search", response_model=List[schemas.UserPublic])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Search users by name (excludes yourself and anyone blocked either direction)."""
    blocked_ids = {
        b.blocked_id for b in db.query(models.Block).filter(models.Block.blocker_id == current_user.id)
    } | {
        b.blocker_id for b in db.query(models.Block).filter(models.Block.blocked_id == current_user.id)
    }

    query = (
        db.query(models.User)
        .filter(models.User.full_name.ilike(f"%{q}%"))
        .filter(models.User.id != current_user.id)
    )
    if blocked_ids:
        query = query.filter(models.User.id.notin_(blocked_ids))
    return query.limit(20).all()


@router.get("/user/{user_id}", response_model=schemas.UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """View another user's public profile, including your relationship to them."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if user_id == current_user.id:
        return schemas.UserProfile(
            id=user.id, full_name=user.full_name, bio=user.bio,
            created_at=user.created_at, friend_status="self",
        )

    you_blocked_them = (
        db.query(models.Block)
        .filter(models.Block.blocker_id == current_user.id, models.Block.blocked_id == user_id)
        .first()
    )
    if you_blocked_them:
        return schemas.UserProfile(
            id=user.id, full_name=user.full_name, bio=user.bio,
            created_at=user.created_at, friend_status="blocked_by_you",
        )

    fr = (
        db.query(models.FriendRequest)
        .filter(
            or_(
                and_(models.FriendRequest.sender_id == current_user.id, models.FriendRequest.receiver_id == user_id),
                and_(models.FriendRequest.sender_id == user_id, models.FriendRequest.receiver_id == current_user.id),
            )
        )
        .first()
    )

    status = "none"
    request_id = None
    if fr:
        request_id = fr.id
        if fr.status == models.FriendStatus.accepted:
            status = "friends"
        elif fr.status == models.FriendStatus.pending:
            status = "pending_sent" if fr.sender_id == current_user.id else "pending_received"

    return schemas.UserProfile(
        id=user.id, full_name=user.full_name, bio=user.bio,
        created_at=user.created_at, friend_status=status, friend_request_id=request_id,
    )


@router.post("/request/{receiver_id}", response_model=schemas.FriendRequestOut, status_code=201)
def send_friend_request(
    receiver_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if receiver_id == current_user.id:
        raise HTTPException(400, "You can't send a friend request to yourself")

    receiver = db.query(models.User).filter(models.User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(404, "User not found")

    if _is_blocked_either_way(db, current_user.id, receiver_id):
        raise HTTPException(400, "You can't send a friend request to this user")

    existing = (
        db.query(models.FriendRequest)
        .filter(
            or_(
                and_(models.FriendRequest.sender_id == current_user.id,
                     models.FriendRequest.receiver_id == receiver_id),
                and_(models.FriendRequest.sender_id == receiver_id,
                     models.FriendRequest.receiver_id == current_user.id),
            )
        )
        .first()
    )
    if existing:
        raise HTTPException(400, f"Friend request already exists (status: {existing.status.value})")

    fr = models.FriendRequest(sender_id=current_user.id, receiver_id=receiver_id)
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return fr


@router.post("/respond/{request_id}", response_model=schemas.FriendRequestOut)
def respond_to_request(
    request_id: int,
    accept: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    fr = db.query(models.FriendRequest).filter(models.FriendRequest.id == request_id).first()
    if not fr:
        raise HTTPException(404, "Request not found")
    if fr.receiver_id != current_user.id:
        raise HTTPException(403, "You can't respond to this request")
    if fr.status != models.FriendStatus.pending:
        raise HTTPException(400, "Request already handled")

    fr.status = models.FriendStatus.accepted if accept else models.FriendStatus.rejected
    db.commit()
    db.refresh(fr)
    return fr


@router.get("/pending", response_model=List[schemas.FriendRequestOut])
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Requests sent TO the current user that are still pending."""
    return (
        db.query(models.FriendRequest)
        .filter(
            models.FriendRequest.receiver_id == current_user.id,
            models.FriendRequest.status == models.FriendStatus.pending,
        )
        .all()
    )


@router.get("", response_model=List[schemas.UserPublic])
def list_friends(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """All accepted friends, regardless of who sent the original request."""
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
    friends = []
    for fr in accepted:
        friend = fr.receiver if fr.sender_id == current_user.id else fr.sender
        friends.append(friend)
    return friends


@router.delete("/{friend_id}", status_code=200)
def remove_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Unfriend someone — deletes the accepted friend request between you."""
    fr = (
        db.query(models.FriendRequest)
        .filter(
            or_(
                and_(models.FriendRequest.sender_id == current_user.id, models.FriendRequest.receiver_id == friend_id),
                and_(models.FriendRequest.sender_id == friend_id, models.FriendRequest.receiver_id == current_user.id),
            ),
            models.FriendRequest.status == models.FriendStatus.accepted,
        )
        .first()
    )
    if not fr:
        raise HTTPException(404, "You're not friends with this user")

    db.delete(fr)
    db.commit()
    return {"detail": "Friend removed"}


@router.post("/block/{user_id}", status_code=200)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Block a user — also removes any existing friendship/request between you."""
    if user_id == current_user.id:
        raise HTTPException(400, "You can't block yourself")

    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    already = (
        db.query(models.Block)
        .filter(models.Block.blocker_id == current_user.id, models.Block.blocked_id == user_id)
        .first()
    )
    if already:
        raise HTTPException(400, "User already blocked")

    fr = (
        db.query(models.FriendRequest)
        .filter(
            or_(
                and_(models.FriendRequest.sender_id == current_user.id, models.FriendRequest.receiver_id == user_id),
                and_(models.FriendRequest.sender_id == user_id, models.FriendRequest.receiver_id == current_user.id),
            )
        )
        .first()
    )
    if fr:
        db.delete(fr)

    db.add(models.Block(blocker_id=current_user.id, blocked_id=user_id))
    db.commit()
    return {"detail": "User blocked"}


@router.post("/unblock/{user_id}", status_code=200)
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    block = (
        db.query(models.Block)
        .filter(models.Block.blocker_id == current_user.id, models.Block.blocked_id == user_id)
        .first()
    )
    if not block:
        raise HTTPException(404, "This user isn't blocked")
    db.delete(block)
    db.commit()
    return {"detail": "User unblocked"}


@router.get("/blocked/list", response_model=List[schemas.UserPublic])
def list_blocked_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    blocks = db.query(models.Block).filter(models.Block.blocker_id == current_user.id).all()
    return [b.blocked for b in blocks]