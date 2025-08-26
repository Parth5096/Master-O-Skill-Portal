const request = require("supertest");
const app = require("../src/app");
const { makeAdminAndToken, createSkill } = require("./helpers");

describe("Validation errors", () => {
  let adminToken, skillId;
  beforeEach(async () => {
    adminToken = await makeAdminAndToken("valadmin@example.com");
    const skill = await createSkill(adminToken, "ValidateSkill");
    skillId = skill.id;
  });

  it("skill create requires name", async () => {
    const res = await request(app).post("/api/skills")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "no name" });
    expect(res.status).toBe(400);
  });

  it("question requires exactly one correct option", async () => {
    const res = await request(app).post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        skillId,
        questionText: "Q bad correct count",
        options: [
          { position: 1, optionText: "A", isCorrect: true },
          { position: 2, optionText: "B", isCorrect: true }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Exactly one option/i);
  });

  it("question options must have unique positions", async () => {
    const res = await request(app).post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        skillId,
        questionText: "Q duplicate pos",
        options: [
          { position: 1, optionText: "A", isCorrect: false },
          { position: 1, optionText: "B", isCorrect: true }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/positions must be unique/i);
  });
});
