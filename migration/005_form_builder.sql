-- Create FormDefinitions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FormDefinitions]') AND type in (N'U'))
BEGIN
    CREATE TABLE FormDefinitions (
        FormId INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        SchemaJson NVARCHAR(MAX) NOT NULL, -- The JSON structure of the form
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
    );
END
GO

-- Stored Procedure: Create or Update Form
CREATE OR ALTER PROCEDURE sp_SaveForm
    @FormId INT = NULL,
    @Title NVARCHAR(200),
    @SchemaJson NVARCHAR(MAX),
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;

    IF @FormId IS NULL OR @FormId = 0
    BEGIN
        INSERT INTO FormDefinitions (Title, SchemaJson, IsActive, CreatedAt)
        VALUES (@Title, @SchemaJson, @IsActive, GETDATE());
        
        SELECT SCOPE_IDENTITY() AS FormId;
    END
    ELSE
    BEGIN
        UPDATE FormDefinitions
        SET Title = @Title,
            SchemaJson = @SchemaJson,
            IsActive = @IsActive,
            UpdatedAt = GETDATE()
        WHERE FormId = @FormId;
        
        SELECT @FormId AS FormId;
    END
END
GO

-- Stored Procedure: Get All Forms
CREATE OR ALTER PROCEDURE sp_GetForms
    @OnlyActive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FormId, Title, IsActive, CreatedAt, UpdatedAt
    FROM FormDefinitions
    WHERE (@OnlyActive = 0 OR IsActive = 1)
    ORDER BY CreatedAt DESC;
END
GO

-- Stored Procedure: Get Form By ID
CREATE OR ALTER PROCEDURE sp_GetFormById
    @FormId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FormId, Title, SchemaJson, IsActive, CreatedAt, UpdatedAt
    FROM FormDefinitions
    WHERE FormId = @FormId;
END
GO
