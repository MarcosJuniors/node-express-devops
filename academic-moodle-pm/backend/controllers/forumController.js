const db = require('../models/database');

exports.getTopics = (req, res) => {
  const query = `
    SELECT t.*, u.username as author_name, u.avatar as author_avatar, 
           (SELECT COUNT(*) FROM forum_replies r WHERE r.topic_id = t.id) as reply_count
    FROM forum_topics t
    LEFT JOIN users u ON t.author_id = u.id
    ORDER BY t.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar tópicos do fórum: ' + err.message });
    }
    res.status(200).json(rows);
  });
};

exports.getTopicDetails = (req, res) => {
  const topicId = req.params.topicId;

  // Obter tópico
  const topicQuery = `
    SELECT t.*, u.username as author_name, u.avatar as author_avatar
    FROM forum_topics t
    LEFT JOIN users u ON t.author_id = u.id
    WHERE t.id = ?
  `;

  db.get(topicQuery, [topicId], (tErr, topic) => {
    if (tErr || !topic) {
      return res.status(404).json({ error: 'Tópico não encontrado.' });
    }

    // Obter respostas
    const repliesQuery = `
      SELECT r.*, u.username as author_name, u.avatar as author_avatar, u.role as author_role
      FROM forum_replies r
      LEFT JOIN users u ON r.author_id = u.id
      WHERE r.topic_id = ?
      ORDER BY r.created_at ASC
    `;

    db.all(repliesQuery, [topicId], (rErr, replies) => {
      if (rErr) {
        return res.status(500).json({ error: 'Erro ao carregar respostas do fórum.' });
      }

      res.status(200).json({
        topic: topic,
        replies: replies
      });
    });
  });
};

exports.createTopic = (req, res) => {
  const { title, content, authorId } = req.body;

  if (!title || !content || !authorId) {
    return res.status(400).json({ error: 'Título, conteúdo e ID do autor são obrigatórios.' });
  }

  db.run('INSERT INTO forum_topics (title, content, author_id) VALUES (?, ?, ?)', [title, content, authorId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar tópico: ' + err.message });
    }

    const topicId = this.lastID;
    const xpReward = 15;

    // Conceder XP por participação ativa no Fórum
    db.serialize(() => {
      db.run('UPDATE users SET points = points + ? WHERE id = ?', [xpReward, authorId]);
      db.run(
        'INSERT INTO user_xp_log (user_id, points, description) VALUES (?, (SELECT points FROM users WHERE id = ?), ?)',
        [authorId, authorId, `Criou tópico no Fórum: "${title}"`]
      );
    });

    res.status(201).json({
      message: 'Tópico criado com sucesso! +15 XP Adquiridos.',
      topicId: topicId,
      xpAwarded: xpReward
    });
  });
};

exports.createReply = (req, res) => {
  const { topicId, content, authorId } = req.body;

  if (!topicId || !content || !authorId) {
    return res.status(400).json({ error: 'ID do tópico, conteúdo e ID do autor são obrigatórios.' });
  }

  db.run('INSERT INTO forum_replies (topic_id, content, author_id) VALUES (?, ?, ?)', [topicId, content, authorId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao enviar resposta: ' + err.message });
    }

    const replyId = this.lastID;
    const xpReward = 10;

    // Conceder XP por resposta no Fórum
    db.serialize(() => {
      db.run('UPDATE users SET points = points + ? WHERE id = ?', [xpReward, authorId]);
      db.run(
        'INSERT INTO user_xp_log (user_id, points, description) VALUES (?, (SELECT points FROM users WHERE id = ?), ?)',
        [authorId, authorId, 'Respondeu no Fórum de discussões']
      );
    });

    res.status(201).json({
      message: 'Resposta enviada com sucesso! +10 XP Adquiridos.',
      replyId: replyId,
      xpAwarded: xpReward
    });
  });
};
