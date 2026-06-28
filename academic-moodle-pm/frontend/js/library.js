let userObj = null;

document.addEventListener('DOMContentLoaded', () => {
  userObj = window.checkAuth();
  if (!userObj) return;
  window.initHeader();

  loadLibraryBooks();
});

const BOOKS = [
  {
    id: 1,
    title: "Scrum e Métodos Ágeis para Equipes de TI",
    author: "Marcio Costa",
    icon: "📖",
    desc: "Um guia prático sobre como planejar Sprints, gerenciar retrospectivas e atuar como Scrum Master ou Product Owner em projetos escolares de tecnologia."
  },
  {
    id: 2,
    title: "Gestão Escolar com PMBOK e Metodologias Ativas",
    author: "Ana Beatriz Ramos",
    icon: "📘",
    desc: "Aprenda a aplicar conceitos estruturados de projetos (escopo, cronograma, gerenciamento de riscos) adaptados à realidade da sala de aula e de softwares de ensino."
  },
  {
    id: 3,
    title: "Design Thinking na Educação: Co-criação na TI",
    author: "Thiago Silva",
    icon: "📙",
    desc: "Fases detalhadas de Empatia, Ideação e Prototipagem voltadas à criação de novos aplicativos escolares focando sempre nas necessidades reais dos alunos."
  }
];

function loadLibraryBooks() {
  const container = document.getElementById('books-container');
  if (!container) return;

  container.innerHTML = '';
  BOOKS.forEach(b => {
    const card = document.createElement('div');
    card.className = 'glass-panel-interactive book-card tilt-3d';
    card.innerHTML = `
      <div class="book-icon">${b.icon}</div>
      <h3 class="book-title">${b.title}</h3>
      <div class="book-author">Por: ${b.author}</div>
      <p class="book-desc">${b.desc}</p>
      <button class="btn btn-primary" onclick="readBook('${b.title}')" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; box-shadow: none;">Simular Leitura (PDF)</button>
    `;
    container.appendChild(card);
  });

  // Inicializa o efeito 3D nos livros
  if (window.initTiltEffect) {
    window.initTiltEffect();
  }
}

async function readBook(bookTitle) {
  // Abre o modal de simulação de PDF
  document.getElementById('pdf-book-title').textContent = bookTitle;
  openModal('pdf-viewer-modal');

  // Faz a chamada de leitura
  try {
    const response = await fetch(`${window.API_BASE}/evolution/read-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userObj.id, bookTitle: bookTitle })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Atualiza XP local
      window.updateXPDisplay(data.newTotalPoints);
      userObj.points = data.newTotalPoints;

      // Mensagem de sucesso
      document.getElementById('pdf-feedback-text').innerHTML = `
        <span style="color: var(--accent-emerald); font-weight: 800;">🏆 Concluído!</span> Você leu o material técnico e ganhou <strong style="color: var(--accent-orange);">+25 XP</strong> de aprendizado!
      `;
    }
  } catch (error) {
    console.error(error);
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

window.readBook = readBook;
window.closeModal = closeModal;
