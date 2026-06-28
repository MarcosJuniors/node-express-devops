const db = require('../models/database');

exports.getStudentEvolution = (req, res) => {
  const studentId = req.params.studentId;

  const query = `
    SELECT points, timestamp, description 
    FROM user_xp_log 
    WHERE user_id = ? 
    ORDER BY timestamp ASC
  `;

  db.all(query, [studentId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter logs de evolução de XP: ' + err.message });
    }

    res.status(200).json(rows);
  });
};

exports.getStudentList = (req, res) => {
  const query = `
    SELECT id, username, email, avatar, points 
    FROM users 
    WHERE role = 'student' 
    ORDER BY points DESC, username ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao carregar estudantes: ' + err.message });
    }

    const ranked = rows.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      points: u.points
    }));

    res.status(200).json(ranked);
  });
};

// Simulação de leitura de livro em TI (Biblioteca) - Concede 25 XP
exports.readLibraryBook = (req, res) => {
  const { userId, bookTitle } = req.body;

  if (!userId || !bookTitle) {
    return res.status(400).json({ error: 'ID do usuário e título do livro são obrigatórios.' });
  }

  const xpReward = 25;

  db.serialize(() => {
    // Adicionar XP
    db.run('UPDATE users SET points = points + ? WHERE id = ?', [xpReward, userId]);
    // Registrar evolução
    db.run(
      'INSERT INTO user_xp_log (user_id, points, description) VALUES (?, (SELECT points FROM users WHERE id = ?), ?)',
      [userId, userId, `Leitura concluída: "${bookTitle}"`]
    );
  });

  db.get('SELECT points FROM users WHERE id = ?', [userId], (err, row) => {
    res.status(200).json({
      message: `Você leu "${bookTitle}" e ganhou +${xpReward} XP de aprendizado!`,
      xpAwarded: xpReward,
      newTotalPoints: row ? row.points : 0
    });
  });
};
