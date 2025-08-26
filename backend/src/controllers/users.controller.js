const { prisma } = require("../prisma");
const { parsePagination, buildMeta } = require("../utils/pagination");
const { hashPassword } = require("../utils/hash");

async function listUsers(req, res) {
  const { skip, limit, page } = parsePagination(req.query);
  const role = req.query.role;
  const q = req.query.q || "";

  const where = {
    AND: [
      role ? { role } : {},
      q ? { OR: [{ email: { contains: q } }, { fullName: { contains: q } }] } : {}
    ]
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip, take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true }
    })
  ]);

  res.json({ data: items, meta: buildMeta(total, page, limit) });
}

async function getUser(req, res) {
  const id = BigInt(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true, role: true, isActive: true }
  });
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json({ data: user });
}

async function createUser(req, res) {
  const { fullName, email, password, role = "user" } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ message: "Missing fields" });

  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({ data: { fullName, email, passwordHash, role } });
    res.status(201).json({ data: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('email')) {
      return res.status(409).json({ message: "Email already registered" });
    }
    throw err;
  }
}

async function updateUser(req, res) {
  const id = BigInt(req.params.id);
  const { fullName, email, role, isActive } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { fullName, email, role, isActive }
    });
    res.json({ data: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive } });
  } catch {
    res.status(404).json({ message: "Not found" });
  }
}

async function deleteUser(req, res) {
  const id = BigInt(req.params.id);
  await prisma.user.delete({ where: { id } }).catch(() => null);
  res.status(204).send();
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
