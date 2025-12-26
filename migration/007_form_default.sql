IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FormDefinitions' AND COLUMN_NAME = 'IsDefault')
BEGIN
    ALTER TABLE FormDefinitions ADD IsDefault BIT DEFAULT 0;
END
GO

CREATE OR ALTER PROCEDURE sp_SetFormDefault
    @FormId INT
AS
BEGIN
    UPDATE FormDefinitions SET IsDefault = 0;
    UPDATE FormDefinitions SET IsDefault = 1 WHERE FormId = @FormId;
END
GO

CREATE OR ALTER PROCEDURE sp_GetDefaultForm
AS
BEGIN
    SELECT TOP 1 * FROM FormDefinitions WHERE IsDefault = 1 AND IsActive = 1 ORDER BY CreatedAt DESC;
END
GO
