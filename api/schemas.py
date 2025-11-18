# api/schemas.py
from __future__ import annotations

from pydantic import BaseModel, EmailStr, constr
from typing import Optional, Literal, List


# -------- Users --------

Role = Literal["broker", "agent"]


class UserBase(BaseModel):
    email: EmailStr
    role: Role = "agent"
    broker_id: Optional[int] = None


class UserCreate(UserBase):
    password: constr(min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    broker_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: Role
    broker_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# -------- Properties --------

class PropertyImageBase(BaseModel):
    url: str
    caption: Optional[str] = None
    order_index: Optional[int] = None


class PropertyImageCreate(PropertyImageBase):
    pass


class PropertyImageOut(PropertyImageBase):
    id: int
    property_id: int

    class Config:
        from_attributes = True

class PropertyBase(BaseModel):
    mls_id: Optional[str] = None
    address: str
    city: str
    state: str
    zip_code: str
    price: Optional[float] = None
    beds: Optional[int] = None
    baths: Optional[float] = None
    sqft: Optional[int] = None


class PropertyCreate(PropertyBase):
    images: Optional[List[PropertyImageCreate]] = None


class PropertyUpdate(BaseModel):
    mls_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    price: Optional[float] = None
    beds: Optional[int] = None
    baths: Optional[float] = None
    sqft: Optional[int] = None
    is_archived: Optional[bool] = None


class PropertyOut(PropertyBase):
    id: int
    owner_id: Optional[int]
    is_archived: bool
    images: List[PropertyImageOut] = []

    class Config:
        from_attributes = True

