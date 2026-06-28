let userObj = null;
let currentChartStudentId = null;

document.addEventListener('DOMContentLoaded', () => {
  userObj = window.checkAuth();
  if (!userObj) return;
  window.initHeader();

  loadLeaderboard();
});

async function loadLeaderboard() {
  const rankingList = document.getElementById('ranking-list');
  if (!rankingList) return;

  try {
    const response = await fetch(`${window.API_BASE}/evolution/students`);
    if (!response.ok) throw new Error('Não foi possível obter a lista de classificação.');
    
    const students = await response.json();

    // 1. Preencher o Pódio
    updatePodium(students);

    // 2. Preencher a Tabela Geral click-to-view chart
    rankingList.innerHTML = '';
    if (students.length === 0) {
      rankingList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum aluno cadastrado.</div>';
      return;
    }

    students.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'ranking-tr clickable';
      row.id = `student-row-${s.id}`;
      row.onclick = () => selectStudentForChart(s.id, s.username);
      
      row.innerHTML = `
        <div class="ranking-td rank">#${s.rank}</div>
        <div class="ranking-td name">
          <span style="font-size: 16px; margin-right: 8px;">${s.avatar || '👨‍🎓'}</span>
          ${s.username} ${s.id === userObj.id ? '<span style="font-size:11px; padding:1px 6px; background:rgba(147,51,234,0.1); border-radius:10px; color:var(--accent-purple);">Você</span>' : ''}
        </div>
        <div class="ranking-td points">${s.points} XP</div>
      `;
      rankingList.appendChild(row);
    });

    // Abre o gráfico do primeiro colocado por padrão
    if (students.length > 0) {
      selectStudentForChart(students[0].id, students[0].username);
    }

  } catch (error) {
    console.error(error);
    rankingList.innerHTML = `<div style="text-align: center; color: #f87171; padding: 20px;">Erro: ${error.message}</div>`;
  }
}

function updatePodium(users) {
  const first = users.find(u => u.rank === 1) || { username: 'Vazio', points: 0, avatar: '👨‍🎓' };
  const second = users.find(u => u.rank === 2) || { username: 'Vazio', points: 0, avatar: '👨‍🎓' };
  const third = users.find(u => u.rank === 3) || { username: 'Vazio', points: 0, avatar: '👨‍🎓' };

  // 1º
  const p1Name = document.getElementById('p1-name');
  const p1Xp = document.getElementById('p1-xp');
  const p1Avatar = document.getElementById('p1-avatar');
  if (p1Name && p1Xp && p1Avatar) {
    p1Name.textContent = first.username;
    p1Xp.textContent = `${first.points} XP`;
    p1Avatar.textContent = first.avatar;
  }

  // 2º
  const p2Name = document.getElementById('p2-name');
  const p2Xp = document.getElementById('p2-xp');
  const p2Avatar = document.getElementById('p2-avatar');
  if (p2Name && p2Xp && p2Avatar) {
    p2Name.textContent = second.username;
    p2Xp.textContent = `${second.points} XP`;
    p2Avatar.textContent = second.avatar;
  }

  // 3º
  const p3Name = document.getElementById('p3-name');
  const p3Xp = document.getElementById('p3-xp');
  const p3Avatar = document.getElementById('p3-avatar');
  if (p3Name && p3Xp && p3Avatar) {
    p3Name.textContent = third.username;
    p3Xp.textContent = `${third.points} XP`;
    p3Avatar.textContent = third.avatar;
  }
}

// Seleciona estudante para exibir gráfico de evolução
async function selectStudentForChart(studentId, studentName) {
  currentChartStudentId = studentId;

  // Remove a classe selecionada de todas as linhas e adiciona na ativa
  const rows = document.querySelectorAll('.ranking-tr.clickable');
  rows.forEach(r => r.classList.remove('selected'));
  
  const activeRow = document.getElementById(`student-row-${studentId}`);
  if (activeRow) activeRow.classList.add('selected');

  const chartTitle = document.getElementById('chart-student-title');
  if (chartTitle) chartTitle.textContent = studentName;

  try {
    const response = await fetch(`${window.API_BASE}/evolution/${studentId}/xp-log`);
    if (!response.ok) throw new Error('Não foi possível obter logs de evolução de XP.');
    const logData = await response.json();

    renderEvolutionChart(logData);

  } catch (error) {
    console.error(error);
  }
}

// Renderizar gráfico de evolução customizado em HTML5 Canvas
function renderEvolutionChart(logs) {
  const canvas = document.getElementById('evolution-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Tratar densidade de retina (DPI)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Limpar
  ctx.clearRect(0, 0, width, height);

  // Se não houver logs de evolução
  if (logs.length === 0) {
    ctx.font = '14px Plus Jakarta Sans';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma evolução de XP registrada ainda.', width / 2, height / 2);
    return;
  }

  // Margens internas
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Encontrar valores máximo e mínimo de XP
  const xpValues = logs.map(l => l.points);
  const maxXP = Math.max(...xpValues, 100); // Garante escala mínima de 100
  const minXP = 0;

  // Desenhar Gridlines Horizontais
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.05)';
  ctx.lineWidth = 1;
  ctx.font = '10px Plus Jakarta Sans';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const yVal = minXP + ((maxXP - minXP) * (i / gridSteps));
    const yPos = paddingTop + chartHeight - (i / gridSteps) * chartHeight;
    
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yPos);
    ctx.lineTo(width - paddingRight, yPos);
    ctx.stroke();

    ctx.fillText(`${Math.floor(yVal)} XP`, paddingLeft - 10, yPos);
  }

  // Calcular coordenadas X e Y dos pontos
  const points = [];
  logs.forEach((log, index) => {
    const xPos = paddingLeft + (index / Math.max(1, logs.length - 1)) * chartWidth;
    const yPercent = (log.points - minXP) / (maxXP - minXP);
    const yPos = paddingTop + chartHeight - yPercent * chartHeight;
    points.push({ x: xPos, y: yPos, log: log });
  });

  // 1. Desenhar a sombra/gradiente sob a linha
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, paddingTop + chartHeight);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, paddingTop + chartHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.15)');
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 2. Desenhar a linha principal de evolução
  ctx.beginPath();
  ctx.strokeStyle = '#9333ea';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  // 3. Desenhar círculos nos pontos e os rótulos de marco de evolução
  points.forEach((p, index) => {
    // Círculo principal
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Rótulo da evolução (XP e descrição simplificada)
    ctx.font = '9px Plus Jakarta Sans';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${p.log.points} XP`, p.x, p.y - 8);

    // Rótulo do eixo X (Datas dos marcos)
    ctx.font = '8px Plus Jakarta Sans';
    ctx.fillStyle = '#64748b';
    ctx.textBaseline = 'top';
    const date = new Date(p.log.timestamp);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
    ctx.fillText(dateStr, p.x, paddingTop + chartHeight + 10);
  });
}
