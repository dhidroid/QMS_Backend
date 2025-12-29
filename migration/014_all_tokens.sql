CREATE OR ALTER PROCEDURE sp_GetAllTokens
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TokenGuid,
        t.TokenNumber,
        t.TokenDate,
        t.FullName,
        t.Mobile,
        t.Purpose,
        t.Status,
        t.CounterName,
        t.CreatedAt,
        t.UpdatedAt
    FROM Tokens t
    ORDER BY t.CreatedAt DESC;
END
GO
