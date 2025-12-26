CREATE OR ALTER PROCEDURE sp_GetForms
    @OnlyActive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FormId, Title, IsActive, CreatedAt, UpdatedAt, IsDefault
    FROM FormDefinitions
    WHERE (@OnlyActive = 0 OR IsActive = 1)
    ORDER BY CreatedAt DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_GetFormById
    @FormId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FormId, Title, SchemaJson, IsActive, CreatedAt, UpdatedAt, IsDefault
    FROM FormDefinitions
    WHERE FormId = @FormId;
END
GO
