// src/index.js - BRO.AI Backend Corrigido (Versão Imediata)

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
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

// Variáveis CRUCIAIS para o Webhook na Railway
// A Railway geralmente expõe o domínio público (HTTPS) em RAILWAY_STATIC_URL
const RAILWAY_HOST = process.env.RAILWAY_STATIC_URL || "https://sua-url-padrao.up.railway.app"; 
const WEBHOOK_PATH = "/webhook"; 
const WEBHOOK_URL = `${RAILWAY_HOST}${WEBHOOK_PATH}`;

if (!TELEGRAM_TOKEN) {
    console.error("❌ ERRO FATAL: TELEGRAM_TOKEN não definido!");
    process.exit(1);
}
// ------------------------
// 🤖 Configuração do bot Telegram (webhook)
// ------------------------
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// -----------------------------------------------------------
// 🔥 Função que chama a IA da DeepSeek
// -----------------------------------------------------------
async function chamarBroAi(mensagemUsuario) {
    if (!DEEPSEEK_API_KEY) {
        return "⚠️ No momento não consegui acessar minha IA. A chave DeepSeek não está configurada.";
    }

    const systemPrompt = `
Você é o BRO.AI, um agente operacional inteligente para bares e restaurantes.
Sua especialidade: CMV, Estoque, Controle de perdas, Cardápio lucrativo.
Regras: Responder sempre em português, ser direto e sempre sugerir próximos passos.
`;

    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
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

        return response.data?.choices?.[0]?.message?.content?.trim() || "⚠️ Não consegui gerar uma resposta agora.";
    } catch (err) {
        console.error("❌ Erro DeepSeek:", err.response?.data || err.message);
        return "⚠️ Erro ao acessar o motor de IA. Tente novamente em instantes.";
    }
}

// -----------------------------------------------------------
// 📩 Webhook do Telegram (CORRIGIDO)
// -----------------------------------------------------------
app.post(WEBHOOK_PATH, async (req, res) => {
    const update = req.body;
    console.log("🔥 UPDATE TELEGRAM RECEBIDO.");

    if (!update.message) {
        // Ignorar updates sem mensagem (ex: edições)
        return res.sendStatus(200);
    }

    const chatId = update.message.chat.id;
    const texto = update.message.text || "";

    // 🚨 1. Resposta Imediata (CRUCIAL! Evita o Timeout do Telegram)
    res.sendStatus(200); 

    // 🚨 2. Processamento Assíncrono (Executa a IA em segundo plano)
    // Tudo aqui será executado DEPOIS que a resposta 200 for enviada.
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
            return;
        }

        // Simula o Worker: Chamamos a IA e enviamos a resposta, de forma
        // assíncrona à thread principal que já respondeu 200 OK.
        const resposta = await chamarBroAi(texto);
        await bot.sendMessage(chatId, resposta);
        
    } catch (err) {
        // Este erro é do processo de IA/Envio, não do webhook HTTP inicial.
        console.error("❌ Erro no Processamento Assíncrono (DeepSeek/Telegram):", err);
        try {
             await bot.sendMessage(chatId, "⚠️ Tive um erro técnico. Tente novamente.");
        } catch (e) {
            console.error("Falha ao enviar mensagem de erro.", e);
        }
    }
});

// -----------------------------------------------------------
// 🌐 Rota de teste DeepSeek via navegador
// -----------------------------------------------------------
app.get("/teste-deepseek", async (req, res) => {
    // ... (Mantenha o código de teste DeepSeek)
    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: [{ role: "user", content: "Teste de conexão BRO.AI." }],
                max_tokens: 50,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                },
            }
        );

        res.json({ ok: true, resposta: response.data.choices[0].message.content });
    } catch (err) {
        res.json({ ok: false, erro: err.message, detalhes: err?.response?.data });
    }
});

// -----------------------------------------------------------
// 🚀 Inicia o servidor (CORRIGIDO - Adiciona setWebhook)
// -----------------------------------------------------------
app.listen(PORT, async () => {
    console.log(`Servidor BRO.AI rodando na porta ${PORT}`);

    // 🚨 3. Configura o Webhook no Telegram (CRUCIAL!)
    try {
        await bot.setWebhook(WEBHOOK_URL);
        console.log(`✅ Webhook configurado com sucesso para: ${WEBHOOK_URL}`);
        console.log(`* Verifique se ${RAILWAY_HOST} é o seu domínio HTTPS *`);
    } catch (error) {
        console.error("❌ ERRO GRAVE ao configurar webhook. Verifique o RAILWAY_HOST e TELEGRAM_TOKEN.", error.message);
    }
});