document.addEventListener('DOMContentLoaded', () => {
  const user = window.checkAuth();
  if (!user) return;
  window.initHeader();

  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  
  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Configurar clique nas perguntas sugeridas
  const suggestedBtns = document.querySelectorAll('.suggested-btn');
  suggestedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (chatInput) {
        chatInput.value = btn.textContent;
        sendMessage();
      }
    });
  });

  // Mensagem inicial de boas-vindas do chatbot
  appendMessage('incoming', 'Olá! Sou o Assistente Acadêmico Moodle-PM. Estou pronto para te ajudar com suas dúvidas sobre Gestão de Projetos educacionais, Scrum, Kanban, PMBOK ou Design Thinking na educação. Como posso te ajudar hoje?');
});

const chatMessages = document.getElementById('chat-messages');

function appendMessage(sender, text) {
  if (!chatMessages) return;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${sender}`;
  bubble.textContent = text;
  
  chatMessages.appendChild(bubble);
  scrollToBottom();
}

function appendTypingIndicator() {
  if (!chatMessages) return null;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble incoming typing-container-msg';
  bubble.id = 'typing-indicator-msg';
  bubble.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  
  chatMessages.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

async function sendMessage() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;

  const text = chatInput.value.trim();
  if (!text) return;

  // Limpa o input
  chatInput.value = '';

  // Adiciona a mensagem do usuário na tela
  appendMessage('outgoing', text);

  // Adiciona indicador de digitando simulado
  const indicator = appendTypingIndicator();

  try {
    const response = await fetch(`${window.API_BASE}/chatbot?message=${encodeURIComponent(text)}`);
    if (!response.ok) {
      throw new Error('Falha ao obter resposta do chatbot.');
    }
    const data = await response.json();

    // Remove o indicador de digitando após um pequeno delay para parecer natural
    setTimeout(() => {
      if (indicator) indicator.remove();
      appendMessage('incoming', data.reply);
    }, 600);

  } catch (error) {
    console.error(error);
    setTimeout(() => {
      if (indicator) indicator.remove();
      appendMessage('incoming', 'Desculpe, estou com dificuldades de conexão no momento. Por favor, tente novamente em alguns instantes.');
    }, 600);
  }
}
