const express = require("express");
const app = express();

// Permite que o servidor aceite JSON no corpo das requisições
app.use(express.json());

// Rota que vai receber as mensagens do Telegram
app.post("/telegram/webhook", (req, res) => {
  console.log("Mensagem recebida do Telegram:");
  console.log(JSON.stringify(req.body, null, 2));

  // Sempre responder 200 para o Telegram saber que deu certo
  res.sendStatus(200);
});


// Rota de teste (healthcheck)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "BOO.AI backend rodando" });
});

// Porta local
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor BOO.AI rodando na porta ${PORT}`);
});
 
