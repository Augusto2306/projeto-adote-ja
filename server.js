// Importa as bibliotecas necessárias
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Cria a instância do servidor Express
const app = express();
const port = 3000;

// Configuração do banco de dados (já testada e funcionando)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage, limits: { files: 5 } });

// Middlewares globais do Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// =======================================================
// IMPORTANTE: Rotas para servir arquivos estáticos
// 1. Serve o conteúdo da pasta 'public' (seu frontend)
app.use(express.static(path.join(__dirname, 'public')));
// 2. Serve os arquivos da pasta 'uploads' (suas fotos)
app.use('/uploads', express.static('uploads'));
// =======================================================

// ======================= ROTAS DA API =======================

// ROTA 1: CADASTRAR UM NOVO ANIMAL
app.post('/api/animais', upload.array('fotosAnimal', 5), async (req, res) => {
    try {
        const { nomeResgatante, contatoResgatante, localResgate, nomeAnimal, descricaoAnimal, tokenDeletar } = req.body;

        if (!tokenDeletar || tokenDeletar.length < 4) {
            return res.status(400).json({ error: 'É necessário um token de deleção com pelo menos 4 caracteres.' });
        }

        const fotosUrls = req.files.map(file => `/uploads/${file.filename}`);

        const query = `
            INSERT INTO animais(nome_resgatante, contato, local, nome_animal, descricao, fotos, token_deletar)
            VALUES($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [nomeResgatante, contatoResgatante, localResgate, nomeAnimal, descricaoAnimal, fotosUrls, tokenDeletar];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: 'Animal cadastrado com sucesso!',
            animal: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao cadastrar animal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ROTA 2: LISTAR TODOS OS ANIMAIS CADASTRADOS
app.get('/api/animais', async (req, res) => {
    try {
        const query = 'SELECT * FROM animais ORDER BY data_cadastro DESC;';
        const result = await pool.query(query);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar animais:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ROTA 3: BUSCAR UM ANIMAL ESPECÍFICO PELO ID
app.get('/api/animais/:id', async (req, res) => {
    try {
        // O ':id' na URL se torna um parâmetro acessível via req.params
        const { id } = req.params;
        const query = 'SELECT * FROM animais WHERE id = $1;';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Animal não encontrado.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar animal por ID:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ROTA 4: DELETAR UM ANIMAL ESPECÍFICO
app.delete('/api/animais/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { tokenDeletar } = req.body;

        // 1. Verifique se o token foi fornecido
        if (!tokenDeletar) {
            return res.status(401).json({ error: 'Token de deleção é necessário.' });
        }

        // 2. Verifique se o token corresponde ao do banco de dados
        const animalQuery = await pool.query('SELECT token_deletar FROM animais WHERE id = $1', [id]);
        const animal = animalQuery.rows[0];

        if (!animal || animal.token_deletar !== tokenDeletar) {
            return res.status(403).json({ error: 'Token de deleção inválido.' });
        }

        // 3. Se o token for válido, delete o animal
        await pool.query('DELETE FROM animais WHERE id = $1', [id]);

        res.status(200).json({ message: 'Animal deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar animal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Inicia o servidor e o faz ouvir na porta definida
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});