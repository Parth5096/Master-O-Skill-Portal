const { prisma } = require("../prisma");
const { comparePassword, hashPassword } = require("../utils/hash");
const { signJwt } = require("../utils/jwt");

async function register(req, res) {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ message: "Missing fields" });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, role: "user" }
    });
    const token = signJwt({ sub: user.id.toString(), role: user.role, email: user.email });
    res.status(201).json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('email')) {
      return res.status(409).json({ message: "Email already registered" });
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = signJwt({ sub: user.id.toString(), role: user.role, email: user.email });
  res.json({
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
  });
}

async function me(req, res) {
  const uid = req.user.id;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  res.json({
    user: user && { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
  });
}

module.exports = { register, login, me };
