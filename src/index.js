// BOOAI Backend - Servidor Express (CommonJS)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuração básica do Telegram (webhook) ---
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // vamos colocar no .env
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Essa rota é chamada pelo Telegram quando alguém fala com o bot
app.post("/telegram/webhook", (req, res) => {
  const body = req.body;

  // Segurança básica: garante que veio mesmo do Telegram
  if (!body || !body.message) {
    return res.status(200).json({ ok: true });
  }

  const chatId = body.message.chat.id;
  const text = body.message.text || "";

  console.log("Mensagem recebida do Telegram:", chatId, text);

  // RESPOSTA PROVISÓRIA (aqui depois entra o agente DeepSeek/BOO.AI)
  const resposta = "👋 Oi, eu sou o BOO.AI em testes. Já recebi sua mensagem!";

  bot
    .sendMessage(chatId, resposta)
    .then(() => {
      return res.status(200).json({ ok: true });
    })
    .catch((err) => {
      console.error("Erro ao enviar mensagem pro Telegram:", err);
      return res.status(200).json({ ok: true });
    });
});


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
