USE QMS_WEB_DB;
GO

-- Add CounterName column if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Tokens' AND COLUMN_NAME = 'CounterName'
)
BEGIN
    ALTER TABLE Tokens ADD CounterName NVARCHAR(50) NULL;
END
GO

-- Update sp_CallNextToken to assign counter
CREATE OR ALTER PROCEDURE sp_CallNextToken
    @PerformedBy NVARCHAR(100),
    @CounterName NVARCHAR(50),
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
        -- Update status and counter
        UPDATE Tokens
        SET Status = 'called',
            CounterName = @CounterName,
            UpdatedAt = GETDATE()
        WHERE TokenId = @NextTokenId;

        -- Get Guid to return
        SELECT @OutTokenGuid = TokenGuid FROM Tokens WHERE TokenId = @NextTokenId;
        
        -- Log
        INSERT INTO TokenLogs (TokenId, Action, PerformedBy, Remarks)
        VALUES (@NextTokenId, 'called', @PerformedBy, 'Auto called to ' + ISNULL(@CounterName, 'Unknown'));
    END
END
GO

-- Update sp_UpdateTokenStatus (optional, just to keep consistent if manual)
CREATE OR ALTER PROCEDURE sp_UpdateTokenStatus
    @TokenGuid UNIQUEIDENTIFIER,
    @NewStatus NVARCHAR(50),
    @PerformedBy NVARCHAR(100),
    @Remarks NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Tokens
    SET Status = @NewStatus,
        UpdatedAt = GETDATE()
    WHERE TokenGuid = @TokenGuid;

    DECLARE @TokenId INT;
    SELECT @TokenId = TokenId FROM Tokens WHERE TokenGuid = @TokenGuid;

    IF @TokenId IS NOT NULL
    BEGIN
        INSERT INTO TokenLogs (TokenId, Action, PerformedBy, Remarks)
        VALUES (@TokenId, @NewStatus, @PerformedBy, @Remarks);
    END
END
GO
