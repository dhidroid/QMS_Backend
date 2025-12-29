-- Migration: 010_queue_enhancements.sql

-- 1. Create Feedbacks Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Feedbacks')
BEGIN
    CREATE TABLE Feedbacks (
        FeedbackId INT PRIMARY KEY IDENTITY(1,1),
        TokenGuid UNIQUEIDENTIFIER NOT NULL,
        Rating INT CHECK (Rating >= 1 AND Rating <= 5),
        Comments NVARCHAR(1000),
        CreatedAt DATETIME DEFAULT GETDATE()
        -- Removed FK as requested to allow flexibility
        -- FOREIGN KEY (TokenGuid) REFERENCES Tokens(TokenGuid)
    );
END
GO

-- 2. Update sp_CallNextToken to support CounterName
CREATE OR ALTER PROCEDURE sp_CallNextToken
    @PerformedBy NVARCHAR(100),
    @CounterName NVARCHAR(50),  -- Added Parameter
    @OutTokenGuid UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NextTokenId INT;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    -- Find the next pending token
    SELECT TOP 1 @NextTokenId = TokenId
    FROM Tokens
    WHERE Status = 'pending' AND TokenDate = @Today
    ORDER BY TokenNumber ASC;

    IF @NextTokenId IS NOT NULL
    BEGIN
        -- Update status and set CounterName
        UPDATE Tokens
        SET Status = 'called',
            CounterName = @CounterName, -- Set Counter
            UpdatedAt = GETDATE()
        WHERE TokenId = @NextTokenId;

        -- Get Guid to return
        SELECT @OutTokenGuid = TokenGuid FROM Tokens WHERE TokenId = @NextTokenId;
        
        -- Log
        INSERT INTO TokenLogs (TokenId, Action, PerformedBy, Remarks)
        VALUES (@NextTokenId, 'called', @PerformedBy, 'Auto called to ' + @CounterName);
    END
END
GO

-- 3. Update sp_UpdateTokenStatus to support optional CounterName
CREATE OR ALTER PROCEDURE sp_UpdateTokenStatus
    @TokenGuid UNIQUEIDENTIFIER,
    @NewStatus NVARCHAR(50),
    @PerformedBy NVARCHAR(100),
    @Remarks NVARCHAR(500),
    @CounterName NVARCHAR(50) = NULL -- Optional
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Tokens
    SET Status = @NewStatus,
        UpdatedAt = GETDATE(),
        CounterName = ISNULL(@CounterName, CounterName) -- Update only if provided
    WHERE TokenGuid = @TokenGuid;

    -- Log
    DECLARE @TokenId INT;
    SELECT @TokenId = TokenId FROM Tokens WHERE TokenGuid = @TokenGuid;

    IF @TokenId IS NOT NULL
    BEGIN
        INSERT INTO TokenLogs (TokenId, Action, PerformedBy, Remarks)
        VALUES (@TokenId, @NewStatus, @PerformedBy, @Remarks);
    END
END
GO

-- 4. Create sp_SubmitFeedback
CREATE OR ALTER PROCEDURE sp_SubmitFeedback
    @TokenGuid UNIQUEIDENTIFIER,
    @Rating INT,
    @Comments NVARCHAR(1000)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Feedbacks (TokenGuid, Rating, Comments)
    VALUES (@TokenGuid, @Rating, @Comments);
END
GO
