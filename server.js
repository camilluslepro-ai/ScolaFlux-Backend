require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "scolaflux-dev-secret-change-me";

app.use(cors());
app.use(express.json());

// Mémoire temporaire (plus tard: PostgreSQL)
const users = [
  {
    id: 1,
    email: "owner@scolaflux.cm",
    passwordHash: bcrypt.hashSync("Owner2026!", 8),
    name: "Ekassi Ekani Camille",
    role: "promoteur",
  },
  {
    id: 2,
    email: "admin@institut.cm",
    passwordHash: bcrypt.hashSync("Admin2026!", 8),
    name: "Admin Institut",
    role: "admin",
  },
  {
    id: 3,
    email: "parent@exemple.cm",
    passwordHash: bcrypt.hashSync("Parent2026!", 8),
    name: "Parent Demo",
    role: "parent",
  },
];

app.get("/", (req, res) => {
  res.json({
    name: "ScolaFlux API",
    status: "ok",
    version: "1.0.0",
    message: "Backend ScolaFlux opérationnel",
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "healthy", service: "scolaflux-backend" });
});

app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/v1/me", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Non autorisé" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});

app.listen(PORT, () => {
  console.log(`ScolaFlux API listening on port ${PORT}`);
});
