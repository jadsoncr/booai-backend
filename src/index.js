// BRO.AI Backend - Servidor Express (CommonJS)
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// 🔧 Variáveis de ambiente
// ------------------------
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const PORT = process.env.PORT || 3000;

if (!TELEGRAM_TOKEN) {
  console.error("❌ ERRO FATAL: TELEGRAM_TOKEN não definido!");
  process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
  console.warn("⚠️ Aviso: DEEPSEEK_API_KEY não definido! IA ficará limitada.");
}

// ------------------------
// 🤖 Telegram Bot (Webhooks)
// ------------------------
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// -----------------------------------------------------------
// 🔥 Função que chama a IA da DeepSeek (Sistema BRO.AI)
// -----------------------------------------------------------
async function chamarBroAi(mensagemUsuario) {
  if (!DEEPSEEK_API_KEY) {
    return "⚠️ No momento não consegui acessar minha IA. Mas posso te ajudar com boas práticas gerais de CMV, estoque e operação.";
  }

  const systemPrompt = `
Você é o BRO.AI, um agente operacional inteligente para bares e restaurantes.

Sua especialidade:
- CMV real
- Estoque inteligente
- Controle de perdas
- Cardápio lucrativo
- Operação simplificada

Regras:
- Responder sempre em português do Brasil.
- Ser direto, claro e prático.
- Sempre sugerir próximos passos.
- Se faltar informação, peça os dados que o gestor deve medir.
`;

  try {
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: mensagemUsuario || "" },
        ],
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    return (
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Não consegui gerar uma resposta agora."
    );
  } catch (err) {
    console.error("❌ Erro DeepSeek:", err.response?.data || err.message);
    return "⚠️ Erro ao acessar o motor de IA. Tente novamente em instantes.";
  }
}

// -----------------------------------------------------------
// 📩 Webhook do Telegram
// -----------------------------------------------------------
app.post("/webhook", async (req, res) => {
  const update = req.body;
  console.log("🔥 UPDATE TELEGRAM:", JSON.stringify(update, null, 2));

  if (!update.message) {
    return res.status(200).send({ ok: true });
  }

  const chatId = update.message.chat.id;
  const texto = update.message.text || "";

  try {
    if (texto === "/start") {
      const msg = `
🤖 *Olá! Eu sou o BRO.AI — seu parceiro inteligente de gestão.*

Me pergunte algo como:
• "Como reduzo desperdício?"
• "O que olhar no CMV?"
• "Meu estoque está sumindo, o que faço?"
      `;
      await bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
      return res.status(200).send({ ok: true });
    }

    const resposta = await chamarBroAi(texto);
    await bot.sendMessage(chatId, resposta);

    return res.status(200).send({ ok: true });
  } catch (err) {
    console.error("❌ Erro Webhook Telegram:", err);
    await bot.sendMessage(chatId, "⚠️ Tive um erro técnico. Tente novamente.");
    return res.status(200).send({ ok: true });
  }
});

// -----------------------------------------------------------
// 🌐 Rota de teste DeepSeek via navegador
// -----------------------------------------------------------
app.get("/teste-deepseek", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Teste de conexão BRO.AI." }],
        max_tokens: 50
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        }
      }
    );

    res.json({ ok: true, resposta: response.data });
  } catch (err) {
    res.json({ ok: false, erro: err.message, detalhes: err?.response?.data });
  }
});

// -----------------------------------------------------------
// 🚀 Inicia o servidor
// -----------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor BRO.AI rodando na porta ${PORT}`);
});
