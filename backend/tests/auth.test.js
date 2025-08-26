const request = require("supertest");
const app = require("../src/app");

describe("Auth flow", () => {
  it("register → login → me", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "User One", email: "user1@example.com", password: "User@123" });
    expect(reg.status).toBe(201);

    const log = await request(app)
      .post("/api/auth/login")
      .send({ email: "user1@example.com", password: "User@123" });
    expect(log.status).toBe(200);
    const token = log.body.token;

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("user1@example.com");
  });

  it("rejects invalid login", async () => {
    const bad = await request(app).post("/api/auth/login")
      .send({ email: "nope@example.com", password: "whatever" });
    expect(bad.status).toBe(401);
  });
});
