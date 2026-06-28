const db = require('../models/database');

exports.submitQuiz = (req, res) => {
  const { userId, courseId, answers } = req.body;

  if (!userId || !courseId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Parâmetros inválidos. userId, courseId e answers (array) são necessários.' });
  }

  // Buscar os quizzes corretos para o curso
  const query = `SELECT id, correct_option_index, explanation, question FROM quizzes WHERE course_id = ?`;
  db.all(query, [courseId], (err, dbQuizzes) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao processar quiz no banco de dados: ' + err.message });
    }

    if (dbQuizzes.length === 0) {
      return res.status(404).json({ error: 'Quizzes não encontrados para este curso.' });
    }

    let correctCount = 0;
    const results = [];

    // Validar cada resposta do usuário
    dbQuizzes.forEach((quiz) => {
      const userAnswer = answers.find(a => a.quizId === quiz.id);
      const chosenIndex = userAnswer ? userAnswer.answerIndex : null;
      const isCorrect = chosenIndex === quiz.correct_option_index;

      if (isCorrect) {
        correctCount++;
      }

      results.push({
        quizId: quiz.id,
        question: quiz.question,
        chosenOption: chosenIndex,
        correctOption: quiz.correct_option_index,
        isCorrect: isCorrect,
        explanation: quiz.explanation
      });
    });

    const isPassed = correctCount === dbQuizzes.length; // Passa se acertar todas (ou podemos fazer 70%, mas para 2 questões acertar todas é legal)
    
    // Obter os pontos de recompensa do curso
    db.get('SELECT xp_reward FROM courses WHERE id = ?', [courseId], (err, course) => {
      if (err || !course) {
        return res.status(500).json({ error: 'Erro ao buscar dados de recompensa do curso.' });
      }

      const xpReward = course.xp_reward;

      if (isPassed) {
        // Verificar se já completou anteriormente
        db.get('SELECT completed FROM user_progress WHERE user_id = ? AND course_id = ?', [userId, courseId], (err, progress) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao checar progresso anterior.' });
          }

          if (progress && progress.completed === 1) {
            // Já completou antes, não ganha XP repetido para evitar abuso, mas retorna feedback positivo
            return res.status(200).json({
              success: true,
              message: 'Quiz concluído! Você já havia ganho o XP deste curso anteriormente.',
              xpEarned: 0,
              correctCount,
              totalQuestions: dbQuizzes.length,
              results
            });
          } else {
            // Novo progresso - atualizar progresso e adicionar XP
            db.serialize(() => {
              // Insere ou atualiza progresso
              db.run(
                `INSERT INTO user_progress (user_id, course_id, completed) 
                 VALUES (?, ?, 1) 
                 ON CONFLICT(user_id, course_id) DO UPDATE SET completed = 1`,
                [userId, courseId]
              );

              // Adiciona XP ao usuário
              db.run(
                `UPDATE users SET points = points + ? WHERE id = ?`,
                [xpReward, userId],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Erro ao atualizar pontos do usuário.' });
                  }

                  // Retornar os novos pontos totais do usuário
                  db.get('SELECT points FROM users WHERE id = ?', [userId], (err, updatedUser) => {
                    res.status(200).json({
                      success: true,
                      message: `Parabéns! Você concluiu o curso com sucesso e ganhou +${xpReward} XP!`,
                      xpEarned: xpReward,
                      newTotalPoints: updatedUser ? updatedUser.points : 0,
                      correctCount,
                      totalQuestions: dbQuizzes.length,
                      results
                    });
                  });
                }
              );
            });
          }
        });
      } else {
        // Não passou (errou alguma questão)
        res.status(200).json({
          success: false,
          message: 'Você não acertou todas as questões. Tente novamente para ganhar o XP do curso!',
          xpEarned: 0,
          correctCount,
          totalQuestions: dbQuizzes.length,
          results
        });
      }
    });
  });
};
