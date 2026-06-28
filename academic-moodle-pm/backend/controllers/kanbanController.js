const db = require('../models/database');

exports.getKanbanTasks = (req, res) => {
  const projectId = req.params.projectId;

  // Carregar sprints do projeto
  db.all('SELECT * FROM sprints WHERE project_id = ?', [projectId], (sErr, sprints) => {
    if (sErr) {
      return res.status(500).json({ error: 'Erro ao carregar sprints: ' + sErr.message });
    }

    // Carregar todas as tarefas vinculadas a essas sprints
    const query = `
      SELECT t.*, u.username as assigned_name, u.avatar as assigned_avatar
      FROM project_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.sprint_id IN (SELECT id FROM sprints WHERE project_id = ?)
    `;

    db.all(query, [projectId], (tErr, tasks) => {
      if (tErr) {
        return res.status(500).json({ error: 'Erro ao carregar tarefas: ' + tErr.message });
      }

      res.status(200).json({
        sprints: sprints,
        tasks: tasks
      });
    });
  });
};

exports.createSprint = (req, res) => {
  const { projectId, title } = req.body;

  if (!projectId || !title) {
    return res.status(400).json({ error: 'ID do projeto e título da Sprint são obrigatórios.' });
  }

  db.run('INSERT INTO sprints (project_id, title) VALUES (?, ?)', [projectId, title], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar Sprint: ' + err.message });
    }
    res.status(201).json({
      message: 'Sprint criada com sucesso!',
      sprintId: this.lastID
    });
  });
};

exports.createTask = (req, res) => {
  const { sprintId, title, description, assignedTo, xpReward } = req.body;

  if (!sprintId || !title) {
    return res.status(400).json({ error: 'ID da Sprint e título da tarefa são obrigatórios.' });
  }

  const query = `
    INSERT INTO project_tasks (sprint_id, title, description, assigned_to, status, xp_reward) 
    VALUES (?, ?, ?, ?, 'todo', ?)
  `;

  db.run(query, [sprintId, title, description || '', assignedTo || null, xpReward || 20], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar tarefa: ' + err.message });
    }
    res.status(201).json({
      message: 'Tarefa criada com sucesso!',
      taskId: this.lastID
    });
  });
};

exports.updateTaskStatus = (req, res) => {
  const taskId = req.params.taskId;
  const { status } = req.body; // 'todo', 'progress', 'review', 'done'

  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório.' });
  }

  // Buscar detalhes da tarefa antes de atualizar
  db.get('SELECT * FROM project_tasks WHERE id = ?', [taskId], (err, task) => {
    if (err || !task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const oldStatus = task.status;
    const assignedUser = task.assigned_to;
    const xpReward = task.xp_reward;

    db.run('UPDATE project_tasks SET status = ? WHERE id = ?', [status, taskId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar status da tarefa.' });
      }

      // Se a tarefa foi movida para DONE e não estava em DONE anteriormente, concedemos XP!
      if (status === 'done' && oldStatus !== 'done' && assignedUser) {
        db.serialize(() => {
          // Atualiza pontos do usuário
          db.run('UPDATE users SET points = points + ? WHERE id = ?', [xpReward, assignedUser]);

          // Adiciona log de evolução de XP
          db.run(
            'INSERT INTO user_xp_log (user_id, points, description) VALUES (?, (SELECT points FROM users WHERE id = ?), ?)',
            [assignedUser, assignedUser, `Tarefa concluída: "${task.title}"`]
          );
        });
      }

      res.status(200).json({
        message: 'Status atualizado com sucesso!',
        xpAwarded: status === 'done' && oldStatus !== 'done' ? xpReward : 0
      });
    });
  });
};
