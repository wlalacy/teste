const Admin = (() => {
  const renderUsers = () => {
    const data = Storage.getData();
    const rows = data.users
      .filter((user) => user.role === 'student')
      .map(
        (user) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.level}</td>
          <td>${user.active ? '<span class="badge success">Ativo</span>' : '<span class="badge danger">Inativo</span>'}</td>
          <td>
            <button class="btn ghost" data-action="edit" data-id="${user.id}">Editar</button>
            <button class="btn ghost" data-action="toggle" data-id="${user.id}">${
              user.active ? 'Inativar' : 'Ativar'
            }</button>
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <div class="card">
        <h3>Gestão de Usuários</h3>
        <div class="form-grid" id="userForm">
          <div class="field">
            <label>Nome</label>
            <input type="text" id="userName" />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" id="userEmail" />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" id="userPassword" />
          </div>
          <div class="field">
            <label>Nível</label>
            <select id="userLevel">
              <option>Nível 1</option>
              <option>Nível 2</option>
              <option>Nível 3</option>
            </select>
          </div>
          <button class="btn primary" id="createUserBtn">Cadastrar usuário</button>
        </div>
      </div>
      <div class="card">
        <h3>Usuários cadastrados</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Nível</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  const renderExams = () => {
    const data = Storage.getData();
    const rows = data.exams
      .map(
        (exam) => `
      <tr>
        <td>${exam.name}</td>
        <td>${exam.level}</td>
        <td>${exam.startDate} ${exam.startTime}</td>
        <td>${exam.endDate} ${exam.endTime}</td>
        <td>${exam.questions.objective.length + exam.questions.discursive.length}</td>
        <td>
          <button class="btn ghost" data-action="questions" data-id="${exam.id}">Questões</button>
          <button class="btn danger" data-action="delete" data-id="${exam.id}">Excluir</button>
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="card">
        <h3>Nova Olimpíada</h3>
        <div class="form-grid">
          <div class="field">
            <label>Nome</label>
            <input type="text" id="examName" />
          </div>
          <div class="field">
            <label>Nível permitido</label>
            <select id="examLevel">
              <option>Nível 1</option>
              <option>Nível 2</option>
              <option>Nível 3</option>
            </select>
          </div>
          <div class="field">
            <label>Data de abertura</label>
            <input type="date" id="examStartDate" />
          </div>
          <div class="field">
            <label>Hora inicial</label>
            <input type="time" id="examStartTime" />
          </div>
          <div class="field">
            <label>Data de fechamento</label>
            <input type="date" id="examEndDate" />
          </div>
          <div class="field">
            <label>Hora final</label>
            <input type="time" id="examEndTime" />
          </div>
          <div class="field">
            <label>Tempo máximo (minutos)</label>
            <input type="number" id="examDuration" value="120" />
          </div>
          <button class="btn primary" id="createExamBtn">Criar olimpíada</button>
        </div>
      </div>
      <div class="card">
        <h3>Olimpíadas existentes</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Nível</th>
              <th>Abertura</th>
              <th>Fechamento</th>
              <th>Questões</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  const renderCorrections = () => {
    const data = Storage.getData();
    const attempts = data.attempts;
    const rows = attempts
      .map((attempt) => {
        const user = data.users.find((u) => u.id === attempt.userId);
        return `
        <tr>
          <td>${user?.name || 'Desconhecido'}</td>
          <td>${attempt.antiCheat?.flagged ? '<span class="badge danger">Suspeito</span>' : '<span class="badge success">Normal</span>'}</td>
          <td>${attempt.scores.final}</td>
          <td>${attempt.medal || '—'}</td>
          <td>${attempt.published ? '<span class="badge success">Publicado</span>' : '<span class="badge">Corrigido</span>'}</td>
          <td>
            <button class="btn ghost" data-action="review" data-id="${attempt.id}">Corrigir</button>
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <div class="notice">
        ⚠ Após liberar correções, os resultados ficarão visíveis para todos os participantes.
      </div>
      <button class="btn primary" id="publishCorrectionsBtn">Liberar correções</button>
      <div class="card">
        <h3>Fila de correções</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Integridade</th>
              <th>Nota final</th>
              <th>Medalha</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div id="correctionDetail"></div>
    `;
  };

  const openCorrection = (attemptId) => {
    const data = Storage.getData();
    const attempt = data.attempts.find((item) => item.id === attemptId);
    if (!attempt) return;
    const exam = data.exams.find((item) => item.id === attempt.examId);
    const user = data.users.find((item) => item.id === attempt.userId);
    const container = document.getElementById('correctionDetail');
    const discursiveItems = exam.questions.discursive
      .map((question) => {
        const items = question.items
          .map((item, idx) => {
            const key = `${question.id}-${idx}`;
            const response = attempt.answers.discursive[key];
            const images = response?.images || [];
            const gallery = images
              .map((image) => `<img src="${image.dataUrl}" alt="${image.name}" width="120" />`)
              .join('');
            return `
              <div class="card">
                <h4>${question.prompt} - ${item.label}</h4>
                <p>${response?.text || 'Sem resposta.'}</p>
                <div class="gallery">${gallery || '<p class="muted">Sem imagens.</p>'}</div>
                <label>Nota (0-20)</label>
                <input type="number" min="0" max="20" data-score-item="${key}" value="${attempt.scores.items?.[key] || 0}" />
              </div>
            `;
          })
          .join('');
        return `<div class="card"><h3>${question.prompt}</h3>${items}</div>`;
      })
      .join('');

    container.innerHTML = `
      <div class="card">
        <h3>Correção de ${user?.name}</h3>
        <p class="muted">Tempo de prova: ${attempt.startedAt ? UI.formatDateTime(attempt.startedAt) : '—'}</p>
        <div class="form-grid">
          <div class="field">
            <label>Nota objetiva</label>
            <input type="number" id="objectiveScore" value="${attempt.scores.objective}" />
          </div>
          <div class="field">
            <label>Nota discursiva</label>
            <input type="number" id="discursiveScore" value="${attempt.scores.discursive}" />
          </div>
          <div class="field">
            <label>Nota final</label>
            <input type="number" id="finalScore" value="${attempt.scores.final}" />
          </div>
          <div class="field">
            <label>Medalha</label>
            <select id="medalSelect">
              <option value="">Selecione</option>
              <option ${attempt.medal === 'Ouro' ? 'selected' : ''}>Ouro</option>
              <option ${attempt.medal === 'Prata' ? 'selected' : ''}>Prata</option>
              <option ${attempt.medal === 'Bronze' ? 'selected' : ''}>Bronze</option>
              <option ${attempt.medal === 'Honra ao Mérito' ? 'selected' : ''}>Honra ao Mérito</option>
            </select>
          </div>
          <button class="btn primary" id="saveCorrectionBtn" data-id="${attempt.id}">Salvar correção</button>
        </div>
      </div>
      ${discursiveItems}
    `;
  };

  const bindEvents = () => {
    const content = document.getElementById('adminTabContent');
    content.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const id = target.dataset.id;
      if (action === 'toggle') {
        const data = Storage.getData();
        const user = data.users.find((item) => item.id === id);
        user.active = !user.active;
        Storage.setData(data);
        render();
      }
      if (action === 'edit') {
        const data = Storage.getData();
        const user = data.users.find((item) => item.id === id);
        const nextLevel = prompt('Informe o novo nível (Nível 1, 2, 3):', user.level);
        const nextPassword = prompt('Deseja redefinir a senha? (deixe em branco para manter)', '');
        if (nextLevel) user.level = nextLevel;
        if (nextPassword) user.password = nextPassword;
        Storage.setData(data);
        render();
        UI.toast('Usuário atualizado.');
      }
      if (action === 'delete') {
        if (confirm('Deseja excluir esta olimpíada? Essa ação não pode ser desfeita.')) {
          DataAPI.removeExam(id);
          render();
        }
      }
      if (action === 'questions') {
        const data = Storage.getData();
        const exam = data.exams.find((item) => item.id === id);
        const type = prompt('Tipo da questão (objective ou discursive):', 'objective');
        const promptText = prompt('Descreva o enunciado da questão.');
        if (!promptText || !type) return;
        if (type.toLowerCase() === 'discursive') {
          const itemsTotal = Number(prompt('Quantos itens a questão discursiva terá?', '1')) || 1;
          const items = Array.from({ length: itemsTotal }, (_, idx) => ({
            label: `Item ${String.fromCharCode(65 + idx)}`,
          }));
          exam.questions.discursive.push({
            id: createId(),
            type: 'discursive',
            prompt: promptText,
            items,
          });
        } else {
          exam.questions.objective.push({
            id: createId(),
            type: 'objective',
            prompt: promptText,
            options: ['A', 'B', 'C', 'D', 'E'],
            correct: 0,
          });
        }
        DataAPI.saveExam(exam);
        render();
      }
      if (action === 'review') {
        openCorrection(id);
      }
    });

    content.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === 'createUserBtn') {
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const level = document.getElementById('userLevel').value;
        if (!name || !email || !password) {
          UI.toast('Preencha todos os campos.', 'danger');
          return;
        }
        DataAPI.saveUser({
          id: createId(),
          name,
          email,
          password,
          level,
          role: 'student',
          active: true,
          createdAt: new Date().toISOString(),
        });
        render();
        UI.toast('Usuário cadastrado.');
      }

      if (target.id === 'createExamBtn') {
        const exam = {
          id: createId(),
          name: document.getElementById('examName').value,
          level: document.getElementById('examLevel').value,
          startDate: document.getElementById('examStartDate').value,
          startTime: document.getElementById('examStartTime').value,
          endDate: document.getElementById('examEndDate').value,
          endTime: document.getElementById('examEndTime').value,
          durationMinutes: Number(document.getElementById('examDuration').value || 120),
          questions: { objective: [], discursive: [] },
        };
        if (!exam.name || !exam.startDate || !exam.endDate) {
          UI.toast('Preencha os campos obrigatórios.', 'danger');
          return;
        }
        DataAPI.saveExam(exam);
        render();
        UI.toast('Olimpíada criada.');
      }

      if (target.id === 'publishCorrectionsBtn') {
        if (!confirm('Tem certeza que deseja liberar as correções?')) return;
        const data = Storage.getData();
        data.attempts.forEach((attempt) => {
          attempt.published = true;
        });
        Storage.setData(data);
        render();
        UI.toast('Resultados publicados.');
      }

      if (target.id === 'saveCorrectionBtn') {
        const attemptId = target.dataset.id;
        const data = Storage.getData();
        const attempt = data.attempts.find((item) => item.id === attemptId);
        attempt.scores.objective = Number(document.getElementById('objectiveScore').value || 0);
        attempt.scores.discursive = Number(document.getElementById('discursiveScore').value || 0);
        attempt.scores.final = Number(document.getElementById('finalScore').value || 0);
        attempt.medal = document.getElementById('medalSelect').value;
        const itemScores = {};
        document.querySelectorAll('[data-score-item]').forEach((input) => {
          itemScores[input.dataset.scoreItem] = Number(input.value || 0);
        });
        attempt.scores.items = itemScores;
        Storage.setData(data);
        render();
        UI.toast('Correção salva.');
      }
    });
  };

  const render = () => {
    const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'users';
    const content = document.getElementById('adminTabContent');
    if (activeTab === 'users') content.innerHTML = renderUsers();
    if (activeTab === 'exams') content.innerHTML = renderExams();
    if (activeTab === 'corrections') content.innerHTML = renderCorrections();
  };

  const initTabs = () => {
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');
        render();
      });
    });
  };

  return {
    render,
    bindEvents,
    initTabs,
  };
})();
