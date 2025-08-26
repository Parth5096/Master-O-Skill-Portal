
const app = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./prisma");
const { ensure: ensureRedis } = require("./utils/redis");

const port = env.PORT;

async function main() {
  await prisma.$connect();
  console.log("Connected to the database");

  await ensureRedis();
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
