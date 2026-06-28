const db = require('../models/database');

exports.createProject = (req, res) => {
  const { title, description, ownerId, advisorId } = req.body;

  if (!title || !description || !ownerId) {
    return res.status(400).json({ error: 'Título, descrição e ID do proprietário são necessários.' });
  }

  const query = `INSERT INTO projects (title, description, owner_id, advisor_id) VALUES (?, ?, ?, ?)`;
  db.run(query, [title, description, ownerId, advisorId || null], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar projeto: ' + err.message });
    }

    const projectId = this.lastID;
    
    // Auto-adiciona o criador como membro do projeto
    db.run(`INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`, [projectId, ownerId], (mErr) => {
      res.status(201).json({
        message: 'Projeto criado com sucesso!',
        projectId: projectId
      });
    });
  });
};

exports.getProjects = (req, res) => {
  const userId = req.query.userId;

  let query = `
    SELECT p.*, u.username as owner_name, adv.username as advisor_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN users adv ON p.advisor_id = adv.id
  `;

  const params = [];
  if (userId) {
    query += ` WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?) OR p.advisor_id = ?`;
    params.push(userId, userId);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao carregar projetos: ' + err.message });
    }
    res.status(200).json(rows);
  });
};

exports.addMember = (req, res) => {
  const { projectId, username } = req.body;

  if (!projectId || !username) {
    return res.status(400).json({ error: 'ID do projeto e nome de usuário são necessários.' });
  }

  // Buscar usuário pelo username
  db.get('SELECT id FROM users WHERE username = ? AND role = "student"', [username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Estudante não encontrado com este usuário.' });
    }

    db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, user.id], (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Este estudante já é membro do projeto.' });
        }
        return res.status(500).json({ error: 'Erro ao adicionar membro: ' + err.message });
      }

      res.status(200).json({ message: 'Membro adicionado com sucesso!' });
    });
  });
};

exports.addAdvisor = (req, res) => {
  const { projectId, advisorId } = req.body;

  if (!projectId || !advisorId) {
    return res.status(400).json({ error: 'ID do projeto e ID do orientador são necessários.' });
  }

  db.run('UPDATE projects SET advisor_id = ? WHERE id = ?', [advisorId, projectId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao associar orientador: ' + err.message });
    }
    res.status(200).json({ message: 'Orientador associado com sucesso!' });
  });
};

exports.getAdvisors = (req, res) => {
  db.all('SELECT id, username, email FROM users WHERE role = "advisor"', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar orientadores: ' + err.message });
    }
    res.status(200).json(rows);
  });
};

exports.getProjectMembers = (req, res) => {
  const projectId = req.params.id;
  const query = `
    SELECT u.id, u.username, u.email, u.avatar, u.points 
    FROM users u
    JOIN project_members pm ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `;
  db.all(query, [projectId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao carregar membros do projeto.' });
    }
    res.status(200).json(rows);
  });
};
