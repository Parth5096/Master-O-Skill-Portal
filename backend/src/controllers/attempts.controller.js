const { prisma } = require("../prisma");
const { parsePagination, buildMeta } = require("../utils/pagination");

async function startAttempt(req, res) {
  const userId = req.user.id;
  const { skillId } = req.body;
  if (!skillId) return res.status(400).json({ message: "skillId required" });

  const attempt = await prisma.quizAttempt.create({
    data: { userId, skillId: BigInt(skillId), status: "in_progress" }
  });
  res.status(201).json({ data: attempt });
}

async function answerQuestion(req, res) {
  const attemptId = BigInt(req.params.id);
  const userId = req.user.id;
  const { questionId, selectedOptionId, timeSpentSeconds } = req.body;

  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) return res.status(404).json({ message: "Attempt not found" });
  if (attempt.status !== "in_progress") return res.status(400).json({ message: "Attempt is not in progress" });

  const opt = await prisma.questionOption.findUnique({ where: { id: BigInt(selectedOptionId) } });
  if (!opt) return res.status(400).json({ message: "Invalid selectedOptionId" });

  const isCorrect = !!opt.isCorrect;

  const ans = await prisma.quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId: BigInt(questionId) } },
    update: { selectedOptionId: BigInt(selectedOptionId), isCorrect, timeSpentSeconds, answeredAt: new Date() },
    create: {
      attemptId,
      questionId: BigInt(questionId),
      selectedOptionId: BigInt(selectedOptionId),
      isCorrect,
      timeSpentSeconds
    }
  });

  res.status(201).json({ data: ans });
}

async function submitAttempt(req, res) {
  const attemptId = BigInt(req.params.id);
  const userId = req.user.id;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true }
  });
  if (!attempt || attempt.userId !== userId) return res.status(404).json({ message: "Attempt not found" });

  const total = attempt.answers.length;
  const correct = attempt.answers.filter(a => a.isCorrect).length;
  const score = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      totalQuestions: total,
      correctAnswers: correct,
      scorePercent: score,
      status: "submitted",
      submittedAt: new Date()
    }
  });

  res.json({ data: updated });
}

async function listAttempts(req, res) {
  const { skip, limit, page } = parsePagination(req.query);
  const isAdmin = req.user.role === "admin";
  const ownerId = req.query.userId ? BigInt(req.query.userId) : req.user.id;
  const skillId = req.query.skillId ? BigInt(req.query.skillId) : undefined;
  const status = req.query.status;

  const where = {
    AND: [
      isAdmin ? (req.query.userId ? { userId: ownerId } : {}) : { userId: ownerId },
      skillId ? { skillId } : {},
      status ? { status } : {}
    ]
  };

  const [total, items] = await Promise.all([
    prisma.quizAttempt.count({ where }),
    prisma.quizAttempt.findMany({
      where,
      skip, take: limit,
      orderBy: { startedAt: "desc" },
      include: { skill: true }
    })
  ]);

  res.json({ data: items, meta: buildMeta(total, page, limit) });
}

module.exports = { startAttempt, answerQuestion, submitAttempt, listAttempts };
