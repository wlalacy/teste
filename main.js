const Main = (() => {
  const navLinks = document.getElementById('navLinks');
  const loginHint = document.getElementById('loginHint');

  const renderNav = (role) => {
    navLinks.innerHTML = '';
    const links = role === 'admin'
      ? [
          { id: 'adminDashboard', label: 'Painel Admin' },
          { id: 'profilePanel', label: 'Perfil' },
        ]
      : [
          { id: 'studentDashboard', label: 'Dashboard' },
          { id: 'profilePanel', label: 'Perfil' },
        ];
    links.forEach((link) => {
      const button = document.createElement('button');
      button.textContent = link.label;
      button.dataset.target = link.id;
      button.addEventListener('click', () => {
        UI.showPanel(link.id);
        setActiveNav(link.id);
      });
      navLinks.appendChild(button);
    });
  };

  const setActiveNav = (panelId) => {
    navLinks.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.target === panelId);
    });
  };

  const renderStudentDashboard = () => {
    const user = Auth.currentUser();
    if (!user) return;
    const data = Storage.getData();
    const exam = data.exams.find((item) => item.level === user.level) || data.exams[0];
    const attempt = data.attempts.find((item) => item.userId === user.id && item.examId === exam?.id);
    const status = UI.computeExamStatus(exam, attempt);
    const statusBadge = document.getElementById('studentStatusBadge');
    statusBadge.textContent = status.label;

    const buttonConfig = {
      blocked: { label: 'Bloqueada', disabled: true },
      available: { label: 'Iniciar prova', disabled: false },
      in_progress: { label: 'Continuar prova', disabled: false },
      submitted: { label: 'Ver comprovante de envio', disabled: true },
      published: { label: 'Ver resultado completo', disabled: false },
      closed: { label: 'Encerrada', disabled: true },
      none: { label: 'Sem prova', disabled: true },
    }[status.status] || { label: 'Sem prova', disabled: true };

    const cards = [
      `
      <div class="card">
        <h3>OMMO Atual</h3>
        <p class="muted">${exam?.name || 'Nenhuma olimpíada ativa'}</p>
        <p class="highlight">${status.label}</p>
        ${status.status === 'blocked' ? `<p class="muted">Abertura em: ${UI.formatDateTime(status.opensAt)}</p>` : ''}
        <button class="btn primary" id="examActionBtn" ${buttonConfig.disabled ? 'disabled' : ''}>
          ${buttonConfig.label}
        </button>
      </div>
      `,
      `
      <div class="card">
        <h3>Informações da Prova</h3>
        <p>Início: ${exam ? `${exam.startDate} ${exam.startTime}` : '—'}</p>
        <p>Fim: ${exam ? `${exam.endDate} ${exam.endTime}` : '—'}</p>
        <p>Duração máxima: ${exam?.durationMinutes || 0} min</p>
        <p>Tempo restante: ${attempt?.submittedAt ? 'Finalizada' : status.status === 'in_progress' ? 'Em andamento' : '—'}</p>
      </div>
      `,
      `
      <div class="card ${attempt?.published ? '' : 'hidden'}">
        <h3>Desempenho</h3>
        <p>Objetiva: ${attempt?.scores.objective || 0}</p>
        <p>Discursiva: ${attempt?.scores.discursive || 0}</p>
        <p>Nota final: ${attempt?.scores.final || 0}</p>
        <p>Medalha: <span class="medal">${UI.medalLabel(attempt?.medal)}</span></p>
      </div>
      `,
      `
      <div class="card">
        <h3>Histórico de participações</h3>
        <p class="muted">Em breve.</p>
      </div>
      `,
    ];

    document.getElementById('studentCards').innerHTML = cards.join('');

    const examActionBtn = document.getElementById('examActionBtn');
    if (examActionBtn && exam) {
      examActionBtn.addEventListener('click', () => {
        if (status.status === 'available' || status.status === 'in_progress') {
          Exam.start(exam, user);
          return;
        }
        if (status.status === 'published') {
          UI.toast('Resultado liberado. Consulte o card de desempenho.');
          return;
        }
        UI.toast('A prova não está disponível.', 'danger');
      });
    }
  };

  const renderProfile = () => {
    const user = Auth.currentUser();
    const data = Storage.getData();
    const attempt = data.attempts.find((item) => item.userId === user?.id);
    const cards = [
      `
      <div class="card">
        <h3>Perfil</h3>
        <p>Nome: ${user?.name}</p>
        <p>Email: ${user?.email}</p>
        <p>Nível: ${user?.level}</p>
        <p>Status inscrição: ${attempt?.status || 'Inscrito'}</p>
        <p>Data inscrição: ${UI.formatDateTime(user?.createdAt)}</p>
      </div>
      `,
      `
      <div class="card">
        <h3>Atualizar senha</h3>
        <div class="form-grid">
          <input type="password" id="newPassword" placeholder="Nova senha" />
          <button class="btn primary" id="updatePasswordBtn">Salvar</button>
        </div>
      </div>
      `,
    ];
    document.getElementById('profileCards').innerHTML = cards.join('');

    document.getElementById('updatePasswordBtn')?.addEventListener('click', () => {
      const value = document.getElementById('newPassword').value;
      if (!value) {
        UI.toast('Digite uma nova senha.', 'danger');
        return;
      }
      Auth.updatePassword(user.id, value);
      UI.toast('Senha atualizada.');
    });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const response = Auth.login(email, password);
    if (!response.success) {
      loginHint.textContent = response.message;
      loginHint.classList.add('muted');
      return;
    }
    bootstrap();
  };

  const bootstrap = () => {
    const user = Auth.currentUser();
    document.getElementById('sideNav').classList.toggle('hidden', !user);
    document.getElementById('appShell').classList.toggle('logged-out', !user);
    if (!user) {
      UI.showPanel('loginPanel');
      return;
    }
    renderNav(user.role);
    if (user.role === 'admin') {
      Admin.initTabs();
      Admin.render();
      Admin.bindEvents();
      UI.showPanel('adminDashboard');
      setActiveNav('adminDashboard');
    } else {
      renderStudentDashboard();
      UI.showPanel('studentDashboard');
      setActiveNav('studentDashboard');
    }
    renderProfile();
  };

  const bindEvents = () => {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      Auth.logout();
      bootstrap();
    });
    document.getElementById('saveDraftBtn').addEventListener('click', () => {
      UI.toast('Rascunho salvo.');
    });
    document.getElementById('submitExamBtn').addEventListener('click', () => {
      if (confirm('Deseja enviar a prova?')) {
        Exam.forceSubmit('Enviado');
      }
    });
  };

  return {
    bootstrap,
    bindEvents,
    renderStudentDashboard,
  };
})();

Main.bindEvents();
Main.bootstrap();
