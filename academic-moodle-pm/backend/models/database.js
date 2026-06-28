const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// Caminho absoluto para o banco de dados
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite com sucesso.');
  }
});

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Inicialização das tabelas
db.serialize(() => {
  // 1. Tabela de Usuários (com role, avatar e points)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student', -- 'student', 'advisor', 'administrator'
      avatar TEXT DEFAULT '👨‍🎓',
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Tabela de Cursos
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      xp_reward INTEGER DEFAULT 100
    )
  `);

  // 3. Tabela de Quizzes
  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT,
      FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    )
  `);

  // 4. Tabela de Progresso do Curso
  db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER,
      course_id INTEGER,
      completed INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    )
  `);

  // 5. Tabela de Projetos (Scrum/Kanban)
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      owner_id INTEGER,
      advisor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (advisor_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // 6. Tabela de Membros do Projeto
  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER,
      user_id INTEGER,
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 7. Tabela de Sprints
  db.run(`
    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `);

  // 8. Tabela de Tarefas do Kanban
  db.run(`
    CREATE TABLE IF NOT EXISTS project_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER,
      status TEXT DEFAULT 'todo', -- 'todo', 'progress', 'review', 'done'
      xp_reward INTEGER DEFAULT 20,
      FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // 9. Tabela de Tópicos do Fórum
  db.run(`
    CREATE TABLE IF NOT EXISTS forum_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // 10. Tabela de Respostas do Fórum
  db.run(`
    CREATE TABLE IF NOT EXISTS forum_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER,
      content TEXT NOT NULL,
      author_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES forum_topics (id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // 11. Histórico de Evolução de XP dos Alunos (para gráficos)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_xp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      points INTEGER NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Gestão de Projetos', -- Categoria para o radar de habilidades
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Seeding inicial se a tabela de cursos estiver vazia
  db.get("SELECT COUNT(*) as count FROM courses", (err, row) => {
    if (err) return console.error(err.message);

    if (row.count === 0) {
      console.log("Banco de dados vazio. Semeando dados das 8 áreas tecnológicas...");

      // A. Cadastrar Usuários (Dono, Orientador, Administrador e Alunos)
      const usersData = [
        { u: 'Coordenador_Marcio', e: 'coordenacao@escola.com', p: 'senha123', r: 'administrator', a: '👨‍💼', pts: 0 },
        { u: 'Prof_Marcio', e: 'marcio@escola.com', p: 'senha123', r: 'advisor', a: '👨‍🏫', pts: 0 },
        { u: 'Estudante_Ana', e: 'ana@escola.com', p: 'senha123', r: 'student', a: '👩‍🎓', pts: 320 },
        { u: 'Estudante_Carlos', e: 'carlos@escola.com', p: 'senha123', r: 'student', a: '👨‍🎓', pts: 180 }
      ];

      usersData.forEach((usr) => {
        db.run(
          `INSERT OR IGNORE INTO users (username, email, password, role, avatar, points) VALUES (?, ?, ?, ?, ?, ?)`,
          [usr.u, usr.e, hashPassword(usr.p), usr.r, usr.a, usr.pts],
          function(err) {
            if (err) return console.error(usr.u, err.message);
            const uid = this.lastID;
            
            // Gerar logs históricos de evolução de XP para estudantes
            if (usr.r === 'student' && uid > 0) {
              const logs = [
                { p: 50, d: 'Log de Entrada', cat: 'Gestão de Projetos', date: '2026-06-22 10:00:00' },
                { p: 150, d: 'Concluiu Quiz: Gestão de Projetos em TI', cat: 'Gestão de Projetos', date: '2026-06-23 14:00:00' },
                { p: 200, d: 'Concluiu Quiz: Redes de Computadores', cat: 'Redes de Computadores', date: '2026-06-24 16:30:00' },
                { p: usr.pts, d: 'Leitura de PDF: Fundamentos de Linux', cat: 'Linux', date: '2026-06-25 11:20:00' }
              ];
              logs.forEach(log => {
                db.run(
                  `INSERT INTO user_xp_log (user_id, points, description, category, timestamp) VALUES (?, ?, ?, ?, ?)`,
                  [uid, log.p, log.d, log.cat, log.date]
                );
              });
            }
          }
        );
      });

      // B. Cadastrar Cursos das 8 Áreas Tecnológicas
      const coursesToSeed = [
        {
          t: "Gestão de Projetos em TI na Educação",
          d: "Aprenda conceitos fundamentais como escopo, cronograma e stakeholders adaptados a projetos pedagógicos e institucionais escolares com foco em TI.",
          c: "Gestão de Projetos",
          xp: 100,
          img: "images/banner_pm_ti.png",
          q: "O que define essencialmente um 'projeto' no contexto escolar/educativo de TI?",
          opts: ["Uma atividade de rotina realizada de maneira repetitiva pelas equipes pedagógicas.", "Um esforço temporário com início e fim definidos para implantar uma solução de tecnologia educacional única.", "Uma lista de deveres de casa passados pela diretoria de ensino.", "Qualquer teste avaliativo obrigatório aplicado no final de um período letivo."],
          correct: 1,
          exp: "Projetos de TI na educação caracterizam-se por sua natureza temporária e pela entrega de um resultado exclusivo, como implementar um novo sistema escolar."
        },
        {
          t: "Introdução à Ciência de Dados Educacional",
          d: "Como coletar, processar e analisar dados de rendimento e engajamento dos alunos para aprimorar o processo de ensino-aprendizagem.",
          c: "Ciência de Dados",
          xp: 100,
          img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60",
          q: "Qual o papel principal da Análise Preditiva na educação?",
          opts: ["Dar notas automáticas baseadas no comportamento social.", "Identificar previamente padrões de alunos com risco de evasão escolar ou dificuldades de aprendizado.", "Substituir o trabalho administrativo da secretaria.", "Impedir os estudantes de mudarem de curso."],
          correct: 1,
          exp: "A análise preditiva em dados educacionais permite que a coordenação pedagógica identifique alunos em risco de evasão a tempo de realizar intervenções de suporte."
        },
        {
          t: "Fundamentos de Inteligência Artificial",
          d: "Entenda redes neurais, machine learning e como aplicar IA Generativa para auxiliar professores na formulação de planos de aula.",
          c: "Inteligência Artificial",
          xp: 100,
          img: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60",
          q: "O que é Aprendizado por Reforço no contexto da IA?",
          opts: ["Um método de punição para alunos que não fazem as tarefas.", "Um tipo de aprendizado onde um agente toma decisões e aprende através de recompensas ou penalidades.", "Decorar conteúdos repetitivos até fixação.", "Uma prova de recuperação obrigatória."],
          correct: 1,
          exp: "No aprendizado por reforço, o modelo aprende por tentativa e erro a maximizar uma recompensa numérica definida no ambiente."
        },
        {
          t: "Algoritmos e Estruturas de Dados",
          d: "Desenvolva o raciocínio lógico estruturado por meio de filas, pilhas, árvores binárias e algoritmos de busca e ordenação.",
          c: "Ciência da Computação",
          xp: 100,
          img: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=500&auto=format&fit=crop&q=60",
          q: "Qual a principal característica de uma estrutura de dados do tipo Pilha (Stack)?",
          opts: ["Acesso aleatório a qualquer elemento em tempo constante.", "O primeiro elemento a entrar é o primeiro a sair (FIFO).", "O último elemento a entrar é o primeiro a sair (LIFO).", "Armazenamento hierárquico em árvore."],
          correct: 2,
          exp: "Pilhas funcionam no padrão LIFO (Last In, First Out), onde as operações de inserção (push) e remoção (pop) ocorrem apenas no topo."
        },
        {
          t: "Administração de Sistemas Linux",
          d: "Aprenda a operar no terminal de comando do Linux, gerenciar permissões de arquivos, usuários e configurar servidores escolares.",
          c: "Linux",
          xp: 100,
          img: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500&auto=format&fit=crop&q=60",
          q: "Qual comando Linux é utilizado para alterar as permissões de acesso a arquivos?",
          opts: ["chown", "chmod", "mv", "ls -l"],
          correct: 1,
          exp: "O comando 'chmod' (change mode) altera as permissões de leitura, escrita e execução para o dono, grupo e outros usuários."
        },
        {
          t: "Arquitetura Cloud Multi-nuvem",
          d: "Explore serviços de computação em nuvem em plataformas como AWS, GCP, Azure e a nuvem nacional Magalu Cloud.",
          c: "Cloud",
          xp: 100,
          img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60",
          q: "O que caracteriza uma arquitetura Multi-cloud?",
          opts: ["Utilizar exclusivamente um único provedor de nuvem privada.", "O uso de serviços de nuvem pública de dois ou mais provedores de nuvem diferentes.", "A instalação física de servidores em salas de aula convencionais.", "Configuração de rede cabeada local sem acesso à internet."],
          correct: 1,
          exp: "Multi-cloud envolve a distribuição de recursos entre múltiplos provedores de nuvem (como AWS + Azure + Magalu Cloud) para evitar dependência de fornecedor único e aumentar resiliência."
        },
        {
          t: "Monitoramento e Observabilidade",
          d: "Aprenda a configurar Prometheus, Grafana e criar dashboards de métricas em tempo real para monitorar servidores escolares.",
          c: "Monitoramento",
          xp: 100,
          img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60",
          q: "Qual a diferença essencial entre Monitoramento e Observabilidade?",
          opts: ["Monitoramento diz se o sistema está funcionando; Observabilidade ajuda a entender o porquê de um comportamento anômalo a partir de seus outputs.", "Monitoramento vigia os alunos na sala; Observabilidade vigia os computadores.", "Não há diferença, são exatamente a mesma coisa.", "Observabilidade é o monitoramento restrito a redes sociais."],
          correct: 0,
          exp: "Monitoramento acompanha logs/métricas predefinidas ('o sistema caiu?'). Observabilidade analisa logs, métricas e traces de forma ampla para diagnosticar causas de bugs desconhecidos."
        },
        {
          t: "Fundamentos de Redes de Computadores",
          d: "Mapeie infraestruturas de rede escolar, protocolos TCP/IP, subredes e configurações de segurança de roteadores.",
          c: "Redes de Computadores",
          xp: 100,
          img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60",
          q: "Qual a função do protocolo DNS em uma rede de computadores?",
          opts: ["Proteger a rede contra vírus e malwares externos.", "Traduzir nomes de domínio legíveis por humanos (como google.com) em endereços IP de servidores.", "Distribuir energia elétrica aos switches.", "Controlar a velocidade de download de arquivos."],
          correct: 1,
          exp: "O DNS (Domain Name System) funciona como uma lista telefônica da internet, convertendo nomes de domínios em IPs numéricos para localização dos servidores."
        }
      ];

      coursesToSeed.forEach((c) => {
        db.run(
          `INSERT INTO courses (title, description, category, xp_reward, image_url) 
           VALUES (?, ?, ?, ?, ?)`,
          [c.t, c.d, c.c, c.xp, c.img],
          function(err) {
            if (err) return console.error(err.message);
            const courseId = this.lastID;
            
            // Seed do Quiz para este curso
            db.run(
              `INSERT INTO quizzes (course_id, question, options, correct_option_index, explanation) VALUES (?, ?, ?, ?, ?)`,
              [courseId, c.q, JSON.stringify(c.opts), c.correct, c.exp]
            );
          }
        );
      });

      // C. Cadastrar Projeto de Exemplo
      db.run(
        `INSERT INTO projects (title, description, owner_id, advisor_id) VALUES (?, ?, ?, ?)`,
        [
          "Portal Tech Marc TI Escola",
          "Desenvolvimento de um sistema web escolar para controle de projetos acadêmicos e repositório de recursos educativos.",
          3, // Estudante_Ana (Dono)
          2  // Prof_Marcio (Orientador)
        ],
        function(err) {
          if (err) return console.error(err.message);
          const projId = this.lastID;

          db.run(`INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`, [projId, 3]);
          db.run(`INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`, [projId, 4]);

          // Criar Sprint
          db.run(
            `INSERT INTO sprints (project_id, title, status) VALUES (?, ?, ?)`,
            [projId, "Sprint 1: Concepção & Modelagem", "active"],
            function(err) {
              if (err) return console.error(err.message);
              const sprintId = this.lastID;

              const tasks = [
                { t: "Levantamento de Requisitos de TI", d: "Entrevistar professores sobre o uso de salas de TI.", u: 3, s: "done", xp: 30 },
                { t: "Configurar Banco de Dados SQLite", d: "Desenhar as tabelas e conectar no Node.js.", u: 4, s: "review", xp: 40 },
                { t: "Configurar Servidor de Nuvem AWS", d: "Configurar uma EC2 para a hospedagem provisória.", u: 3, s: "progress", xp: 35 }
              ];

              tasks.forEach((task) => {
                db.run(
                  `INSERT INTO project_tasks (sprint_id, title, description, assigned_to, status, xp_reward) 
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [sprintId, task.t, task.d, task.u, task.s, task.xp]
                );
              });
            }
          );
        }
      );

      // D. Cadastrar Tópicos de Fórum de Discussão Inicial
      db.run(
        `INSERT INTO forum_topics (title, content, author_id) VALUES (?, ?, ?)`,
        [
          "Qual o melhor provedor para hospedar o projeto escolar: AWS ou Magalu Cloud?",
          "Estamos iniciando a fase de deploy em Cloud do nosso projeto. Qual provedor é mais indicado para fins didáticos e custo-benefício?",
          4 // Estudante_Carlos
        ],
        function(err) {
          if (err) return console.error(err.message);
          const topicId = this.lastID;

          db.run(
            `INSERT INTO forum_replies (topic_id, content, author_id) VALUES (?, ?, ?)`,
            [
              topicId,
              "Para projetos escolares nacionais, a Magalu Cloud oferece excelente custo-benefício, faturamento em reais e baixa latência. Se precisarem de serviços globais complexos de arquitetura, a AWS é excelente, embora mais complexa.",
              2 // Prof_Marcio (Orientador)
            ]
          );
        }
      );
    }
  });
});

module.exports = db;
