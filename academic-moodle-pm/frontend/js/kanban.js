let currentProject = null;
let currentSprint = null;
let userObj = null;
let projectMembers = [];

document.addEventListener('DOMContentLoaded', () => {
  userObj = window.checkAuth();
  if (!userObj) return;
  window.initHeader();

  loadProjects();

  // Configurar submissões de formulários e modais
  document.getElementById('create-project-form')?.addEventListener('submit', handleCreateProject);
  document.getElementById('create-sprint-form')?.addEventListener('submit', handleCreateSprint);
  document.getElementById('create-task-form')?.addEventListener('submit', handleCreateTask);
  document.getElementById('add-member-form')?.addEventListener('submit', handleAddMember);
});

// Carregar projetos do usuário
async function loadProjects() {
  try {
    const response = await fetch(`${window.API_BASE}/projects?userId=${userObj.id}`);
    if (!response.ok) throw new Error('Falha ao carregar projetos.');
    
    const projects = await response.json();
    const projectSelector = document.getElementById('project-selector');
    
    if (projectSelector) {
      projectSelector.innerHTML = '<option value="">-- Selecione um Projeto --</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.title;
        projectSelector.appendChild(opt);
      });
    }

    if (projects.length > 0) {
      // Abre o primeiro projeto por padrão
      selectProject(projects[0].id);
      if (projectSelector) projectSelector.value = projects[0].id;
    } else {
      showNoProjectsState();
    }

  } catch (error) {
    console.error(error);
    alert('Erro ao carregar projetos do estudante.');
  }
}

// Alterar projeto selecionado
async function selectProject(projectId) {
  if (!projectId) {
    showNoProjectsState();
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE}/projects?userId=${userObj.id}`);
    const projects = await response.json();
    currentProject = projects.find(p => p.id == projectId);

    if (currentProject) {
      document.getElementById('no-project-state').style.display = 'none';
      document.getElementById('project-active-state').style.display = 'block';

      // Atualiza cabeçalhos
      document.getElementById('active-project-title').textContent = currentProject.title;
      document.getElementById('active-project-desc').textContent = currentProject.description;
      document.getElementById('active-project-advisor').textContent = currentProject.advisor_name || 'Nenhum orientador associado';

      // Carrega orientadores elegíveis se for dono
      if (currentProject.owner_id === userObj.id) {
        document.getElementById('advisor-assignment-section').style.display = 'block';
        loadAdvisorsList();
      } else {
        document.getElementById('advisor-assignment-section').style.display = 'none';
      }

      // Carregar membros do projeto
      loadProjectMembers(projectId);

      // Carregar Sprints e Kanban
      loadKanbanData(projectId);
    }
  } catch (error) {
    console.error(error);
  }
}

function showNoProjectsState() {
  document.getElementById('no-project-state').style.display = 'block';
  document.getElementById('project-active-state').style.display = 'none';
}

// Carregar Orientadores
async function loadAdvisorsList() {
  try {
    const response = await fetch(`${window.API_BASE}/projects/advisors`);
    const advisors = await response.json();
    const select = document.getElementById('assign-advisor-select');
    if (select) {
      select.innerHTML = '<option value="">-- Vincular Orientador --</option>';
      advisors.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.username;
        if (currentProject && currentProject.advisor_id == a.id) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error(error);
  }
}

// Associar Orientador
async function assignAdvisor() {
  const advisorId = document.getElementById('assign-advisor-select').value;
  if (!advisorId) return;

  try {
    const response = await fetch(`${window.API_BASE}/projects/add-advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentProject.id, advisorId: parseInt(advisorId) })
    });

    if (response.ok) {
      alert('Orientador associado ao projeto com sucesso!');
      selectProject(currentProject.id);
    }
  } catch (error) {
    console.error(error);
  }
}

// Carregar Membros do Projeto
async function loadProjectMembers(projectId) {
  try {
    const response = await fetch(`${window.API_BASE}/projects/${projectId}/members`);
    projectMembers = await response.json();
    
    const container = document.getElementById('active-project-members');
    if (container) {
      container.innerHTML = projectMembers.map(m => `
        <span class="user-badge" style="padding: 4px 10px; font-size: 12.5px; border-radius: 4px;">
          <span>${m.avatar}</span>
          <strong>${m.username}</strong>
        </span>
      `).join(' ');
    }

    // Preencher também a lista de atribuição de tarefas
    const taskAssigneeSelect = document.getElementById('task-assigned-select');
    if (taskAssigneeSelect) {
      taskAssigneeSelect.innerHTML = '<option value="">-- Atribuir Membro --</option>';
      projectMembers.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.username;
        taskAssigneeSelect.appendChild(opt);
      });
    }

  } catch (error) {
    console.error(error);
  }
}

