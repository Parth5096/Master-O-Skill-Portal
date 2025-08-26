const { Router } = require("express");
const auth = require("./auth.routes");
const users = require("./users.routes");
const skills = require("./skills.routes");
const questions = require("./questions.routes");
const attempts = require("./attempts.routes");
const reports = require("./reports.routes");

const r = Router();
r.use("/auth", auth);
r.use("/users", users);
r.use("/skills", skills);
r.use("/questions", questions);
r.use("/attempts", attempts);
r.use("/reports", reports);

module.exports = r;
