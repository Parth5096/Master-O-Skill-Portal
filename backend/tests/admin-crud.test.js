const request = require("supertest");
const app = require("../src/app");
const { prisma } = require("../src/prisma");

async function makeAdminAndToken() {
  await request(app).post("/api/auth/register")
    .send({ fullName: "Admin", email: "admin@example.com", password: "Admin@123" });
  await prisma.user.update({ where: { email: "admin@example.com" }, data: { role: "admin" } });
  const { body } = await request(app).post("/api/auth/login")
    .send({ email: "admin@example.com", password: "Admin@123" });
  return body.token;
}

describe("Admin CRUD", () => {
  let adminToken;
  beforeEach(async () => { adminToken = await makeAdminAndToken(); });

  it("lists users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("skills and questions CRUD", async () => {
    // create skill
    const cs = await request(app).post("/api/skills")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "JavaScript", description: "Core JS" });
    expect(cs.status).toBe(201);
    const skillId = cs.body.data.id;

    // create question
    const cq = await request(app).post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        skillId, questionText: "Which filters elements?",
        difficulty: "medium", explanation: "filter()",
        options: [
          { position: 1, optionText: "map()", isCorrect: false },
          { position: 2, optionText: "filter()", isCorrect: true }
        ]
      });
    expect(cq.status).toBe(201);
    const qid = cq.body.data.id;

    // list questions by skill
    const lq = await request(app).get(`/api/questions?skillId=${skillId}&page=1&limit=10`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(lq.status).toBe(200);
    expect(lq.body.data.find(q => String(q.id) === String(qid))).toBeTruthy();

    // update question text
    const uq = await request(app).patch(`/api/questions/${qid}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionText: "Updated question?" });
    expect(uq.status).toBe(200);

    // replace options
    const ro = await request(app).put(`/api/questions/${qid}/options`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        options: [
          { position: 1, optionText: "splice()", isCorrect: false },
          { position: 2, optionText: "filter()", isCorrect: true }
        ]
      });
    expect(ro.status).toBe(200);

    // delete question
    const dq = await request(app).delete(`/api/questions/${qid}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(dq.status).toBe(204);

    // delete skill
    const ds = await request(app).delete(`/api/skills/${skillId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(ds.status).toBe(204);
  });
});
