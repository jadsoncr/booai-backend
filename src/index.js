// BRO.AI Backend - Servidor Express (CommonJS)
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuração do Telegram ---
const TelegramBot = require("node-telegram-bot-api");

// Token do bot vindo das variáveis de ambiente (Railway)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!TELEGRAM_TOKEN) {
  console.error("ERRO: TELEGRAM_TOKEN não definido nas variáveis de ambiente!");
  process.exit(1);
}

if (!DEEPSEEK_API_KEY) {
  console.error("ERRO: DEEPSEEK_API_KEY não definido nas variáveis de ambiente!");
  // não mata o servidor, mas loga o erro. Se quiser, pode dar process.exit(1) aqui também.
}

// Bot em modo webhook (sem polling)
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

/**
 * Função que chama a IA (DeepSeek) e devolve a resposta do BRO.AI
 */
async function chamarBroAi(perguntaDoUsuario) {
  if (!DEEPSEEK_API_KEY) {
    // fallback se a chave não estiver configurada
    return "⚠️ No momento não consegui acessar meu motor de IA. Mas já posso te ajudar com conceitos básicos de CMV, estoque e gestão.";
  }

  const systemPrompt = `
Você é o BRO.AI, um agente de inteligência operacional especializado em bares e restaurantes.

Seu foco:
- CMV real (não só contábil)
- Estoque inteligente
- Controle de perdas
- Cardápio lucrativo
- Operação simples para o dono/gestor

Regras:
- Fale em português do Brasil.
- Seja direto, prático e didático.
- Sempre que possível, traga próximos passos concretos (ex: "1) Faça isso, 2) Meça aquilo").
- Se a pergunta for genérica (ex: "CMV o que é?"), explique de forma simples, com exemplo.
- Se faltar informação, diga o que a pessoa deveria medir ou registrar no sistema BRO.AI.
  `;

  try {
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: perguntaDoUsuario || "" },
        ],
        max_tokens: 400,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        timeout: 20000, // 20s
      }
    );

    const respostaIa =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "Não consegui gerar uma resposta agora. Tente novamente em alguns instantes.";

    return respostaIa;
  } catch (err) {
    console.error("Erro ao chamar DeepSeek:", err.response?.data || err.message);
    return "⚠️ Tive um problema ao acessar meu motor de IA agora. Tenta de novo em alguns instantes, por favor.";
  }
}

// --- Rota que o Telegram chama (webhook) ---
app.post("/webhook", async (req, res) => {
  const body = req.body;

  console.log("🔥 UPDATE RECEBIDO DO TELEGRAM:", JSON.stringify(body, null, 2));

  if (!body || !body.message) {
    return res.status(200).json({ ok: true });
  }

  const chatId = body.message.chat.id;
  const text = body.message.text || "";

  console.log("Mensagem recebida do Telegram:", chatId, text);

  try {
    // 1) mensagem de boas-vindas contextual (opcional)
    if (text === "/start") {
      const boasVindas =
        "🤖 Olá! Eu sou o BRO.AI — seu parceiro inteligente que transforma gestão em resultado, de forma rápida, simples e eficiente.\n\nMe pergunta algo como:\n• \"CMV o que é?\"\n• \"Meu CMV está alto, o que olho primeiro?\"\n• \"Como reduzir desperdício no bar?\"";
      await bot.sendMessage(chatId, boasVindas);
      return res.status(200).json({ ok: true });
    }

    // 2) chama a IA para qualquer outra mensagem
    const respostaIa = await chamarBroAi(text);

    await bot.sendMessage(chatId, respostaIa);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro geral no webhook Telegram:", err);
    // não deixar o Telegram em retry infinito
    await bot.sendMessage(
      chatId,
      "⚠️ Tive um problema técnico aqui, mas já estou sendo ajustado. Tenta de novo em alguns minutos."
    );
    return res.status(200).json({ ok: true });
  }
});

// --- Rota principal para teste via navegador ---
app.get("/", (req, res) => {
  res.send("BRO.AI API ONLINE 🚀");
});

// --- Sobe o servidor ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Servidor BRO.AI rodando na porta " + PORT);
});
