const request = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/prisma");

async function makeAdminAndToken(email = "admin@example.com") {
  await request(app).post("/api/auth/register")
    .send({ fullName: "Admin", email, password: "Admin@123" });
  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  const { body } = await request(app).post("/api/auth/login")
    .send({ email, password: "Admin@123" });
  return body.token;
}

async function makeUserAndToken(email = "user1@example.com") {
  await request(app).post("/api/auth/register")
    .send({ fullName: "User", email, password: "User@123" });
  const { body } = await request(app).post("/api/auth/login")
    .send({ email, password: "User@123" });
  return body.token;
}

async function createSkill(adminToken, name = "Skill X", description = "desc") {
  const res = await request(app).post("/api/skills")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name, description });
  return res.body.data;
}

async function createQuestion(adminToken, skillId, questionText = "Q?") {
  const res = await request(app).post("/api/questions")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      skillId,
      questionText,
      difficulty: "medium",
      explanation: "exp",
      options: [
        { position: 1, optionText: "A", isCorrect: false },
        { position: 2, optionText: "B", isCorrect: true }
      ]
    });
  return res.body.data; // { id, options: [...] }
}

module.exports = { makeAdminAndToken, makeUserAndToken, createSkill, createQuestion };
