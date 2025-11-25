-- Reset Database Schema Script
-- This script drops all existing tables and recreates them from scratch
-- WARNING: This will DELETE ALL DATA in the tables!
-- Use with caution in production environments

-- =====================================================
-- STEP 1: Drop all existing tables (CASCADE handles dependencies)
-- =====================================================

-- Drop tables in reverse dependency order to avoid constraint errors
-- Using CASCADE to automatically drop dependent objects (indexes, constraints, etc.)

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customerRewards CASCADE;

-- =====================================================
-- STEP 2: Create all tables
-- =====================================================

-- Customer Rewards Table
CREATE TABLE customerRewards (
    customerId INT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    DOB DATE NOT NULL,
    phoneNumber VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    points INT DEFAULT 0,
    dateJoined DATE NOT NULL
);

-- Employees Table
CREATE TABLE employees (
    employeeId INT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    authLevel VARCHAR(20) NOT NULL CHECK (authLevel IN ('Manager', 'Barista')),
    startDate DATE NOT NULL
);

-- Inventory Table
CREATE TABLE inventory (
    itemId INT PRIMARY KEY,
    itemName VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    CONSTRAINT positive_quantity CHECK (quantity >= 0)
);

-- Menu Table
CREATE TABLE menu (
    menuItemId INT PRIMARY KEY,
    menuItemName VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    ingredients JSONB NOT NULL  -- PostgreSQL native JSON type
);

-- Add-Ons Table
CREATE TABLE addOns (
    addOnID INT PRIMARY KEY,
    addOnName VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    ingredients JSONB NOT NULL -- PostgreSQL native JSON type
);

-- Sales Table
CREATE TABLE sales (
    saleId INT PRIMARY KEY,
    itemName VARCHAR(100) NOT NULL,
    amountSold INT NOT NULL CHECK (amountSold > 0),
    date DATE NOT NULL,
    time TIME NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
    transactionId INT PRIMARY KEY,
    date DATE NOT NULL,
    customerId INT,
    items JSONB NOT NULL,  -- PostgreSQL native JSON type
    time TIME NOT NULL,
    transactionType VARCHAR(20) NOT NULL CHECK (transactionType IN ('card', 'cash', 'void')),
    FOREIGN KEY (customerId) REFERENCES customerRewards(customerId) ON DELETE SET NULL
);

-- =====================================================
-- STEP 3: Create indexes for better query performance
-- =====================================================

-- Customer Rewards Indexes
CREATE INDEX idx_customer_email ON customerRewards(email);
CREATE INDEX idx_customer_phone ON customerRewards(phoneNumber);
CREATE INDEX idx_customer_points ON customerRewards(points DESC);

-- Employee Indexes
CREATE INDEX idx_employee_auth ON employees(authLevel);

-- Sales Indexes
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_item ON sales(itemName);

-- Transaction Indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_customer ON transactions(customerId);
CREATE INDEX idx_transactions_type ON transactions(transactionType);

-- GIN indexes for JSONB columns (PostgreSQL specific)
CREATE INDEX idx_menu_ingredients ON menu USING GIN (ingredients);
CREATE INDEX idx_addOns_ingredients ON addOns USING GIN (ingredients);
CREATE INDEX idx_transactions_items ON transactions USING GIN (items);

-- =====================================================
-- STEP 4: Add table comments for documentation
-- =====================================================

COMMENT ON TABLE customerRewards IS 'Customer loyalty program members and their reward points';
COMMENT ON TABLE employees IS 'Employee records with authorization levels';
COMMENT ON TABLE inventory IS 'Inventory items and current quantities';
COMMENT ON TABLE menu IS 'Menu items with pricing and ingredient requirements';
COMMENT ON TABLE addOns IS 'Add-on items with pricing and ingredient requirements';
COMMENT ON TABLE sales IS 'Historical sales data by item';
COMMENT ON TABLE transactions IS 'Transaction records with customer and item details';

-- =====================================================
-- Script completed successfully!
-- =====================================================

-- Next steps:
-- 1. Load data from CSV files if needed
-- 2. Verify tables were created: \dt (in psql)
-- 3. Check table structure: \d tablename (in psql)

