CREATE OR ALTER PROCEDURE sp_GetAnalytics
    @TimeRange VARCHAR(20) = 'week' -- 'today', 'week', 'month'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATETIME;
    DECLARE @EndDate DATETIME = GETDATE();

    IF @TimeRange = 'today'
        SET @StartDate = CAST(GETDATE() AS DATE); -- Start of today
    ELSE IF @TimeRange = 'month'
        SET @StartDate = DATEADD(month, -1, GETDATE());
    ELSE
        SET @StartDate = DATEADD(day, -7, GETDATE()); -- Default week

    -- 1. Summary Counts (Filtered by Range)
    SELECT 
        (SELECT COUNT(*) FROM Tokens WHERE CreatedAt >= @StartDate) AS TotalTickets,
        (SELECT COUNT(*) FROM Tokens WHERE Status = 'pending' AND CreatedAt >= @StartDate) AS PendingTickets,
        (SELECT COUNT(*) FROM Tokens WHERE (Status = 'served' OR Status = 'completed') AND CreatedAt >= @StartDate) AS ServedTickets,
        (SELECT COUNT(*) FROM Tokens WHERE (Status = 'active' OR Status = 'called') AND CreatedAt >= @StartDate) AS ActiveTickets,
        (SELECT COUNT(*) FROM Tokens WHERE (Status = 'cancelled' OR Status = 'noshow') AND CreatedAt >= @StartDate) AS CancelledTickets;

    -- 2. Trend (Graph Data)
    -- Group by hour for 'today', else by date
    IF @TimeRange = 'today'
    BEGIN
        SELECT 
            FORMAT(CreatedAt, 'HH:00') AS Label,
            COUNT(*) AS Count
        FROM Tokens
        WHERE CreatedAt >= @StartDate
        GROUP BY FORMAT(CreatedAt, 'HH:00')
        ORDER BY Label;
    END
    ELSE
    BEGIN
        SELECT 
            FORMAT(CreatedAt, 'yyyy-MM-dd') AS Label,
            COUNT(*) AS Count
        FROM Tokens
        WHERE CreatedAt >= @StartDate
        GROUP BY FORMAT(CreatedAt, 'yyyy-MM-dd')
        ORDER BY Label;
    END

    -- 3. Pie Chart Data (Status Breakdown)
    SELECT 
        Status,
        COUNT(*) AS Count
    FROM Tokens
    WHERE CreatedAt >= @StartDate
    GROUP BY Status;

END
GO
