const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { userPerformance, skillGap, timeBased } = require("../controllers/reports.controller");

const r = Router();
r.use(requireAuth);
r.get("/user-performance", userPerformance);
r.get("/skill-gap", skillGap);
r.get("/time", timeBased);

module.exports = r;
