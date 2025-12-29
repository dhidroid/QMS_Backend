CREATE OR ALTER PROCEDURE sp_GetAnalytics
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Summary Counts
    SELECT 
        (SELECT COUNT(*) FROM Tokens) AS TotalTickets,
        (SELECT COUNT(*) FROM Tokens WHERE Status = 'pending') AS PendingTickets,
        (SELECT COUNT(*) FROM Tokens WHERE Status = 'served' OR Status = 'completed') AS ServedTickets,
        (SELECT COUNT(*) FROM Tokens WHERE Status = 'active' OR Status = 'called') AS ActiveTickets,
        (SELECT COUNT(*) FROM Tokens WHERE Status = 'cancelled' OR Status = 'noshow') AS CancelledTickets;

    -- Last 7 Days Trend
    SELECT 
        FORMAT(CreatedAt, 'yyyy-MM-dd') AS Date,
        COUNT(*) AS Count
    FROM Tokens
    WHERE CreatedAt >= DATEADD(day, -7, GETDATE())
    GROUP BY FORMAT(CreatedAt, 'yyyy-MM-dd')
    ORDER BY Date;
END
GO
