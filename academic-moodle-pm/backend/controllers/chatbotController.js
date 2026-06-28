exports.getChatbotResponse = (req, res) => {
  const userMessage = req.query.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Nenhuma mensagem enviada. Envie uma mensagem no parâmetro ?message=' });
  }

  const msg = userMessage.toLowerCase().trim();
  let reply = '';

  // Processamento simples por palavras-chave com foco em Gestão de Projetos na Educação
  if (msg.includes('olá') || msg.includes('oi') || msg.includes('olá,') || msg.includes('oi,')) {
    reply = "Olá! Sou o Assistente Acadêmico da plataforma. Como posso ajudar você no seu aprendizado de Gestão de Projetos na Educação hoje?";
  } else if (msg.includes('quem é você') || msg.includes('apresente') || msg.includes('o que você faz')) {
    reply = "Eu sou o Assistente Acadêmico do Moodle-PM! Estou aqui para responder dúvidas conceituais, explicar metodologias de projetos (como Scrum, Kanban e Design Thinking) e te ajudar a alcançar o topo do nosso ranking escolar.";
  } else if (msg.includes('scrum') || msg.includes('sprint') || msg.includes('product owner') || msg.includes('daily')) {
    reply = "O Scrum na educação ajuda a dividir projetos de pesquisa ou trabalhos longos em ciclos chamados 'Sprints' (normalmente de 1 a 2 semanas). O professor costuma agir como Product Owner, direcionando os critérios de sucesso, enquanto os alunos se auto-organizam para realizar o trabalho.";
  } else if (msg.includes('kanban') || msg.includes('quadro') || msg.includes('fluxo')) {
    reply = "O Kanban é um método visual incrível para gerenciar tarefas de projetos escolares! Você pode usar um quadro com colunas simples: 'A Fazer', 'Em Execução' (ou Fazendo) e 'Concluído'. Isso ajuda o grupo a ver o progresso de cada membro e evitar gargalos.";
  } else if (msg.includes('design thinking') || msg.includes('empatia') || msg.includes('protótipo') || msg.includes('prototipagem') || msg.includes('ideação')) {
    reply = "O Design Thinking na educação foca em resolver problemas da escola ou da comunidade sob a ótica dos alunos. Ele passa por: 1) Empatia (ouvir o outro), 2) Definição do problema, 3) Ideação (brainstorming), 4) Prototipagem (criar versões simples da ideia) e 5) Testes.";
  } else if (msg.includes('pmbok') || msg.includes('escopo') || msg.includes('cronograma') || msg.includes('stakeholder') || msg.includes('partes interessadas')) {
    reply = "O PMBOK é o guia de boas práticas de gestão de projetos. Na educação, focamos em definir bem o **Escopo** (o que o trabalho vai entregar) e o **Cronograma** (datas de entrega e marcos importantes). Também identificamos os **Stakeholders** (como alunos, pais, professores e comunidade escolar).";
  } else if (msg.includes('pontos') || msg.includes('xp') || msg.includes('gamificação') || msg.includes('ranking') || msg.includes('liderança') || msg.includes('leaderboard')) {
    reply = "A nossa gamificação recompensa seu aprendizado! Cada curso concluído com sucesso no quiz te dá XP (Pontos de Experiência). Quanto mais cursos você concluir, mais alto subirá no ranking de alunos (Leaderboard). Pratique e conquiste o topo!";
  } else if (msg.includes('obrigado') || msg.includes('valeu') || msg.includes('obrigada')) {
    reply = "De nada! Estou sempre à disposição. Continue estudando e pontuando nos nossos quizzes de gerenciamento de projetos!";
  } else {
    reply = "Interessante! Como assistente de projetos educacionais, sugiro focar sua dúvida em tópicos como: 'Metodologias Ágeis', 'Scrum', 'Kanban', 'Design Thinking' ou os conceitos do 'PMBOK' (escopo, cronograma, riscos). Pode reformular a pergunta?";
  }

  res.status(200).json({
    message: userMessage,
    reply: reply
  });
};
