CREATE OR ALTER PROCEDURE sp_GetTokenBySearch
    @SearchTerm NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Try to match TokenNumber (exact) or Mobile (exact or partial if needed, sticking to exact for privacy)
    SELECT TOP 1 TokenGuid
    FROM Tokens
    WHERE TokenNumber = @SearchTerm OR Mobile = @SearchTerm
    ORDER BY CreatedAt DESC; -- Get latest if multiple matches for mobile
END