// Carregar Kanban e Sprints
async function loadKanbanData(projectId) {
  try {
    const response = await fetch(`${window.API_BASE}/kanban/${projectId}`);
    const data = await response.json();

    const sprintSelect = document.getElementById('sprint-selector');
    if (sprintSelect) {
      sprintSelect.innerHTML = '';
      data.sprints.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.title;
        sprintSelect.appendChild(opt);
      });

      if (data.sprints.length > 0) {
        if (!currentSprint || !data.sprints.some(s => s.id == currentSprint.id)) {
          currentSprint = data.sprints[0];
        } else {
          currentSprint = data.sprints.find(s => s.id == currentSprint.id);
        }
        sprintSelect.value = currentSprint.id;
        document.getElementById('kanban-board').style.display = 'grid';
        renderKanbanBoard(data.tasks.filter(t => t.sprint_id == currentSprint.id));
      } else {
        currentSprint = null;
        document.getElementById('kanban-board').style.display = 'none';
        document.getElementById('kanban-todo-list').innerHTML = '';
        document.getElementById('kanban-progress-list').innerHTML = '';
        document.getElementById('kanban-review-list').innerHTML = '';
        document.getElementById('kanban-done-list').innerHTML = '';
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Trocar Sprint selecionada
function changeSprint(sprintId) {
  currentSprint = { id: parseInt(sprintId) };
  if (currentProject) {
    loadKanbanData(currentProject.id);
  }
}

// Renderizar o Kanban
function renderKanbanBoard(tasks) {
  const columns = {
    todo: document.getElementById('kanban-todo-list'),
    progress: document.getElementById('kanban-progress-list'),
    review: document.getElementById('kanban-review-list'),
    done: document.getElementById('kanban-done-list')
  };

  // Limpar colunas
  Object.values(columns).forEach(col => col.innerHTML = '');

  tasks.forEach(task => {
    const col = columns[task.status];
    if (col) {
      const card = document.createElement('div');
      card.className = 'kanban-task-card tilt-3d';
      card.innerHTML = `
        <div class="kanban-task-title">${task.title}</div>
        <div class="kanban-task-desc">${task.description || ''}</div>
        <div class="kanban-task-footer">
          <span class="kanban-task-xp">+${task.xp_reward} XP</span>
          <span class="kanban-task-assignee">
            <span class="kanban-task-avatar">${task.assigned_avatar || '👤'}</span>
            <strong>${task.assigned_name || 'Não Atribuída'}</strong>
          </span>
        </div>
        <div class="kanban-actions-row">
          ${task.status !== 'todo' ? `<button class="kanban-action-btn" onclick="moveTask(${task.id}, '${getPreviousStatus(task.status)}')">◀ Voltar</button>` : ''}
          ${task.status !== 'done' ? `<button class="kanban-action-btn" onclick="moveTask(${task.id}, '${getNextStatus(task.status)}')">Avançar ▶</button>` : ''}
        </div>
      `;
      col.appendChild(card);
    }
  });

  // Inicializar o efeito 3D nos cards criados
  if (window.initTiltEffect) {
    window.initTiltEffect();
  }
}

function getNextStatus(status) {
  const flow = { todo: 'progress', progress: 'review', review: 'done' };
  return flow[status] || 'done';
}

function getPreviousStatus(status) {
  const flow = { progress: 'todo', review: 'progress', done: 'review' };
  return flow[status] || 'todo';
}

// Mover Tarefa
async function moveTask(taskId, newStatus) {
  try {
    const response = await fetch(`${window.API_BASE}/kanban/task/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.xpAwarded > 0) {
        alert(`Parabéns! Tarefa concluída com sucesso! +${data.xpAwarded} XP concedidos.`);
        // Atualiza pontos locais e cabeçalho
        const user = JSON.parse(localStorage.getItem('moodle_user'));
        window.updateXPDisplay(user.points + data.xpAwarded);
      }
      // Recarregar
      if (currentProject) {
        loadKanbanData(currentProject.id);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Criar Projeto (Submit)
async function handleCreateProject(e) {
  e.preventDefault();
  const title = document.getElementById('project-title-input').value;
  const description = document.getElementById('project-desc-input').value;

  try {
    const response = await fetch(`${window.API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, ownerId: userObj.id })
    });

    if (response.ok) {
      alert('Projeto acadêmico criado com sucesso!');
      document.getElementById('create-project-form').reset();
      closeModal('project-modal');
      loadProjects();
    }
  } catch (error) {
    console.error(error);
  }
}

// Criar Sprint (Submit)
async function handleCreateSprint(e) {
  e.preventDefault();
  const title = document.getElementById('sprint-title-input').value;

  try {
    const response = await fetch(`${window.API_BASE}/kanban/sprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentProject.id, title })
    });

    if (response.ok) {
      alert('Sprint criada com sucesso!');
      document.getElementById('create-sprint-form').reset();
      closeModal('sprint-modal');
      loadKanbanData(currentProject.id);
    }
  } catch (error) {
    console.error(error);
  }
}

// Criar Tarefa (Submit)
async function handleCreateTask(e) {
  e.preventDefault();
  const title = document.getElementById('task-title-input').value;
  const description = document.getElementById('task-desc-input').value;
  const assignedTo = document.getElementById('task-assigned-select').value;
  const xpReward = document.getElementById('task-xp-input').value;

  try {
    const response = await fetch(`${window.API_BASE}/kanban/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sprintId: currentSprint.id,
        title,
        description,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        xpReward: parseInt(xpReward) || 20
      })
    });

    if (response.ok) {
      alert('Tarefa adicionada à Sprint!');
      document.getElementById('create-task-form').reset();
      closeModal('task-modal');
      loadKanbanData(currentProject.id);
    }
  } catch (error) {
    console.error(error);
  }
}

// Adicionar Membro Estudante
async function handleAddMember(e) {
  e.preventDefault();
  const username = document.getElementById('member-username-input').value;

  try {
    const response = await fetch(`${window.API_BASE}/projects/add-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentProject.id, username })
    });

    const data = await response.json();
    if (response.ok) {
      alert('Membro incluído no projeto!');
      document.getElementById('add-member-form').reset();
      closeModal('member-modal');
      loadProjectMembers(currentProject.id);
    } else {
      alert(data.error);
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

window.openModal = openModal;
window.closeModal = closeModal;
window.changeSprint = changeSprint;
window.moveTask = moveTask;
window.assignAdvisor = assignAdvisor;
