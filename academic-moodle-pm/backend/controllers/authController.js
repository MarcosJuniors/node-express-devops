const db = require('../models/database');
const crypto = require('crypto');

// Função auxiliar para hash de senha
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

exports.register = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios (usuário, email e senha).' });
  }

  const hashedPassword = hashPassword(password);

  const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(query, [username, email, hashedPassword], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Usuário ou e-mail já cadastrado.' });
      }
      return res.status(500).json({ error: 'Erro ao registrar usuário: ' + err.message });
    }

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      userId: this.lastID
    });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  const hashedPassword = hashPassword(password);
  const query = `SELECT id, username, email, points FROM users WHERE username = ? AND password = ?`;

  db.get(query, [username, hashedPassword], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor ao tentar login.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Simula geração de token enviando as informações básicas do usuário logado
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        token: `simulated-token-${user.id}-${Date.now()}` // Token simples em texto plano
      }
    });
  });
};
