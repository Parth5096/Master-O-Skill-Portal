const { prisma } = require("../prisma");
const { parsePagination, buildMeta } = require("../utils/pagination");

async function listSkills(req, res) {
  const { skip, limit, page } = parsePagination(req.query);
  const q = req.query.q || "";
  const where = q ? { name: { contains: q } } : {};

  const [total, items] = await Promise.all([
    prisma.skill.count({ where }),
    prisma.skill.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } })
  ]);

  res.json({ data: items, meta: buildMeta(total, page, limit) });
}

async function createSkill(req, res) {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Missing name" });
  try {
    const skill = await prisma.skill.create({ data: { name, description } });
    res.status(201).json({ data: skill });
  } catch (err) {
    if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('uq_skills_name')) {
      return res.status(409).json({ message: "Skill name already exists" });
    }
    throw err;
  }
}

async function updateSkill(req, res) {
  const id = BigInt(req.params.id);
  const { name, description, isActive } = req.body;
  try {
    const skill = await prisma.skill.update({ where: { id }, data: { name, description, isActive } });
    res.json({ data: skill });
  } catch {
    res.status(404).json({ message: "Not found" });
  }
}

async function deleteSkill(req, res) {
  const id = BigInt(req.params.id);
  await prisma.skill.delete({ where: { id } }).catch(() => null);
  res.status(204).send();
}

module.exports = { listSkills, createSkill, updateSkill, deleteSkill };
