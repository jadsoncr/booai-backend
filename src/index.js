// BOOAI Backend - Servidor Express
import express from "express";
import cors from "cors";
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Rota para testar se o servidor está online
app.get("/", (req, res) => {
    res.json({ message: "BOOAI backend está online " });
});

// Rota que o Telegram vai usar para enviar mensagens
app.post("/webhook", async (req, res) => {
    console.log("Mensagem recebida do Telegram:", req.body);

    return res.json({
        ok: true
    });
});

// Porta do Railway (obrigatório usar process.env.PORT)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Servidor BOOAI rodando na porta " + PORT));
