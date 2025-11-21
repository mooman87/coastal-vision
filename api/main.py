# api/main.py
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from uuid import uuid4
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
import models
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from schemas import (
    UserCreate,
    UserUpdate,
    UserOut,
    Token,
    PropertyCreate,
    PropertyUpdate,
    PropertyOut,
    PropertyImageCreate,
    PropertyImageOut,
)

from typing import List

from pydantic import BaseModel

app = FastAPI()

MEDIA_DIR = "media"
os.makedirs(MEDIA_DIR, exist_ok=True)

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://coastalvision.netlify.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------- User helpers & RBAC --------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = get_user_by_email(db, email=email)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or unknown user",
        )
    return user


def require_broker(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "broker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Broker role required",
        )
    return current_user


def require_broker_or_agent(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if current_user.role not in ("broker", "agent"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Broker or agent role required",
        )
    return current_user


# -------- Auth routes --------

@app.post("/auth/register", response_model=UserOut)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    For now, open registration. In prod, you might:
      - only allow first user
      - or require an invite code
    """
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # If registering as agent without broker_id, you can enforce rules here
    if user_in.role == "agent" and user_in.broker_id is None:
        # optional: require broker assignment
        pass

    user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        broker_id=user_in.broker_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token)


@app.get("/auth/me", response_model=UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


# -------- Users CRUD (Broker-only) --------

@app.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker),
):
    """
    Brokers see themselves + their agents.
    """
    users = (
        db.query(models.User)
        .filter(
            (models.User.id == current_user.id)
            | (models.User.broker_id == current_user.id)
        )
        .order_by(models.User.created_at.desc())
        .all()
    )
    return users


@app.post("/users", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker),
):
    """
    Broker creates users (usually agents).
    Force agents to belong to this broker.
    """
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    broker_id = user_in.broker_id
    if user_in.role == "agent":
        broker_id = current_user.id  # agents belong to the logged-in broker

    user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        broker_id=broker_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ensure broker owns this user or it's themselves
    if user.id != current_user.id and user.broker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to view this user")

    return user


@app.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id != current_user.id and user.broker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to update this user")

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.broker_id is not None:
        user.broker_id = user_in.broker_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)
    return user


@app.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker),
):
    """
    Soft delete: set is_active = False
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id != current_user.id and user.broker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this user")

    user.is_active = False
    db.commit()
    return None


# -------- Properties CRUD --------

@app.get("/properties", response_model=List[PropertyOut])
def list_properties(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):
    """
    Brokers: all properties owned by themselves or their agents.
    Agents: only their own properties.
    """
    query = db.query(models.Property).filter(models.Property.is_archived == False)

    if current_user.role == "broker":
        # properties owned by broker or any of their agents
        agent_ids = (
            db.query(models.User.id)
            .filter(models.User.broker_id == current_user.id)
            .subquery()
        )
        query = query.filter(
            (models.Property.owner_id == current_user.id)
            | (models.Property.owner_id.in_(agent_ids))
        )
    else:
        # agent
        query = query.filter(models.Property.owner_id == current_user.id)

    props = query.order_by(models.Property.created_at.desc()).all()
    return props


@app.post("/properties", response_model=PropertyOut)
def create_property(
    property_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):

    images_data = property_in.images or []
    prop_data = property_in.model_dump(exclude={"images"})

    prop = models.Property(
        **prop_data,
        owner_id=current_user.id,
    )
    db.add(prop)
    db.flush()

    for img in images_data:
        img_obj = models.PropertyImage(
            property_id=prop.id,
            url=img.url,
            caption=img.caption,
            order_index=img.order_index,
        )
        db.add(img_obj)

    db.commit()
    db.refresh(prop)
    return prop


@app.get("/properties/{property_id}", response_model=PropertyOut)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop or prop.is_archived:
        raise HTTPException(status_code=404, detail="Property not found")

    
    if current_user.role == "broker":
        agent_ids = (
            db.query(models.User.id)
            .filter(models.User.broker_id == current_user.id)
            .subquery()
        )
        if prop.owner_id not in [current_user.id] and prop.owner_id not in [
            r[0] for r in db.query(models.User.id).filter(models.User.broker_id == current_user.id)
        ]:
            raise HTTPException(status_code=403, detail="Not allowed to access this property")
    else:
        if prop.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed to access this property")

    return prop


@app.put("/properties/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    property_in: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # same permission logic as get_property
    if current_user.role == "broker":
        agent_ids = (
            db.query(models.User.id)
            .filter(models.User.broker_id == current_user.id)
            .subquery()
        )
        # quick check: owner is broker or one of their agents
        if prop.owner_id != current_user.id and not db.query(models.User).filter(
            models.User.id == prop.owner_id,
            models.User.broker_id == current_user.id,
        ).first():
            raise HTTPException(status_code=403, detail="Not allowed to update this property")
    else:
        if prop.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed to update this property")

    data = property_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)
    return prop


@app.delete("/properties/{property_id}", status_code=204)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # same permission logic
    if current_user.role == "broker":
        if prop.owner_id != current_user.id and not db.query(models.User).filter(
            models.User.id == prop.owner_id,
            models.User.broker_id == current_user.id,
        ).first():
            raise HTTPException(status_code=403, detail="Not allowed to delete this property")
    else:
        if prop.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed to delete this property")

    prop.is_archived = True
    db.commit()
    return None

@app.post(
    "/properties/{property_id}/images",
    response_model=List[PropertyImageOut],
)
def add_property_images(
    property_id: int,
    images_in: List[PropertyImageCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop or prop.is_archived:
        raise HTTPException(status_code=404, detail="Property not found")

    # Same permission logic as update_property
    if current_user.role == "broker":
        if prop.owner_id != current_user.id and not db.query(models.User).filter(
            models.User.id == prop.owner_id,
            models.User.broker_id == current_user.id,
        ).first():
            raise HTTPException(status_code=403, detail="Not allowed to modify this property")
    else:
        if prop.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed to modify this property")

    created_images: List[models.PropertyImage] = []

    for img in images_in:
        img_obj = models.PropertyImage(
            property_id=prop.id,
            url=img.url,
            caption=img.caption,
            order_index=img.order_index,
        )
        db.add(img_obj)
        created_images.append(img_obj)

    db.commit()
    # refresh from DB to include IDs
    for img_obj in created_images:
        db.refresh(img_obj)

    return created_images

@app.delete(
    "/properties/{property_id}/images/{image_id}",
    status_code=204,
)
def delete_property_image(
    property_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_broker_or_agent),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop or prop.is_archived:
        raise HTTPException(status_code=404, detail="Property not found")

    # permission check as before
    if current_user.role == "broker":
        if prop.owner_id != current_user.id and not db.query(models.User).filter(
            models.User.id == prop.owner_id,
            models.User.broker_id == current_user.id,
        ).first():
            raise HTTPException(status_code=403, detail="Not allowed to modify this property")
    else:
        if prop.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed to modify this property")

    image = (
        db.query(models.PropertyImage)
        .filter(
            models.PropertyImage.id == image_id,
            models.PropertyImage.property_id == property_id,
        )
        .first()
    )

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    db.delete(image)
    db.commit()
    return None


# -------- Public Listings (no auth) --------

@app.get("/public/properties", response_model=List[PropertyOut])
def list_public_properties(db: Session = Depends(get_db)):
    """
    Public-facing listings:
    - all non-archived properties
    - regardless of owner
    """
    props = (
        db.query(models.Property)
        .filter(models.Property.is_archived == False)
        .order_by(models.Property.created_at.desc())
        .all()
    )
    return props


@app.get("/public/properties/{property_id}", response_model=PropertyOut)
def get_public_property(
    property_id: int,
    db: Session = Depends(get_db),
):
    prop = (
        db.query(models.Property)
        .filter(
            models.Property.id == property_id,
            models.Property.is_archived == False,
        )
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@app.post("/uploads/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a single image file and return a URL that can be used in PropertyImage.url
    """
    # Simple extension handling
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join(MEDIA_DIR, filename)

    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Public URL (served by StaticFiles)
    url = f"/media/{filename}"
    return {"url": url}


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    user_message = payload.message.strip()

    # 🧠 Very simple rule-based "assistant" for now
    text = user_message.lower()
    if "mortgage" in text or "loan" in text:
        reply = (
            "Great question! In South Carolina, most buyers use a conventional, FHA, or VA loan. "
            "I can help you estimate a monthly payment if you tell me your price range and down payment."
        )
    elif "charleston" in text or "myrtle" in text or "greenville" in text:
        reply = (
            "Those are all popular areas in South Carolina. Tell me your budget and what kind of lifestyle "
            "you’re looking for (urban, suburban, coastal, etc.), and I can suggest specific neighborhoods."
        )
    elif "tour" in text or "showing" in text or "visit" in text:
        reply = (
            "I can help you get ready to book a tour. What days and times usually work best for you, "
            "and which area or specific property are you interested in?"
        )
    else:
        reply = (
            "I’m here to help with South Carolina real estate—neighborhoods, prices, mortgages, or booking tours. "
            "What would you like to know?"
        )

    return ChatResponse(reply=reply)