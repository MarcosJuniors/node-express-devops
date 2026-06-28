document.addEventListener('DOMContentLoaded', () => {
  const user = window.checkAuth();
  if (!user) return;
  window.initHeader();

  // Atualizar dados de boas vindas
  const welcomeTitle = document.getElementById('welcome-user');
  if (welcomeTitle) welcomeTitle.textContent = `${user.avatar || '👨‍🎓'} ${user.username}`;

  const welcomeXp = document.getElementById('welcome-xp');
  if (welcomeXp) welcomeXp.textContent = user.points;

  // Atualizar Níveis, Progresso Circular, Badges e Mural de Feedbacks
  updateUserProgressWidgets(user);

  // Carregar os cursos da API
  loadCourses(user.id);
});

function updateUserProgressWidgets(user) {
  const points = user.points || 0;
  
  // Lógica do Nível
  let level = 1;
  let currentLevelXP = points;
  let maxLevelXP = 150;

  if (points >= 450) {
    level = 4;
    currentLevelXP = 150;
    maxLevelXP = 150;
  } else if (points >= 300) {
    level = 3;
    currentLevelXP = points - 300;
    maxLevelXP = 150;
  } else if (points >= 150) {
    level = 2;
    currentLevelXP = points - 150;
    maxLevelXP = 150;
  }

  const percentage = Math.min(100, Math.floor((currentLevelXP / maxLevelXP) * 100));

  // Animando o círculo de progresso
  const circleBar = document.getElementById('level-circle-bar');
  const levelPctText = document.getElementById('level-percentage');
  const levelText = document.getElementById('user-level');
  const xpDetailText = document.getElementById('user-xp-detail');

  if (circleBar && levelPctText && levelText && xpDetailText) {
    const circumference = 251.2; 
    const offset = circumference - (percentage / 100) * circumference;
    
    setTimeout(() => {
      circleBar.style.strokeDashoffset = offset;
    }, 150);

    levelPctText.textContent = `${percentage}%`;
    levelText.textContent = `LV.${level}`;
    xpDetailText.textContent = `${points} / ${level === 4 ? 450 : level * 150} XP`;
  }

  // Lógica das Badges (Conquistas)
  const badgePioneiro = document.getElementById('badge-pioneiro');
  const badgeScrum = document.getElementById('badge-scrum');
  const badgeGestor = document.getElementById('badge-gestor');
  const badgeExpert = document.getElementById('badge-expert');

  if (badgePioneiro) {
    badgePioneiro.classList.add('active-cyan');
  }

  if (badgeScrum && points >= 120) {
    badgeScrum.classList.add('active');
  }

  if (badgeGestor && points >= 240) {
    badgeGestor.classList.add('active');
  }

  if (badgeExpert && points >= 450) {
    badgeExpert.classList.add('active-emerald');
  }

  // Mural de Feedbacks do Professor
  const feedbackList = document.getElementById('teachers-feedback-list');
  if (feedbackList) {
    let feedbackHTML = '';

    if (points < 100) {
      feedbackHTML = `
        <div class="feedback-bubble">
          <div class="feedback-avatar professor">👨‍🏫</div>
          <div class="feedback-content">
            <div class="feedback-meta">
              <span class="feedback-name">Prof. Márcio</span>
              <span class="feedback-role">Mentor de Projetos</span>
            </div>
            <p class="feedback-text">"Olá! Vejo que está iniciando na jornada Tech Marc TI. Recomendo começar pelas trilhas de Fundamentos de TI. Dica: Crie seu primeiro projeto no quadro Kanban para começar a acumular XP!"</p>
          </div>
        </div>
      `;
    } else if (points >= 100 && points < 240) {
      feedbackHTML = `
        <div class="feedback-bubble">
          <div class="feedback-avatar professor">👨‍🏫</div>
          <div class="feedback-content">
            <div class="feedback-meta">
              <span class="feedback-name">Prof. Márcio</span>
              <span class="feedback-role">Mentor de Projetos</span>
            </div>
            <p class="feedback-text">"Bom trabalho! Já acumulou seus primeiros pontos de XP. Recomendo responder às discussões no Fórum de TI e ler os PDFs na Biblioteca para potencializar seu progresso."</p>
          </div>
        </div>
      `;
    } else {
      feedbackHTML = `
        <div class="feedback-bubble">
          <div class="feedback-avatar professor" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.2);">👨‍🏫</div>
          <div class="feedback-content">
            <div class="feedback-meta">
              <span class="feedback-name">Prof. Márcio</span>
              <span class="feedback-role">Mentor de Projetos</span>
            </div>
            <p class="feedback-text">"Excepcional, ${user.username}! Você atingiu um nível de pontuação de destaque. A modelagem ágil de seus projetos no Kanban está de alto nível. Parabéns pelo empenho!"</p>
          </div>
        </div>
      `;
    }

    feedbackList.innerHTML = feedbackHTML;
  }
}

async function loadCourses(userId) {
  const coursesGrid = document.getElementById('courses-grid');
  if (!coursesGrid) return;

  try {
    const response = await fetch(`${window.API_BASE}/courses?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar a lista de cursos.');
    }
    const courses = await response.json();

    coursesGrid.innerHTML = '';

    if (courses.length === 0) {
      coursesGrid.innerHTML = '<p style="color: var(--text-secondary);">Nenhum curso disponível no momento.</p>';
      return;
    }

    courses.forEach(course => {
      const isCompleted = course.completed === 1;
      const card = document.createElement('div');
      card.className = 'glass-panel-interactive course-card tilt-3d';
      
      const bgImg = course.image_url || 'images/banner_pm_ti.png';
      
      card.innerHTML = `
        <div class="course-img" style="background-image: url('${bgImg}')">
          <span class="course-tag">${course.category}</span>
        </div>
        <div class="course-content">
          <h3>${course.title}</h3>
          <p>${course.description}</p>
          <div class="course-footer">
            <span class="course-xp-label">+${course.xp_reward} XP</span>
            ${
              isCompleted 
              ? `<span class="status-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Concluído
                 </span>`
              : `<a href="quiz.html?courseId=${course.id}" class="btn btn-primary" style="padding: 6px 16px; font-size: 13.0px; box-shadow: none;">Fazer Quiz</a>`
            }
          </div>
        </div>
      `;
      coursesGrid.appendChild(card);
    });

    // Inicializar o efeito de inclinação 3D nos cards injetados dinamicamente!
    if (window.initTiltEffect) {
      window.initTiltEffect();
    }

  } catch (error) {
    console.error(error);
    coursesGrid.innerHTML = `<p style="color: #f87171;">Não foi possível carregar os cursos: ${error.message}</p>`;
  }
}
