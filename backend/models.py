"""Pydantic models for request/response validation"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Literal
from datetime import date, time
from decimal import Decimal

# Menu Models
class MenuItem(BaseModel):
    menuItemId: int
    menuItemName: str
    price: Decimal
    ingredients: Any  # JSONB field

class MenuResponse(BaseModel):
    menuItems: List[MenuItem]

# Add-On Models
class AddOnItem(BaseModel):
    addOnID: int
    addOnName: str
    price: Decimal
    ingredients: Any  # JSONB field

class AddOnResponse(BaseModel):
    addOns: List[AddOnItem]

# Transaction Models
class TransactionItem(BaseModel):
    menuItemId: int
    addOnIDs: List[int] = None
    quantity: int

    ice: Literal["light", "normal", "extra"]
    sweetness: Literal["0%", "25%", "50%", "75%", "100%"]

class TransactionCreate(BaseModel):
    customerId: Optional[int] = None
    items: List[TransactionItem]
    transactionType: str = Field(..., pattern="^(card|cash|void)$")
    date: Optional[str] = None  # Accept date as string (YYYY-MM-DD) or None
    time: Optional[str] = None  # Accept time as string (HH:MM:SS) or None
    tip: Optional[Decimal] = 0  # Optional tip amount

class TransactionResponse(BaseModel):
    transactionId: int
    message: str
    total: Decimal

class TransactionDetail(BaseModel):
    transactionId: int
    date: date
    time: time
    customerId: Optional[int]
    items: Any  # JSONB field
    transactionType: str
    total: Optional[Decimal] = None

class TransactionListResponse(BaseModel):
    transactions: List[TransactionDetail]
    total: int
    limit: int
    offset: int

# Customer Models
class Customer(BaseModel):
    customerId: int
    firstName: str
    lastName: str
    DOB: date
    phoneNumber: str
    email: EmailStr
    points: int
    dateJoined: date

class CustomerCreate(BaseModel):
    firstName: str
    lastName: str
    DOB: date
    phoneNumber: str
    email: EmailStr

class CustomerListResponse(BaseModel):
    customers: List[Customer]

class CustomerRewards(BaseModel):
    customerId: int
    points: int
    pointsEarned: Optional[int] = 0
    pointsRedeemed: Optional[int] = 0

class UpdatePoints(BaseModel):
    points: int
    reason: Optional[str] = None

# Inventory Models
class InventoryItem(BaseModel):
    itemId: int
    itemName: str
    quantity: Decimal

class InventoryResponse(BaseModel):
    inventory: List[InventoryItem]

class UpdateInventory(BaseModel):
    quantity: Decimal
    reason: Optional[str] = None

# Sales Models
class SaleItem(BaseModel):
    saleId: int
    itemName: str
    amountSold: int
    date: date
    time: time

class SalesResponse(BaseModel):
    sales: List[SaleItem]
    totalSales: Optional[int] = None
    totalRevenue: Optional[Decimal] = None

class TopSellingItem(BaseModel):
    itemName: str
    quantity: int
    revenue: Decimal

class SalesByDate(BaseModel):
    date: date
    sales: int
    revenue: Decimal

class SalesSummary(BaseModel):
    totalSales: int
    totalRevenue: Decimal
    averageOrderValue: Decimal
    topItems: List[TopSellingItem]
    salesByDate: Optional[List[SalesByDate]] = None

# Employee Models
class Employee(BaseModel):
    employeeId: int
    firstName: str
    lastName: str
    authLevel: str
    startDate: date

class EmployeeListResponse(BaseModel):
    employees: List[Employee]

class LoginRequest(BaseModel):
    employeeId: int
    password: Optional[str] = None

class LoginResponse(BaseModel):
    employeeId: int
    firstName: str
    lastName: str
    authLevel: str
    token: Optional[str] = None

# Error Response
class ErrorResponse(BaseModel):
    error: str
    code: Optional[str] = None

