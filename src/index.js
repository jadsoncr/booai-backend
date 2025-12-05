// BOOAI Backend - Servidor Express (CommonJS)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota principal para testar
app.get("/", (req, res) => {
  res.send("BOOAI API ONLINE 🚀");
});

// Rota exemplo para futuro webhook (Telegram, Deepseek, etc.)
app.post("/webhook", (req, res) => {
  console.log("Webhook recebido:", req.body);
  res.json({ ok: true });
});

// Porta (Railway define via process.env.PORT)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Servidor BOOAI rodando na porta " + PORT);
});
