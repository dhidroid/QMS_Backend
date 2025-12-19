-- USE QMS_WEB_DB;
-- GO

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

    -- Log the action
    DECLARE @TokenId INT;
    SELECT @TokenId = TokenId FROM Tokens WHERE TokenGuid = @TokenGuid;

    IF @TokenId IS NOT NULL
    BEGIN
        INSERT INTO TokenLogs (TokenId, Action, PerformedBy, Remarks)
        VALUES (@TokenId, @NewStatus, @PerformedBy, @Remarks);
    END
END
GO

CREATE OR ALTER PROCEDURE sp_CallNextToken
    @PerformedBy NVARCHAR(100),
    @OutTokenGuid UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NextTokenId INT;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    -- Find the next pending token (ordered by TokenNumber)
    SELECT TOP 1 @NextTokenId = TokenId
    FROM Tokens
    WHERE Status = 'pending' AND TokenDate = @Today
    ORDER BY TokenNumber ASC;

    IF @NextTokenId IS NOT NULL
    BEGIN
        -- Update status to 'called'
        UPDATE Tokens
        SET Status = 'called',
            UpdatedAt = GETDATE()
        WHERE TokenId = @NextTokenId;

        -- Get Guid to return
        SELECT @OutTokenGuid = TokenGuid FROM Tokens WHERE TokenId = @NextTokenId;
        
        -- Log
        INSERT INTO TokenLogs (TokenId, Action, PerformedBy, Remarks)
        VALUES (@NextTokenId, 'called', @PerformedBy, 'Auto called next');
    END
END
GO
