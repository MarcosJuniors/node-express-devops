const db = require('../models/database');

exports.getLeaderboard = (req, res) => {
  const query = `
    SELECT id, username, points 
    FROM users 
    ORDER BY points DESC, username ASC 
    LIMIT 50
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter ranking de usuários: ' + err.message });
    }

    // Adiciona a posição do rank ao retorno
    const rankedUsers = rows.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      points: user.points
    }));

    res.status(200).json(rankedUsers);
  });
};
