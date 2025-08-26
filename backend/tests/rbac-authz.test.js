const request = require("supertest");
const app = require("../src/app");
const { makeAdminAndToken, makeUserAndToken } = require("./helpers");

describe("RBAC / AuthZ", () => {
  it("401 when no token on protected route", async () => {
    const res = await request(app).get("/api/skills");
    expect(res.status).toBe(401);
  });

  it("403 when user hits admin route", async () => {
    const userToken = await makeUserAndToken("u403@example.com");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("admin can access admin routes", async () => {
    const adminToken = await makeAdminAndToken("a200@example.com");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
