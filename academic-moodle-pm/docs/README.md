# Moodle-PM - Gestão de Projetos na Educação

Este é um projeto acadêmico de exemplo estilo Moodle focado em **Gestão de Projetos na Educação**, integrando recursos avançados de **Gamificação** (sistema de pontuação XP e leaderboard/ranking de alunos) e um **Chatbot Acadêmico** para respostas de dúvidas conceituais.

---

## 🚀 Tecnologias Utilizadas

### Frontend:
- **HTML5** (Semântico e estruturado)
- **CSS3** (Estilização Vanilla com variáveis responsivas, efeitos de Glassmorphism e animações modernas)
- **JavaScript** (Lógica do cliente, gerenciamento de estado e requisições assíncronas `fetch` com a API)

### Backend:
- **Node.js** com **Express**
- **SQLite3** (Banco de dados local e embarcado para persistência simples)
- **CORS** e **Body-Parser** (Processamento de requisições e segurança)
- Hashing SHA-256 nativo (`crypto`) para segurança de senhas de usuários

---

## 📂 Estrutura de Pastas

```
/academic-moodle-pm
  ├── package.json               # Configurações do projeto e dependências
  ├── /frontend                  # Interface do Usuário
  │     ├── index.html           # Página de apresentação / Landing
  │     ├── login.html           # Portal de Acesso e Cadastro Integrados
  │     ├── dashboard.html       # Painel do Estudante com Trilhas e Progresso
  │     ├── quiz.html            # Área de Quizzes com Feedback Imediato
  │     ├── chatbot.html         # Assistente Acadêmico Virtual com IA simulada
  │     ├── leaderboard.html     # Ranking Geral dos Alunos com Pódio
  │     ├── /css
  │     │    └── style.css       # Folha de estilos unificada (design premium)
  │     └── /js
  │          ├── auth.js         # Controle est est estático e controle de sessão
  │          ├── dashboard.js    # Consumo e renderização de cursos
  │          ├── quiz.js         # Lógica de seleção e envio de respostas
  │          ├── chatbot.js      # Interação com a API do robô auxiliar
  │          └── leaderboard.js  # Atualização do pódio e ranking
  ├── /backend                   # Servidor API e Banco de Dados
  │     ├── server.js            # Arquivo de inicialização e rotas estáticas
  │     ├── /routes              # Definições de endpoints da API
  │     ├── /controllers         # Regras de negócios do sistema
  │     └── /models
  │          └── database.js     # Conexão SQLite e Semeadura de dados (seeding)
  └── /docs
        └── README.md            # Documentação de Instalação e Uso (este arquivo)
```

---

## ⚙️ Instruções de Instalação e Execução

### Pré-requisitos
Certifique-se de ter o **Node.js** instalado em sua máquina.

### Passo 1: Instalar Dependências
Navegue até a raiz do projeto no seu terminal e execute:
```bash
npm install
```
Este comando instalará o `express`, `sqlite3`, `cors` e `body-parser` configurados no `package.json`.

### Passo 2: Iniciar o Servidor
Com as dependências instaladas, inicialize a aplicação rodando:
```bash
npm start
```

Você verá no console a mensagem confirmando que o servidor foi iniciado:
```
=============================================================
 Servidor Moodle Acadêmico - Gestão de Projetos Iniciado!
 Porta local: http://localhost:3000
 Backend da API rodando sob: http://localhost:3000/api/...
=============================================================
```

---

## 🖥️ Como Acessar a Aplicação

Graças ao roteamento de arquivos estáticos configurado no backend, você pode rodar e interagir com toda a aplicação utilizando apenas um único endereço local:

- **Frontend Integrado (Interface Completa):** Abra seu navegador e acesse [http://localhost:3000](http://localhost:3000).
- **Endpoints de Teste da API:**
  - Lista de Cursos: `GET http://localhost:3000/api/courses`
  - Ranking Geral: `GET http://localhost:3000/api/leaderboard`

---

## 🎮 Funcionalidades Principais Demonstradas

1. **Cadastro e Login de Estudantes:** Sistema de autenticação local persistindo usuários no SQLite com senhas protegidas por criptografia SHA-256.
2. **Dashboard Dinâmico:** Lista de trilhas de aprendizado ativas com identificação visual instantânea de cursos concluídos e recompensa de XP.
3. **Quizzes com Feedback Imediato:** O aluno responde perguntas sobre Gestão de Projetos Educacionais (Scrum, Kanban, Design Thinking, PMBOK) e recebe na hora correções, justificativas e pontuação de XP no perfil.
4. **Pódio e Ranking Global:** Uma interface de leaderboard interativa exibindo os top 3 alunos no pódio decorado e a listagem de todos os usuários pontuados.
5. **Chatbot Assistente Educacional:** Chat interativo com sugestão de tópicos rápidos e respostas dedicadas para ajudar estudantes na jornada de gestão de projetos.
