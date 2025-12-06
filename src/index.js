// src/index.js - BRO.AI Backend (Versão Preparada para DB e Latência)

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// 🚨 NOVO: Importa o módulo de conexão com o Banco de Dados
const { connectToDatabase } = require('./db'); 

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// 🔧 Variáveis de ambiente
// ------------------------
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const PUBLIC_HOST = process.env.PUBLIC_HOST; // 🚨 NOVO: Variável CRUCIAL (Domínio HTTPS)
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = "/webhook"; 
const WEBHOOK_URL = `${PUBLIC_HOST}${WEBHOOK_PATH}`; // 🚨 NOVO: URL completa

// Verificações de Segurança (Aprimoradas)
if (!TELEGRAM_TOKEN) {
  console.error("❌ ERRO FATAL: TELEGRAM_TOKEN não definido!");
  process.exit(1);
}
if (!PUBLIC_HOST) {
    console.error("❌ ERRO FATAL: PUBLIC_HOST não definido! Webhook não pode ser configurado.");
    process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
  console.warn("⚠️ Aviso: DEEPSEEK_API_KEY não definido! IA ficará limitada.");
}

// ------------------------
// 🤖 Configuração do bot Telegram (webhook)
// ------------------------
// 🚨 CORREÇÃO: Inicializa bot apenas se o token existir
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false }); 

// -----------------------------------------------------------
// 🔥 Função que chama a IA da DeepSeek (Sistema BRO.AI)
// ... (Mantenha a função chamarBroAi intacta)
// -----------------------------------------------------------

// -----------------------------------------------------------
// 📩 Webhook do Telegram (LÓGICA CRÍTICA PARA SERVIÇO DE FILA)
// -----------------------------------------------------------
app.post(WEBHOOK_PATH, async (req, res) => {
  const update = req.body;
  console.log("🔥 UPDATE TELEGRAM:", JSON.stringify(update, null, 2));

  if (!update.message) {
    return res.status(200).send({ ok: true });
  }

  const chatId = update.message.chat.id;
  const texto = update.message.text || "";

  // 🚨 CORREÇÃO CRÍTICA PARA LATÊNCIA:
  // 1. Responda 200 OK IMEDIATAMENTE.
  res.status(200).send({ ok: true });

  // 2. Processe a IA de forma ASSÍNCRONA no backend (simulando um worker)
  try {
    if (texto === "/start") {
      const msg = `
🤖 *Olá! Eu sou o BRO.AI — seu parceiro inteligente de gestão.*
Me pergunte algo como:
• "Como reduzo desperdício?"
// ... (Resto da mensagem /start)
      `;
      await bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
      return; // Não faz mais nada, pois já respondemos 200 OK
    }

    // 💡 FUTURO: Esta linha será substituída por: jobQueue.add('process_ai', { chatId, texto });
    const resposta = await chamarBroAi(texto);
    await bot.sendMessage(chatId, resposta);
  } catch (err) {
    console.error("❌ Erro Webhook Telegram (Assíncrono):", err);
    // Tenta enviar uma mensagem de erro ao usuário mesmo que haja falha
    try {
        await bot.sendMessage(chatId, "⚠️ Tive um erro técnico. Tente novamente.");
    } catch (e) {
        console.error("Falha ao enviar mensagem de erro.", e);
    }
  }
});

// -----------------------------------------------------------
// 🌐 Rota de teste DeepSeek via navegador
// ... (Mantenha esta rota intacta)
// -----------------------------------------------------------

// -----------------------------------------------------------
// 🚀 Inicia o servidor (CORRIGIDO)
// -----------------------------------------------------------
app.listen(PORT, async () => {
    console.log(`Servidor BRO.AI rodando na porta ${PORT}`);

    // 🚨 PASSO 1: CONECTAR E INICIALIZAR O BANCO DE DADOS
    try {
        await connectToDatabase();
    } catch (e) {
        // O erro já está sendo tratado dentro de db.js com process.exit(1)
    }

    // 🚨 PASSO 2: CONFIGURAR O WEBHOOK DO TELEGRAM
    if (bot && typeof bot.setWebhook === 'function') { 
        try {
            await bot.setWebhook(WEBHOOK_URL);
            console.log(`✅ Webhook configurado com sucesso para: ${WEBHOOK_URL}`);
        } catch (error) {
            console.error("❌ ERRO GRAVE ao configurar webhook.", error.message);
        }
    } else {
        console.error("❌ FALHA CRÍTICA: Variável 'bot' não é um objeto TelegramBot válido.");
    }
});