-- Reset Database Schema and Load Data from CSV
-- This script resets the database and loads data from CSV files
-- WARNING: This will DELETE ALL EXISTING DATA!

-- =====================================================
-- STEP 1: Reset Schema (drop and recreate tables)
-- =====================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS addOns CASCADE;
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
    ingredients JSONB NOT NULL
);

-- Add-Ons Table
CREATE TABLE addOns (
    addOnID INT PRIMARY KEY,
    addOnName VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    ingredients JSONB NOT NULL
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
    items JSONB NOT NULL,
    time TIME NOT NULL,
    transactionType VARCHAR(20) NOT NULL CHECK (transactionType IN ('card', 'cash', 'void')),
    FOREIGN KEY (customerId) REFERENCES customerRewards(customerId) ON DELETE SET NULL
);

-- =====================================================
-- STEP 3: Create indexes
-- =====================================================

CREATE INDEX idx_customer_email ON customerRewards(email);
CREATE INDEX idx_customer_phone ON customerRewards(phoneNumber);
CREATE INDEX idx_customer_points ON customerRewards(points DESC);

CREATE INDEX idx_employee_auth ON employees(authLevel);

CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_item ON sales(itemName);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_customer ON transactions(customerId);
CREATE INDEX idx_transactions_type ON transactions(transactionType);

CREATE INDEX idx_menu_ingredients ON menu USING GIN (ingredients);
CREATE INDEX idx_addOns_ingredients ON addOns USING GIN (ingredients);
CREATE INDEX idx_transactions_items ON transactions USING GIN (items);

-- =====================================================
-- STEP 4: Add table comments
-- =====================================================

COMMENT ON TABLE customerRewards IS 'Customer loyalty program members and their reward points';
COMMENT ON TABLE employees IS 'Employee records with authorization levels';
COMMENT ON TABLE inventory IS 'Inventory items and current quantities';
COMMENT ON TABLE menu IS 'Menu items with pricing and ingredient requirements';
COMMENT ON TABLE addOns IS 'Add-on items with pricing and ingredient requirements';
COMMENT ON TABLE sales IS 'Historical sales data by item';
COMMENT ON TABLE transactions IS 'Transaction records with customer and item details';

-- =====================================================
-- STEP 5: Load data from CSV files
-- =====================================================
-- Note: Adjust the file paths to match your system
-- CSV files should be in the same directory as this script or provide full paths

-- Load Customer Rewards
\copy customerRewards(customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined) FROM 'customerRewards.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load Employees
\copy employees(employeeId, firstName, lastName, authLevel, startDate) FROM 'employees.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load Inventory
\copy inventory(itemId, itemName, quantity) FROM 'inventory.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load Menu (Note: ingredients is JSONB, so we need to handle it carefully)
-- For menu, you may need to use a different approach if the CSV has JSON strings
\copy menu(menuItemId, menuItemName, price, ingredients) FROM 'menu.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load Add-Ons (Note: ingredients is JSONB)
\copy addOns(addOnID, addOnName, price, ingredients) FROM 'addOns.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load Sales
\copy sales(saleId, itemName, amountSold, date, time) FROM 'sales.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load Transactions (Note: items is JSONB)
\copy transactions(transactionId, date, customerId, items, time, transactionType) FROM 'transactions.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- =====================================================
-- Verification queries
-- =====================================================

-- Count records in each table
SELECT 'customerRewards' as table_name, COUNT(*) as record_count FROM customerRewards
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'menu', COUNT(*) FROM menu
UNION ALL
SELECT 'addOns', COUNT(*) FROM addOns
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- =====================================================
-- Script completed!
-- =====================================================

