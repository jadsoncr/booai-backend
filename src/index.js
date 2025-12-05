// BOOAI Backend - Servidor Express (CommonJS)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuração do Telegram ---
const TelegramBot = require("node-telegram-bot-api");

// o token vem das variáveis de ambiente do Railway
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!TELEGRAM_TOKEN) {
  console.error("ERRO: TELEGRAM_TOKEN não definido nas variáveis de ambiente!");
  process.exit(1); // derruba o servidor se não tiver token
}

// cria o bot em modo webhook (sem polling)
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// --- Rota que o Telegram chama (webhook) ---
app.post("/webhook", (req, res) => {
  const body = req.body;

  // Log forte para debug
  console.log("🔥 UPDATE RECEBIDO DO TELEGRAM:", JSON.stringify(body, null, 2));

  // Se não tiver mensagem, só responde ok
  if (!body || !body.message) {
    return res.status(200).json({ ok: true });
  }

  const chatId = body.message.chat.id;
  const text = body.message.text || "";

  console.log("Mensagem recebida do Telegram:", chatId, text);

  // RESPOSTA PROVISÓRIA (depois entra a IA aqui)
  const resposta =
    "🤖 Olá! Eu sou o BRO.AI — seu parceiro inteligente que transforma gestão em resultado, de forma rápida, simples e eficiente.!";

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

// --- Rota principal para teste via navegador ---
app.get("/", (req, res) => {
  res.send("BOOAI API ONLINE 🚀");
});

// --- Sobe o servidor ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Servidor BOOAI rodando na porta " + PORT);
});
