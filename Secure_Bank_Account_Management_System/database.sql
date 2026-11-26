-- ============================================================
-- Secure Bank Account Management System
-- SQL Database Schema (Reference for Firebase Firestore)
-- ============================================================

-- Customer Table
CREATE TABLE Customer (
    Customer_ID VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('customer', 'admin') DEFAULT 'customer',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account Table
CREATE TABLE Account (
    Account_ID VARCHAR(50) PRIMARY KEY,
    Customer_ID VARCHAR(50) NOT NULL,
    Account_Number VARCHAR(20) NOT NULL UNIQUE,
    Account_Type VARCHAR(20) DEFAULT 'Savings',
    Balance DECIMAL(15, 2) DEFAULT 0.00,
    Status VARCHAR(20) DEFAULT 'Active',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
);

-- Transaction Table
CREATE TABLE Transaction (
    Transaction_ID VARCHAR(50) PRIMARY KEY,
    Account_ID VARCHAR(50) NOT NULL,
    Transaction_Type ENUM('Deposit', 'Withdrawal', 'Transfer') NOT NULL,
    Amount DECIMAL(15, 2) NOT NULL,
    Balance_After DECIMAL(15, 2) NOT NULL,
    Description VARCHAR(255),
    Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) DEFAULT 'Completed',
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID)
);

-- Audit Log Table
CREATE TABLE AuditLog (
    Log_ID VARCHAR(50) PRIMARY KEY,
    Customer_ID VARCHAR(50),
    Email VARCHAR(100),
    Action VARCHAR(50) NOT NULL,
    Details TEXT,
    IP_Address VARCHAR(45),
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
);

-- Sample Data (for reference)
INSERT INTO Customer VALUES ('admin001', 'Admin User', 'admin@securebank.com', '9999999999', 'Admin@123', 'admin', NOW());
