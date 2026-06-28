let userObj = null;
let activeTopicId = null;

document.addEventListener('DOMContentLoaded', () => {
  userObj = window.checkAuth();
  if (!userObj) return;
  window.initHeader();

  loadTopics();

  document.getElementById('create-topic-form')?.addEventListener('submit', handleCreateTopic);
  document.getElementById('reply-form')?.addEventListener('submit', handleCreateReply);
});

// Carregar Lista de Tópicos
async function loadTopics() {
  try {
    const response = await fetch(`${window.API_BASE}/forum`);
    if (!response.ok) throw new Error('Erro ao buscar tópicos do fórum.');
    
    const topics = await response.json();
    const list = document.getElementById('topics-list');
    
    if (list) {
      list.innerHTML = '';
      if (topics.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum tópico criado ainda. Seja o primeiro a perguntar!</p>';
        return;
      }

      topics.forEach(t => {
        const row = document.createElement('div');
        row.className = 'forum-item-row';
        row.onclick = () => showTopicDetails(t.id);
        
        row.innerHTML = `
          <div class="forum-item-main">
            <span style="font-size: 26px;">💬</span>
            <div>
              <h4 class="forum-item-title">${t.title}</h4>
              <div class="forum-item-meta">Postado por <strong>${t.author_avatar || '👤'} ${t.author_name}</strong> em ${formatDate(t.created_at)}</div>
            </div>
          </div>
          <div class="forum-item-replies">${t.reply_count} respostas</div>
        `;
        list.appendChild(row);
      });
    }
  } catch (error) {
    console.error(error);
  }
}

// Carregar Detalhes de um Tópico
async function showTopicDetails(topicId) {
  activeTopicId = topicId;
  try {
    const response = await fetch(`${window.API_BASE}/forum/${topicId}`);
    if (!response.ok) throw new Error('Erro ao carregar o tópico.');
    
    const data = await response.json();

    document.getElementById('forum-list-view').style.display = 'none';
    document.getElementById('forum-detail-view').style.display = 'block';

    // Renders Topic Header
    const detailHeader = document.getElementById('topic-detail-header');
    if (detailHeader) {
      detailHeader.innerHTML = `
        <div class="glass-panel topic-detail-card">
          <div class="forum-item-meta" style="margin-bottom: 8px;">Por: <strong>${data.topic.author_avatar || '👤'} ${data.topic.author_name}</strong> em ${formatDate(data.topic.created_at)}</div>
          <h2 style="font-family: var(--font-title); font-size: 22px; font-weight: 800; margin-bottom: 12px; color: var(--accent-purple);">${data.topic.title}</h2>
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; white-space: pre-line;">${data.topic.content}</p>
        </div>
      `;
    }

    // Renders Replies List
    const repliesContainer = document.getElementById('replies-container');
    if (repliesContainer) {
      repliesContainer.innerHTML = '';
      if (data.replies.length === 0) {
        repliesContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 12px;">Nenhuma resposta ainda. Ajude este colega!</p>';
      } else {
        data.replies.forEach(r => {
          const isAdvisor = r.author_role === 'advisor';
          const rCard = document.createElement('div');
          rCard.className = 'reply-card';
          if (isAdvisor) {
            rCard.style.borderColor = 'var(--accent-cyan)';
            rCard.style.background = 'rgba(8, 145, 178, 0.03)';
          }
          
          rCard.innerHTML = `
            <div class="forum-item-meta" style="margin-bottom: 8px; display: flex; justify-content: space-between;">
              <span>Autor: <strong>${r.author_avatar || '👤'} ${r.author_name}</strong> ${isAdvisor ? '<span class="status-badge" style="font-size:10px; padding: 1px 6px; background:rgba(8,145,178,0.1); border-radius:10px; color:var(--accent-cyan);">Orientador</span>' : ''}</span>
              <span>${formatDate(r.created_at)}</span>
            </div>
            <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; white-space: pre-line;">${r.content}</p>
          `;
          repliesContainer.appendChild(rCard);
        });
      }
    }

  } catch (error) {
    console.error(error);
  }
}

// Voltar para a Lista de Tópicos
function goBackToForum() {
  activeTopicId = null;
  document.getElementById('forum-list-view').style.display = 'block';
  document.getElementById('forum-detail-view').style.display = 'none';
  loadTopics();
}

// Criar Novo Tópico (Submit)
async function handleCreateTopic(e) {
  e.preventDefault();
  const title = document.getElementById('topic-title-input').value;
  const content = document.getElementById('topic-content-input').value;

  try {
    const response = await fetch(`${window.API_BASE}/forum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, authorId: userObj.id })
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      
      // Atualiza XP local
      window.updateXPDisplay(userObj.points + data.xpAwarded);
      userObj.points += data.xpAwarded;

      document.getElementById('create-topic-form').reset();
      closeModal('topic-modal');
      loadTopics();
    }
  } catch (error) {
    console.error(error);
  }
}

// Criar Nova Resposta (Submit)
async function handleCreateReply(e) {
  e.preventDefault();
  const content = document.getElementById('reply-content-input').value;

  try {
    const response = await fetch(`${window.API_BASE}/forum/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: activeTopicId, content, authorId: userObj.id })
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      
      // Atualiza XP local
      window.updateXPDisplay(userObj.points + data.xpAwarded);
      userObj.points += data.xpAwarded;

      document.getElementById('reply-content-input').value = '';
      showTopicDetails(activeTopicId);
    }
  } catch (error) {
    console.error(error);
  }
}

// Modais Utilities
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// Formatar data simples
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', { hour12: false });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.goBackToForum = goBackToForum;
