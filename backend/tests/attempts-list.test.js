const request = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/prisma");
const { makeAdminAndToken, makeUserAndToken, createSkill, createQuestion } = require("./helpers");

describe("GET /api/attempts (list)", () => {
  let adminToken, userToken, skillId, question, questionId, correctOptId;

  beforeEach(async () => {
    adminToken = await makeAdminAndToken("attempts-admin@example.com");
    userToken = await makeUserAndToken("attempts-user@example.com");

    const s = await createSkill(adminToken, "AttemptsSkill");
    skillId = s.id;
    question = await createQuestion(adminToken, skillId, "Which is correct?");
    questionId = question.id;
    correctOptId = question.options.find(o => o.isCorrect).id;

    // user: start, answer, submit
    const st = await request(app).post("/api/attempts/start")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ skillId });
    const attemptId = st.body.data.id;
    await request(app).post(`/api/attempts/${attemptId}/answer`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ questionId, selectedOptionId: correctOptId, timeSpentSeconds: 3 });
    await request(app).post(`/api/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${userToken}`);
  });

  it("user lists own attempts", async () => {
    const res = await request(app).get("/api/attempts?status=submitted&page=1&limit=10")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("admin can list attempts for a user via userId filter", async () => {
    const user = await prisma.user.findUnique({ where: { email: "attempts-user@example.com" } });
    const res = await request(app).get(`/api/attempts?userId=${user.id}&status=submitted`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
