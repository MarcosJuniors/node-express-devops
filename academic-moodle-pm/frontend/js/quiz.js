document.addEventListener('DOMContentLoaded', () => {
  const user = window.checkAuth();
  if (!user) return;
  window.initHeader();

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');

  if (!courseId) {
    alert('Curso não especificado.');
    window.location.href = 'dashboard.html';
    return;
  }

  loadQuiz(courseId, user.id);
});

let currentQuizzes = [];
let userSelections = []; // Guarda as seleções do usuário
let currentQuestionIndex = 0;
let userObj = null;

async function loadQuiz(courseId, userId) {
  userObj = JSON.parse(localStorage.getItem('moodle_user'));
  const quizArea = document.getElementById('quiz-area');
  if (!quizArea) return;

  try {
    const response = await fetch(`${window.API_BASE}/courses/${courseId}/quiz`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Nenhum quiz cadastrado para este curso.');
      }
      throw new Error('Erro ao carregar o quiz do servidor.');
    }
    
    currentQuizzes = await response.json();
    userSelections = new Array(currentQuizzes.length).fill(null);
    currentQuestionIndex = 0;
    
    renderQuestion();

  } catch (error) {
    console.error(error);
    quizArea.innerHTML = `
      <div class="glass-panel quiz-results-card">
        <div class="results-icon">⚠️</div>
        <h2 class="results-title">Ops! Algo deu errado</h2>
        <p class="results-score">${error.message}</p>
        <a href="dashboard.html" class="btn btn-primary" style="display: inline-flex; margin-top: 16px;">Voltar para o Dashboard</a>
      </div>
    `;
  }
}

function renderQuestion() {
  const quizArea = document.getElementById('quiz-area');
  if (!quizArea || currentQuizzes.length === 0) return;

  const quiz = currentQuizzes[currentQuestionIndex];
  const selectedIndex = userSelections[currentQuestionIndex] !== null ? userSelections[currentQuestionIndex].answerIndex : null;

  const letterOptions = ['A', 'B', 'C', 'D'];

  quizArea.innerHTML = `
    <div class="glass-panel question-box">
      <div class="question-num">Questão ${currentQuestionIndex + 1} de ${currentQuizzes.length}</div>
      <h2 class="question-text">${quiz.question}</h2>
      
      <div class="options-list">
        ${quiz.options.map((option, idx) => `
          <div class="option-item ${selectedIndex === idx ? 'selected' : ''}" onclick="selectOption(${idx})">
            <span class="option-letter">${letterOptions[idx]}</span>
            <span class="option-text">${option}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="quiz-actions">
      <button class="btn btn-secondary" onclick="prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>Anterior</button>
      ${
        currentQuestionIndex === currentQuizzes.length - 1
        ? `<button class="btn btn-primary" id="submit-quiz-btn" onclick="submitQuizAnswers()" ${selectedIndex === null ? 'disabled' : ''}>Enviar Respostas</button>`
        : `<button class="btn btn-primary" onclick="nextQuestion()" ${selectedIndex === null ? 'disabled' : ''}>Avançar</button>`
      }
    </div>
  `;
}

function selectOption(index) {
  const quiz = currentQuizzes[currentQuestionIndex];
  
  userSelections[currentQuestionIndex] = {
    quizId: quiz.id,
    answerIndex: index
  };

  renderQuestion();
}

function nextQuestion() {
  if (currentQuestionIndex < currentQuizzes.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

async function submitQuizAnswers() {
  const unanswered = userSelections.includes(null);
  if (unanswered) {
    alert('Por favor, responda todas as questões antes de enviar.');
    return;
  }

  const submitBtn = document.getElementById('submit-quiz-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Avaliando...';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');

  try {
    const response = await fetch(`${window.API_BASE}/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userObj.id,
        courseId: parseInt(courseId),
        answers: userSelections
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar respostas ao servidor.');
    }

    const data = await response.json();
    renderQuizResults(data);

  } catch (error) {
    console.error(error);
    alert('Erro ao enviar quiz: ' + error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Respostas';
    }
  }
}

function renderQuizResults(data) {
  const quizArea = document.getElementById('quiz-area');
  if (!quizArea) return;

  const isSuccess = data.success;
  
  if (isSuccess && data.newTotalPoints) {
    window.updateXPDisplay(data.newTotalPoints);
    // Soltar fogos/confetes se acertar!
    launchConfetti();
  }

  const letterOptions = ['A', 'B', 'C', 'D'];

  let questionsFeedbackHTML = '';
  data.results.forEach((res, index) => {
    questionsFeedbackHTML += `
      <div class="glass-panel" style="padding: 24px; margin-bottom: 20px; text-align: left; border-left: 4px solid ${res.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-red)'}">
        <p style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Questão ${index + 1}</p>
        <h4 style="font-family: var(--font-title); font-size: 16px; margin-bottom: 16px; font-weight: 600;">${res.question}</h4>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          <div style="font-size: 13.5px; color: var(--text-secondary);">
            Sua resposta: <strong style="color: ${res.isCorrect ? '#10b981' : '#ef4444'}">${letterOptions[res.chosenOption] || 'Não respondida'}</strong>
          </div>
          ${!res.isCorrect ? `<div style="font-size: 13.5px; color: var(--text-secondary);">Resposta correta: <strong style="color: #10b981">${letterOptions[res.correctOption]}</strong></div>` : ''}
        </div>

        <div style="background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13.5px; color: var(--text-secondary); border: 1px solid var(--glass-border);">
          <strong style="color: var(--text-primary);">Justificativa:</strong> ${res.explanation}
        </div>
      </div>
    `;
  });

  quizArea.innerHTML = `
    <div class="glass-panel quiz-results-card" style="border-color: ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}">
      <div class="results-icon">${isSuccess ? '🏆' : '❌'}</div>
      <h2 class="results-title gradient-text">${isSuccess ? 'Módulo Concluído com Sucesso!' : 'Necessário Revisar o Conteúdo'}</h2>
      <p class="results-score">Você acertou <strong>${data.correctCount}</strong> de <strong>${data.totalQuestions}</strong> questões.</p>
      
      ${
        isSuccess 
        ? `<div class="results-xp">${data.xpEarned > 0 ? `+${data.xpEarned} XP Adquiridos` : 'Módulo já pontuado anteriormente'}</div>`
        : `<p style="color: var(--text-secondary); margin-bottom: 24px;">Releia os conceitos sobre Gestão de Projetos e tente novamente para receber o XP.</p>`
      }

      <div style="margin: 32px 0;">
        <h3 style="font-family: var(--font-title); text-align: left; margin-bottom: 16px; font-size: 19px;">Feedback das Questões</h3>
        ${questionsFeedbackHTML}
      </div>
      
      <div style="display: flex; gap: 16px; justify-content: center;">
        <a href="dashboard.html" class="btn btn-primary">Voltar ao Painel</a>
        ${!isSuccess ? `<button class="btn btn-secondary" onclick="location.reload()">Tentar Novamente</button>` : ''}
      </div>
    </div>
  `;
}

// Mecanismo personalizado de confetes
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let remaining = false;

    particles.forEach(p => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - (p.r / 2)) * 10;

      if (p.y < canvas.height) {
        remaining = true;
      }

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
      ctx.stroke();
    });

    if (remaining) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  draw();
}
