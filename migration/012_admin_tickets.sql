CREATE OR ALTER PROCEDURE sp_GetAdminTickets
    @Page INT = 1,
    @PageSize INT = 10,
    @SearchTerm NVARCHAR(50) = NULL,
    @Status NVARCHAR(50) = NULL,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    -- Calculate Total Count first
    SELECT @TotalCount = COUNT(*)
    FROM Tokens t
    WHERE 
        (@SearchTerm IS NULL OR 
         t.TokenNumber LIKE '%' + @SearchTerm + '%' OR 
         t.FullName LIKE '%' + @SearchTerm + '%' OR 
         t.Mobile LIKE '%' + @SearchTerm + '%')
        AND (@Status IS NULL OR t.Status = @Status)
        AND (@StartDate IS NULL OR CAST(t.CreatedAt AS DATE) >= @StartDate)
        AND (@EndDate IS NULL OR CAST(t.CreatedAt AS DATE) <= @EndDate);

    -- Return Paged Data
    SELECT t.*
    FROM Tokens t
    WHERE 
        (@SearchTerm IS NULL OR 
         t.TokenNumber LIKE '%' + @SearchTerm + '%' OR 
         t.FullName LIKE '%' + @SearchTerm + '%' OR 
         t.Mobile LIKE '%' + @SearchTerm + '%')
        AND (@Status IS NULL OR t.Status = @Status)
        AND (@StartDate IS NULL OR CAST(t.CreatedAt AS DATE) >= @StartDate)
        AND (@EndDate IS NULL OR CAST(t.CreatedAt AS DATE) <= @EndDate)
    ORDER BY t.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
