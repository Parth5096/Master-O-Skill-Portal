const { prisma } = require("../prisma");
const { parsePagination, buildMeta } = require("../utils/pagination");

function validateOptions(options) {
  if (!Array.isArray(options) || options.length < 2) return "At least 2 options required";
  const correct = options.filter(o => !!o.isCorrect);
  if (correct.length !== 1) return "Exactly one option must be marked isCorrect=true";
  const positions = new Set(options.map(o => Number(o.position)));
  if (positions.size !== options.length) return "Option positions must be unique per question";
  return null;
}

async function listQuestions(req, res) {
  const { skip, limit, page } = parsePagination(req.query);
  const skillId = req.query.skillId ? BigInt(req.query.skillId) : undefined;
  const where = { AND: [skillId ? { skillId } : {}, {}] };

  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: { options: { orderBy: { position: "asc" } }, skill: true }
    })
  ]);

  res.json({ data: items, meta: buildMeta(total, page, limit) });
}

async function createQuestion(req, res) {
  const { skillId, questionText, difficulty = "medium", explanation, options = [] } = req.body;
  if (!skillId || !questionText) return res.status(400).json({ message: "Missing fields" });
  const error = validateOptions(options);
  if (error) return res.status(400).json({ message: error });

  const q = await prisma.question.create({
    data: {
      skillId: BigInt(skillId),
      questionText,
      difficulty,
      explanation,
      options: {
        create: options.map((o) => ({
          position: Number(o.position),
          optionText: o.optionText,
          isCorrect: !!o.isCorrect
        }))
      }
    },
    include: { options: true }
  });

  res.status(201).json({ data: q });
}

async function updateQuestion(req, res) {
  const id = BigInt(req.params.id);
  const { questionText, difficulty, explanation, isActive } = req.body;

  try {
    const q = await prisma.question.update({
      where: { id },
      data: { questionText, difficulty, explanation, isActive }
    });
    res.json({ data: q });
  } catch {
    res.status(404).json({ message: "Not found" });
  }
}

async function replaceOptions(req, res) {
  const id = BigInt(req.params.id);
  const options = req.body.options || [];
  const error = validateOptions(options);
  if (error) return res.status(400).json({ message: error });

  await prisma.$transaction(async (tx) => {
    await tx.questionOption.deleteMany({ where: { questionId: id } });
    await tx.questionOption.createMany({
      data: options.map((o) => ({
        questionId: id,
        position: Number(o.position),
        optionText: o.optionText,
        isCorrect: !!o.isCorrect
      }))
    });
  });

  const out = await prisma.question.findUnique({
    where: { id },
    include: { options: { orderBy: { position: "asc" } } }
  });
  res.json({ data: out });
}

async function deleteQuestion(req, res) {
  const id = BigInt(req.params.id);
  await prisma.question.delete({ where: { id } }).catch(() => null);
  res.status(204).send();
}

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  replaceOptions,
  deleteQuestion
};
