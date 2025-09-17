// Importa as bibliotecas necessárias
const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados (usando as variáveis do .env)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Função assíncrona para testar a conexão
async function testConnection() {
    try {
        // Tenta se conectar ao banco de dados
        const client = await pool.connect();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

        // Tenta executar uma consulta simples
        const res = await client.query('SELECT NOW()');
        console.log('✅ Consulta de teste executada com sucesso. Hora atual no DB:', res.rows[0].now);

        // Se tudo deu certo, a conexão pode ser liberada
        client.release();

    } catch (err) {
        // Se houver qualquer erro, ele será capturado aqui
        console.error('❌ Erro ao conectar ou executar a consulta:', err.message);
        console.error('Verifique suas credenciais no arquivo .env e o status do seu servidor PostgreSQL.');

    } finally {
        // Sempre fecha o pool de conexões
        pool.end();
    }
}

// Chama a função de teste
testConnection();