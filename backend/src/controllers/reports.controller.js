const { prisma } = require("../prisma");
const { getJSON, setJSON } = require("../utils/redis");

const TTL = { USER_PERF: 60, SKILL_GAP: 60, TIME_BASED: 30 };

async function userPerformance(req, res) {
  const isAdmin = req.user.role === "admin";
  const userId = req.query.userId ? BigInt(req.query.userId) : req.user.id;
  if (!isAdmin && userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

  const cacheKey = `userPerformance:${userId}`;
  const hit = await getJSON(cacheKey);
  if (hit) return res.json(hit);

  const rows = await prisma.quizAttempt.groupBy({
    by: ["skillId"],
    where: { userId, status: { in: ["submitted", "scored"] } },
    _avg: { scorePercent: true }, _sum: { correctAnswers: true, totalQuestions: true }, _count: { _all: true }
  });

  const skills = await prisma.skill.findMany({ where: { id: { in: rows.map(r => r.skillId) } } });
  const skillMap = new Map(skills.map(s => [s.id.toString(), s.name]));

  const data = rows.map(r => ({
    skillId: r.skillId,
    skillName: skillMap.get(r.skillId.toString()),
    attempts: r._count._all,
    avgScorePercent: Number(r._avg.scorePercent || 0),
    totalCorrect: r._sum.correctAnswers,
    totalQuestions: r._sum.totalQuestions
  }));

  const payload = { data };
  await setJSON(cacheKey, payload, TTL.USER_PERF);
  res.json(payload);
}

async function skillGap(req, res) {
  const userId = req.query.userId ? BigInt(req.query.userId) : req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isAdmin && userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

  const cacheKey = `skillGap:${userId}`;
  const hit = await getJSON(cacheKey);
  if (hit) return res.json(hit);

  const rows = await prisma.quizAttempt.groupBy({
    by: ["skillId"],
    where: { userId, status: { in: ["submitted", "scored"] } },
    _avg: { scorePercent: true }
  });

  const skills = await prisma.skill.findMany({ where: { id: { in: rows.map(r => r.skillId) } } });
  const data = rows
    .map(r => ({ skillId: r.skillId, skillName: skills.find(s => s.id === r.skillId)?.name,
                 avgScorePercent: Number(r._avg.scorePercent || 0) }))
    .sort((a, b) => a.avgScorePercent - b.avgScorePercent);

  const payload = { data };
  await setJSON(cacheKey, payload, TTL.SKILL_GAP);
  res.json(payload);
}

async function timeBased(req, res) {
  const period = (req.query.period === "month") ? "month" : "week";
  const isAdmin = req.user.role === "admin";
  const userId = req.query.userId ? BigInt(req.query.userId) : req.user.id;
  const skillId = req.query.skillId ? BigInt(req.query.skillId) : undefined;
  if (!isAdmin && userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

  const cacheKey = `time:${period}:${userId}:${skillId || "ALL"}`;
  const hit = await getJSON(cacheKey);
  if (hit) return res.json(hit);

  const days = period === "month" ? 30 : 7;
  const from = new Date(); from.setDate(from.getDate() - days);

  const where = { AND: [
    { submittedAt: { gte: from } }, { status: { in: ["submitted", "scored"] } },
    userId ? { userId } : {}, skillId ? { skillId } : {}
  ]};

  const items = await prisma.quizAttempt.findMany({ where, orderBy: { submittedAt: "desc" }, include: { skill: true } });
  const summary = { attempts: items.length,
                    avgScorePercent: items.length ? Number(items.reduce((s, a) => s + Number(a.scorePercent), 0) / items.length) : 0 };
  const payload = { data: items, summary, window: { period, from } };
  await setJSON(cacheKey, payload, TTL.TIME_BASED);
  res.json(payload);
}

module.exports = { userPerformance, skillGap, timeBased };
