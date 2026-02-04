const Exam = (() => {
  let currentAttempt = null;
  let timerInterval = null;

  const buildObjective = (question, index) => {
    const answers = question.options
      .map(
        (option, idx) => `
        <label class="option">
          <input type="radio" name="objective-${question.id}" value="${idx}" />
          <span>${option}</span>
        </label>`
      )
      .join('');
    return `
      <div class="question-card" data-question-id="${question.id}">
        <header>
          <h3>Questão ${index + 1} (Objetiva)</h3>
          <span class="status" data-status>Não respondida</span>
        </header>
        <p>${question.prompt}</p>
        <div class="options">${answers}</div>
      </div>
    `;
  };

  const buildDiscursive = (question, index) => {
    const items = question.items
      .map(
        (item, idx) => `
        <div class="discursive-item">
          <label>${item.label}</label>
          <textarea rows="4" data-discursive-text="${question.id}-${idx}" placeholder="Digite sua resposta..."></textarea>
          <input type="file" multiple accept="image/*" data-discursive-image="${question.id}-${idx}" />
          <p class="muted">Envie entre 1 e 3 imagens.</p>
        </div>
      `
      )
      .join('');
    return `
      <div class="question-card" data-question-id="${question.id}">
        <header>
          <h3>Questão ${index + 1} (Discursiva)</h3>
          <span class="status" data-status>Não respondida</span>
        </header>
        <p>${question.prompt}</p>
        ${items}
      </div>
    `;
  };

  const render = (exam, attempt) => {
    const examPanel = document.getElementById('examPanel');
    document.getElementById('examTitle').textContent = exam.name;
    document.getElementById('examSubtitle').textContent = `${exam.level} • Duração ${exam.durationMinutes} min`;
    const questions = [...exam.questions.objective, ...exam.questions.discursive];
    const html = questions
      .map((question, index) => {
        if (question.type === 'objective') return buildObjective(question, index);
        return buildDiscursive(question, index);
      })
      .join('');
    document.getElementById('examQuestions').innerHTML = html;
    examPanel.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', handleAnswerChange);
      const saved = attempt.answers.objective[radio.name];
      if (saved && saved === radio.value) {
        radio.checked = true;
      }
    });
    examPanel.querySelectorAll('textarea').forEach((textarea) => {
      textarea.addEventListener('input', handleAnswerChange);
      const key = textarea.dataset.discursiveText;
      textarea.value = attempt.answers.discursive[key]?.text || '';
    });
    examPanel.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener('change', handleImageUpload);
    });
    updateProgress();
  };

  const handleAnswerChange = () => {
    if (!currentAttempt) return;
    const examPanel = document.getElementById('examPanel');
    examPanel.querySelectorAll('input[type="radio"]:checked').forEach((radio) => {
      currentAttempt.answers.objective[radio.name] = radio.value;
    });
    examPanel.querySelectorAll('textarea').forEach((textarea) => {
      const key = textarea.dataset.discursiveText;
      if (!currentAttempt.answers.discursive[key]) {
        currentAttempt.answers.discursive[key] = { text: '', images: [] };
      }
      currentAttempt.answers.discursive[key].text = textarea.value;
    });
    currentAttempt.updatedAt = new Date().toISOString();
    DataAPI.saveAttempt(currentAttempt);
    updateProgress();
    UI.toast('Respostas salvas automaticamente.');
  };

  const handleImageUpload = async (event) => {
    if (!currentAttempt) return;
    const input = event.target;
    const key = input.dataset.discursiveImage;
    const files = Array.from(input.files || []).slice(0, 3);
    if (!currentAttempt.answers.discursive[key]) {
      currentAttempt.answers.discursive[key] = { text: '', images: [] };
    }
    const images = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
            reader.readAsDataURL(file);
          })
      )
    );
    currentAttempt.answers.discursive[key].images = images;
    AntiCheat.confirmEvidence();
    handleAnswerChange();
  };

  const updateProgress = () => {
    const questionCards = document.querySelectorAll('.question-card');
    let answered = 0;
    questionCards.forEach((card) => {
      const status = card.querySelector('[data-status]');
      const questionId = card.dataset.questionId;
      let isAnswered = false;
      const objectiveKey = `objective-${questionId}`;
      if (currentAttempt.answers.objective[objectiveKey]) {
        isAnswered = true;
      }
      const discKeys = Object.keys(currentAttempt.answers.discursive).filter((key) => key.startsWith(questionId));
      if (discKeys.length) {
        const disc = currentAttempt.answers.discursive[discKeys[0]];
        isAnswered = Boolean(disc?.text || (disc?.images || []).length);
      }
      if (isAnswered) {
        answered += 1;
        status.classList.add('answered');
        status.textContent = 'Respondida';
      } else {
        status.classList.remove('answered');
        status.textContent = 'Não respondida';
      }
    });
    const progress = answered / Math.max(questionCards.length, 1);
    document.getElementById('examProgress').style.width = `${progress * 100}%`;
  };

  const startTimer = (exam) => {
    const startTime = new Date(currentAttempt.startedAt);
    const durationMs = exam.durationMinutes * 60 * 1000;
    const timerEl = document.getElementById('examTimer');

    const tick = () => {
      const elapsed = Date.now() - startTime.getTime();
      const remaining = Math.max(durationMs - elapsed, 0);
      const hours = String(Math.floor(remaining / 3600000)).padStart(2, '0');
      const minutes = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
      const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
      timerEl.textContent = `${hours}:${minutes}:${seconds}`;
      if (remaining <= 0) {
        finalize('Tempo esgotado');
      }
    };

    if (timerInterval) clearInterval(timerInterval);
    tick();
    timerInterval = setInterval(tick, 1000);
  };

  const finalize = (statusNote) => {
    if (!currentAttempt || currentAttempt.submittedAt) return;
    currentAttempt.submittedAt = new Date().toISOString();
    currentAttempt.status = statusNote || 'Enviado';
    currentAttempt.antiCheat = {
      warnings: AntiCheat.getWarnings(),
      flagged: statusNote?.includes('Suspeita') || false,
      reason: statusNote,
    };
    DataAPI.saveAttempt(currentAttempt);
    AntiCheat.stop();
    UI.toast('Prova enviada com sucesso.');
    setTimeout(() => {
      UI.showPanel('studentDashboard');
      Main.renderStudentDashboard();
    }, 1200);
  };

  const forceSubmit = (reason) => {
    if (reason === 'Enviado') {
      const missing = validateDiscursiveImages();
      if (missing.length) {
        UI.toast('Envie pelo menos 1 imagem para cada item discursivo.', 'danger');
        return;
      }
    }
    finalize(reason);
  };

  const validateDiscursiveImages = () => {
    const examPanel = document.getElementById('examPanel');
    const inputs = examPanel.querySelectorAll('input[type=\"file\"][data-discursive-image]');
    const missing = [];
    inputs.forEach((input) => {
      const key = input.dataset.discursiveImage;
      const disc = currentAttempt.answers.discursive[key];
      if (!disc?.images?.length) {
        missing.push(key);
      }
    });
    return missing;
  };

  const createAttempt = (exam, userId) => ({
    id: createId(),
    examId: exam.id,
    userId,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: null,
    status: 'Em andamento',
    answers: { objective: {}, discursive: {} },
    scores: { objective: 0, discursive: 0, final: 0 },
    medal: null,
    published: false,
  });

  const start = (exam, user) => {
    const data = Storage.getData();
    let attempt = data.attempts.find((item) => item.examId === exam.id && item.userId === user.id);
    if (!attempt) {
      attempt = createAttempt(exam, user.id);
      DataAPI.saveAttempt(attempt);
    }
    currentAttempt = attempt;
    render(exam, currentAttempt);
    startTimer(exam);
    AntiCheat.start(attempt.id);
    UI.showPanel('examPanel');
  };

  return {
    start,
    forceSubmit,
  };
})();
