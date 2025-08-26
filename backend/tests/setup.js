require("dotenv").config();
const { prisma } = require("../src/prisma");
const { flushAll, disconnect: redisDisconnect, ensure } = require("../src/utils/redis");

process.env.DATABASE_URL = process.env.DATABASE_URL || "mysql://skill_user:skill_pass@127.0.0.1:3306/skill_portal";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

beforeAll(async () => {
  await prisma.$connect();
  await ensure();
  await resetDb();
  await flushAll();
});

beforeEach(async () => {
  await resetDb();
  await flushAll();
});

afterAll(async () => {
  try { await prisma.$disconnect(); } catch {}
  try { await redisDisconnect(); } catch {}
});

async function resetDb() {
  // Delete in FK-safe order; table names match Prisma models
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();
}
