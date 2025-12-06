// src/db.js - Módulo de Conexão e Inicialização do PostgreSQL

const { Pool } = require('pg');

// O 'pg' Pool lê automaticamente as variáveis de ambiente PGHOST, PGPASSWORD, etc., 
// injetadas pela Railway.
const pool = new Pool(); 

/**
 * Tenta conectar ao DB e cria a tabela de histórico se ela não existir.
 */
async function connectToDatabase() {
    try {
        await pool.query('SELECT 1'); // Testa a conexão
        console.log('✅ PostgreSQL: Conexão bem-sucedida.');
        await createConversationsTable();
        return pool;
    } catch (err) {
        console.error('❌ ERRO CRÍTICO: Falha ao conectar ou inicializar o PostgreSQL.', err);
        // Falha fatal: O bot não pode funcionar sem histórico
        process.exit(1); 
    }
}

/**
 * Cria a tabela 'conversations' para armazenar o histórico do BRO.AI.
 */
async function createConversationsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            chat_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255),
            role VARCHAR(50) NOT NULL, -- 'user' ou 'assistant' (para o histórico da IA)
            content TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('✅ Tabela "conversations" verificada/criada com sucesso.');
    } catch (err) {
        console.error('❌ ERRO: Falha ao criar a tabela de conversas.', err);
        throw err;
    }
}

module.exports = {
    connectToDatabase,
    pool // Exporta o pool para que a lógica da IA possa salvar/ler o histórico
};