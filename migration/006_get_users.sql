-- Stored Procedure: Get All Users
CREATE OR ALTER PROCEDURE sp_GetUsers
AS
BEGIN
    SET NOCOUNT ON;

    SELECT UserId, Username, Role, DisplayName, IsActive, CreatedAt
    FROM Users
    ORDER BY CreatedAt DESC;
END
GO
