const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar conexão com o banco e inicializar/semear tabelas
require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const quizRoutes = require('./routes/quizRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const projectRoutes = require('./routes/projectRoutes');
const kanbanRoutes = require('./routes/kanbanRoutes');
const forumRoutes = require('./routes/forumRoutes');
const evolutionRoutes = require('./routes/evolutionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/evolution', evolutionRoutes);

// Rota coringa para fallback do frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(` Servidor Mr Tech Solutions - Tech Marc TI Iniciado!`);
  console.log(` Porta local: http://localhost:${PORT}`);
  console.log(` Backend da API rodando sob: http://localhost:${PORT}/api/...`);
  console.log(`=============================================================`);
});
