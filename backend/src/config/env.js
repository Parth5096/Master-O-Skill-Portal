require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "skills",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10)
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

module.exports = { env };
