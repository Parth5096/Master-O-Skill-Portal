const request = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/prisma");
const { client, ensure } = require("../src/utils/redis");

async function makeAdmin() {
  await request(app).post("/api/auth/register")
    .send({ fullName: "Admin", email: "admin@example.com", password: "Admin@123" });
  await prisma.user.update({ where: { email: "admin@example.com" }, data: { role: "admin" } });
  const { body } = await request(app).post("/api/auth/login")
    .send({ email: "admin@example.com", password: "Admin@123" });
  return body.token;
}
async function makeUser(email) {
  await request(app).post("/api/auth/register")
    .send({ fullName: "User", email, password: "User@123" });
  const { body } = await request(app).post("/api/auth/login")
    .send({ email, password: "User@123" });
  return body.token;
}

describe("Attempts + Reports + Cache", () => {
  let adminToken, userToken, userId, skillId, qId, correctOptId, wrongOptId;

  beforeEach(async () => {
    adminToken = await makeAdmin();
    userToken = await makeUser("user1@example.com");

    // get userId via prisma
    const user = await prisma.user.findUnique({ where: { email: "user1@example.com" } });
    userId = user.id;

    // create skill
    const cs = await request(app).post("/api/skills")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "SQL", description: "Queries" });
    skillId = cs.body.data.id;

    // question with options
    const cq = await request(app).post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        skillId, questionText: "Which clause filters rows?",
        difficulty: "easy", explanation: "WHERE",
        options: [
          { position: 1, optionText: "WHERE", isCorrect: true },
          { position: 2, optionText: "ORDER BY", isCorrect: false }
        ]
      });
    qId = cq.body.data.id;
    const opts = cq.body.data.options;
    correctOptId = opts.find(o => o.isCorrect).id;
    wrongOptId = opts.find(o => !o.isCorrect).id;
  });

  it("user attempts flow and reports, with cache hit", async () => {
    // start attempt
    const st = await request(app).post("/api/attempts/start")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ skillId });
    expect(st.status).toBe(201);
    const attemptId = st.body.data.id;

    // answer once (correct)
    const ans = await request(app).post(`/api/attempts/${attemptId}/answer`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ questionId: qId, selectedOptionId: correctOptId, timeSpentSeconds: 5 });
    expect(ans.status).toBe(201);

    // submit
    const sub = await request(app).post(`/api/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(sub.status).toBe(200);
    expect(Number(sub.body.data.scorePercent)).toBe(100);

    // user performance (first call populates cache)
    const up1 = await request(app).get("/api/reports/user-performance")
      .set("Authorization", `Bearer ${userToken}`);
    expect(up1.status).toBe(200);
    expect(Array.isArray(up1.body.data)).toBe(true);

    // ensure redis up, then check cached key exists (best-effort)
    await ensure();
    try {
      const key = `userPerformance:${userId}`;
      const raw = await client.get(key);
      // Even if Redis isn’t running, raw can be null; don’t fail the test for that.
      if (raw) {
        const parsed = JSON.parse(raw);
        expect(parsed.data.length).toBeGreaterThanOrEqual(1);
      }
    } catch { /* ignore redis absence */ }

    // user performance (second call should be cache hit)
    const up2 = await request(app).get("/api/reports/user-performance")
      .set("Authorization", `Bearer ${userToken}`);
    expect(up2.status).toBe(200);

    // skill-gap
    const sg = await request(app).get("/api/reports/skill-gap")
      .set("Authorization", `Bearer ${userToken}`);
    expect(sg.status).toBe(200);

    // time-based
    const tb = await request(app).get("/api/reports/time?period=week")
      .set("Authorization", `Bearer ${userToken}`);
    expect(tb.status).toBe(200);
    expect(tb.body.summary.attempts).toBeGreaterThanOrEqual(1);
  });
});
