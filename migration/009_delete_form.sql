CREATE OR ALTER PROCEDURE sp_DeleteForm
    @FormId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if form exists
    IF EXISTS (SELECT 1 FROM FormDefinitions WHERE FormId = @FormId)
    BEGIN
        DELETE FROM FormDefinitions WHERE FormId = @FormId;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success;
    END
END
GO
