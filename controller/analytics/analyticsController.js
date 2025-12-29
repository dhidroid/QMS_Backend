const { getPool, sql } = require("../../config/db.config.js");

async function getAnalytics(req, res) {
  try {
    const pool = await getPool();
    const range = req.query.range || 'week'; // 'today', 'week', 'month'
    const result = await pool.request()
      .input("TimeRange", sql.VarChar(20), range)
      .execute("sp_GetAnalytics");

    // Result sets:
    // [0] -> Summary Counts
    // [1] -> Trend (Hourly or Daily)
    // [2] -> Status Breakdown (Pie)
    
    const summary = result.recordsets[0][0]; // Single row
    const trend = result.recordsets[1]; 
    const pieData = result.recordsets[2];

    res.json({
      success: true,
      range,
      summary: {
        total: summary.TotalTickets,
        pending: summary.PendingTickets,
        served: summary.ServedTickets,
        active: summary.ActiveTickets,
        cancelled: summary.CancelledTickets
      },
      trend: trend,
      pieData: pieData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
}

module.exports = { getAnalytics };
