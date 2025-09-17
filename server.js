// Importa as bibliotecas necessárias
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do banco de dados (usando a URL do Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
      rejectUnauthorized: false
  }
});

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do Multer (sem armazenamento em disco)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { files: 5 }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// ROTA 1: CADASTRAR UM NOVO ANIMAL
app.post('/api/animais', upload.array('fotosAnimal', 5), async (req, res) => {
    try {
        const { nomeResgatante, contatoResgatante, localResgate, nomeAnimal, descricaoAnimal, tokenDeletar } = req.body;

        if (!tokenDeletar || tokenDeletar.length < 4) {
            return res.status(400).json({ error: 'É necessário um token de deleção com pelo menos 4 caracteres.' });
        }

        const fotosUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
                fotosUrls.push(result.secure_url);
            }
        } else {
             return res.status(400).json({ error: 'É necessário enviar pelo menos uma foto.' });
        }

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

        if (!tokenDeletar) {
            return res.status(401).json({ error: 'Token de deleção é necessário.' });
        }

        const animalQuery = await pool.query('SELECT token_deletar FROM animais WHERE id = $1', [id]);
        const animal = animalQuery.rows[0];

        if (!animal || animal.token_deletar !== tokenDeletar) {
            return res.status(403).json({ error: 'Token de deleção inválido.' });
        }

        await pool.query('DELETE FROM animais WHERE id = $1', [id]);

        res.status(200).json({ message: 'Animal deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar animal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});