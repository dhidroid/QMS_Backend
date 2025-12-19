-- USE QMS_WEB_DB;
-- GO

CREATE OR ALTER PROCEDURE sp_CreateToken
    @FullName NVARCHAR(200),
    @Mobile NVARCHAR(50),
    @Purpose NVARCHAR(200),
    @Extra NVARCHAR(MAX),
    @OutTokenGuid UNIQUEIDENTIFIER OUTPUT,
    @OutTokenNumber INT OUTPUT,
    @OutQRCode NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @NextNum INT;

    -- Calculate next token number for today
    SELECT @NextNum = ISNULL(MAX(TokenNumber), 0) + 1
    FROM Tokens
    WHERE TokenDate = @Today;

    DECLARE @NewTable TABLE (TokenGuid UNIQUEIDENTIFIER);

    INSERT INTO Tokens (TokenNumber, TokenDate, FullName, Mobile, Purpose, Status, Extra)
    OUTPUT INSERTED.TokenGuid INTO @NewTable
    VALUES (@NextNum, @Today, @FullName, @Mobile, @Purpose, 'pending', @Extra);

    SELECT @OutTokenGuid = TokenGuid FROM @NewTable;
    SET @OutTokenNumber = @NextNum;
    
    -- Generate the QR Payload (JSON with ID and details)
    -- Using JSON_QUERY/FOR JSON PATH to ensure specific format
    SET @OutQRCode = (
        SELECT 
            @OutTokenGuid as id, 
            @NextNum as number, 
            @FullName as name, 
            @Purpose as purpose, 
            'pending' as status,
            FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm:ss') as createdAt
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );
END
GO

CREATE OR ALTER PROCEDURE sp_GetTokenByGuid
    @TokenGuid UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Tokens WHERE TokenGuid = @TokenGuid;
END
GO
