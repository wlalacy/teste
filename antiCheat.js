const AntiCheat = (() => {
  let warnings = 0;
  let awaitingEvidence = false;
  let activeAttemptId = null;

  const warningMessages = [
    'Atenção: Trocas de aba são permitidas apenas para anexar imagens das resoluções. Outras saídas não são permitidas.',
    'Segunda ocorrência detectada. Novas trocas indevidas podem levar à desclassificação automática.',
    'Último aviso. Nova ocorrência resultará em encerramento automático da prova.',
  ];

  const registerWarning = () => {
    warnings += 1;
    const message = warningMessages[Math.min(warnings - 1, warningMessages.length - 1)];
    UI.toast(message, 'danger');
    DataAPI.logAntiCheat({
      id: createId(),
      attemptId: activeAttemptId,
      type: 'tab_switch',
      message,
      createdAt: new Date().toISOString(),
    });
    return warnings;
  };

  const handleVisibility = () => {
    if (!activeAttemptId) return;
    if (document.hidden) {
      awaitingEvidence = true;
      return;
    }
    if (awaitingEvidence) {
      setTimeout(() => {
        if (awaitingEvidence) {
          const total = registerWarning();
          if (total >= 4) {
            Exam.forceSubmit('Suspeita de Violação de Integridade Acadêmica');
          }
        }
      }, 8000);
    }
  };

  const blockShortcuts = (event) => {
    if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x', 'p'].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  };

  const start = (attemptId) => {
    warnings = 0;
    awaitingEvidence = false;
    activeAttemptId = attemptId;
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('keydown', blockShortcuts);
    document.body.style.userSelect = 'none';
  };

  const stop = () => {
    activeAttemptId = null;
    document.removeEventListener('visibilitychange', handleVisibility);
    document.removeEventListener('keydown', blockShortcuts);
    document.body.style.userSelect = 'auto';
  };

  const confirmEvidence = () => {
    awaitingEvidence = false;
  };

  const getWarnings = () => warnings;

  return {
    start,
    stop,
    confirmEvidence,
    getWarnings,
  };
})();
