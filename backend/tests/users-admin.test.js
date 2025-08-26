const request = require("supertest");
const app = require("../src/app");
const { makeAdminAndToken } = require("./helpers");

describe("Users (admin CRUD)", () => {
  let adminToken;
  beforeEach(async () => { adminToken = await makeAdminAndToken(); });

  it("creates → gets → updates → deletes a user", async () => {
    // create (admin)
    const c = await request(app).post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "U2", email: "u2@example.com", password: "User@123", role: "user" });
    expect(c.status).toBe(201);
    const userId = c.body.data.id;

    // get
    const g = await request(app).get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(g.status).toBe(200);
    expect(g.body.data.email).toBe("u2@example.com");

    // update
    const u = await request(app).patch(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "admin", isActive: true });
    expect(u.status).toBe(200);
    expect(u.body.data.role).toBe("admin");

    // delete
    const d = await request(app).delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(d.status).toBe(204);

    // get again -> 404
    const g2 = await request(app).get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(g2.status).toBe(404);
  });
});
