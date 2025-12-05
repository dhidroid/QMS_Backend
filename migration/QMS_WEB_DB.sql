CREATE DATABASE QMS_WEB_DB;
USE  QMS_WEB_DB
GO


CREATE TABLE SystemConfig (
    ConfigId INT IDENTITY(1,1) PRIMARY KEY,
    ConfigKey NVARCHAR(100) NOT NULL,
    ConfigValue NVARCHAR(500) NULL
)


CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- 'admin' or 'handler'
    DisplayName NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);


CREATE TABLE Tokens (
    TokenId INT IDENTITY(1,1) PRIMARY KEY,
    TokenGuid UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TokenNumber INT NOT NULL, -- day-based sequential number
    TokenDate DATE NOT NULL, -- date part for grouping per day
    FullName NVARCHAR(200),
    Mobile NVARCHAR(50),
    Purpose NVARCHAR(200),
    QRCodeBase64 NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, called, served, cancelled
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    Extra JSON NULL
);

CREATE TABLE TokenLogs (
    LogId INT IDENTITY(1,1) PRIMARY KEY,
    TokenId INT NOT NULL,
    Action NVARCHAR(100),
    PerformedBy NVARCHAR(100) NULL,
    Remarks NVARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);


CREATE TABLE PushSubscriptions (
    SubId INT IDENTITY(1,1) PRIMARY KEY,
    Endpoint NVARCHAR(1000),
    Keys NVARCHAR(MAX), -- store JSON of keys
    CreatedAt DATETIME DEFAULT GETDATE()
);