const jwt = require("jsonwebtoken");

function auth(role) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "no token" });
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
      req.user = payload;

      // Role Hierarchy: 'admin' > 'handler'
      if (role) {
          const userRole = payload.role;
          if (userRole === role) {
              // Exact match, OK
              next();
          } else if (role === 'handler' && userRole === 'admin') {
              // Admin is allowed to access Handler routes
              next();
          } else {
             return res.status(403).json({ message: "forbidden" });
          }
      } else {
          next();
      }
    } catch (err) {
      return res.status(401).json({ message: "invalid token" });
    }
  };
}

module.exports = { auth };

