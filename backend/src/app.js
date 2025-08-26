const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const { errorHandler } = require("./middleware/error");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.set("json replacer", (_key, value) => (typeof value === "bigint" ? value.toString() : value));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", routes);
app.use(errorHandler);

module.exports = app;
