const db = require('../models/database');

// Listar todos os cursos
exports.getCourses = (req, res) => {
  const userId = req.query.userId;

  if (userId) {
    // Se o userId for fornecido, trazer o status de conclusão do curso
    const query = `
      SELECT c.*, IFNULL(up.completed, 0) as completed 
      FROM courses c
      LEFT JOIN user_progress up ON c.id = up.course_id AND up.user_id = ?
    `;
    db.all(query, [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao listar cursos com progresso: ' + err.message });
      }
      res.status(200).json(rows);
    });
  } else {
    // Caso contrário, apenas listar os cursos normais
    db.all('SELECT * FROM courses', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao listar cursos: ' + err.message });
      }
      res.status(200).json(rows);
    });
  }
};

// Obter os quizzes de um curso específico (sem revelar a resposta correta no frontend diretamente para evitar trapaça)
exports.getCourseQuiz = (req, res) => {
  const courseId = req.params.id;

  const query = `SELECT id, course_id, question, options, explanation FROM quizzes WHERE course_id = ?`;
  db.all(query, [courseId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao carregar quiz: ' + err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum quiz encontrado para este curso.' });
    }

    // Parse do campo options que é guardado como string JSON
    const formattedQuizzes = rows.map(quiz => ({
      id: quiz.id,
      course_id: quiz.course_id,
      question: quiz.question,
      options: JSON.parse(quiz.options),
      explanation: quiz.explanation
    }));

    res.status(200).json(formattedQuizzes);
  });
};
