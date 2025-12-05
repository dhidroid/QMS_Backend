const { getPool, sql, closePool } = require("./config/db.config");
const { hashPassword } = require("./utils/helpers");

async function createAdmin() {
  const username = "admin";
  const password = "admin123";
  const role = "admin";
  const displayName = "System Admin";

  try {
    console.log("Creating admin user...");
    const pool = await getPool();
    const hash = await hashPassword(password);

    await pool
      .request()
      .input("Username", sql.NVarChar(100), username)
      .input("PasswordHash", sql.NVarChar(500), hash)
      .input("Role", sql.NVarChar(50), role)
      .input("DisplayName", sql.NVarChar(200), displayName)
      .execute("sp_CreateUser");

    console.log("\n✅ Admin user created successfully!");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error("\n❌ Failed to create admin user:", err.message);
  } finally {
    await closePool();
  }
}

createAdmin();
