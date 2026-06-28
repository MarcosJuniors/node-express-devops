const API_BASE = 'http://localhost:3000/api';

// Verificar se o usuário está logado
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('moodle_user'));
  const currentPath = window.location.pathname;

  // Se não estiver logado e estiver em página protegida
  if (!user && !currentPath.includes('login.html') && !currentPath.includes('index.html') && currentPath !== '/') {
    window.location.href = 'login.html';
    return null;
  }

  // Se estiver logado e tentar ir para login ou landing
  if (user && (currentPath.includes('login.html') || currentPath.includes('index.html') || currentPath === '/')) {
    window.location.href = 'dashboard.html';
    return user;
  }

  return user;
}

// Inicializa elementos comuns (como cabeçalhos)
function initHeader() {
  const user = JSON.parse(localStorage.getItem('moodle_user'));
  if (!user) return;

  const headerNav = document.querySelector('.nav-container');
  if (headerNav) {
    const currentPath = window.location.pathname;
    
    // Substituir a logo para o logo 3D
    const logoLink = headerNav.querySelector('.logo');
    if (logoLink) {
      logoLink.innerHTML = `<img src="images/logo_tech_marc_3d.png" alt="Tech Marc TI" style="height: 48px; width: auto; object-fit: contain;">`;
      logoLink.href = 'dashboard.html';
    }

    // Gerar links de navegação
    const navLinks = headerNav.querySelector('.nav-links');
    if (navLinks) {
      navLinks.innerHTML = `
        <li><a href="dashboard.html" class="nav-item ${currentPath.includes('dashboard.html') ? 'active' : ''}">Painel</a></li>
        <li><a href="kanban.html" class="nav-item ${currentPath.includes('kanban.html') ? 'active' : ''}">Projetos</a></li>
        <li><a href="forum.html" class="nav-item ${currentPath.includes('forum.html') ? 'active' : ''}">Fórum</a></li>
        <li><a href="library.html" class="nav-item ${currentPath.includes('library.html') ? 'active' : ''}">Biblioteca</a></li>
        <li><a href="leaderboard.html" class="nav-item ${currentPath.includes('leaderboard.html') ? 'active' : ''}">Ranking</a></li>
        <li><a href="chatbot.html" class="nav-item ${currentPath.includes('chatbot.html') ? 'active' : ''}">Chatbot</a></li>
      `;
    }

    // Adicionar badge do usuário no cabeçalho
    const userBadgeDiv = document.createElement('div');
    userBadgeDiv.className = 'user-badge';
    userBadgeDiv.innerHTML = `
      <span style="font-size: 16px;">${user.avatar || '👨‍🎓'}</span>
      <span style="font-weight: 700; color: var(--text-primary);">${user.username}</span>
      <span class="user-xp" id="header-xp">${user.points} XP</span>
      <button class="logout-btn" onclick="logout()" title="Sair">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </button>
    `;
    
    // Evita duplicar o badge se já existir
    const existingBadge = headerNav.querySelector('.user-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    headerNav.appendChild(userBadgeDiv);
  }
}

// Deslogar
function logout() {
  localStorage.removeItem('moodle_user');
  window.location.href = 'login.html';
}

// Atualizar XP na tela
function updateXPDisplay(newXP) {
  const user = JSON.parse(localStorage.getItem('moodle_user'));
  if (user) {
    user.points = newXP;
    localStorage.setItem('moodle_user', JSON.stringify(user));
    
    const xpBadge = document.getElementById('header-xp');
    if (xpBadge) xpBadge.textContent = `${newXP} XP`;

    const welcomeXp = document.getElementById('welcome-xp');
    if (welcomeXp) welcomeXp.textContent = `${newXP}`;
  }
}

// Exportar funções globais para o navegador
window.checkAuth = checkAuth;
window.initHeader = initHeader;
window.logout = logout;
window.updateXPDisplay = updateXPDisplay;
window.API_BASE = API_BASE;
