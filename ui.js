const UI = {
  showPanel(panelId) {
    document.querySelectorAll('.panel').forEach((panel) => {
      panel.classList.add('hidden');
    });
    const target = document.getElementById(panelId);
    if (target) target.classList.remove('hidden');
  },
  toast(message, variant = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('show');
    toast.style.borderLeftColor = variant === 'danger' ? 'var(--danger)' : 'var(--accent)';
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    setTimeout(() => toast.classList.remove('show'), 2800);
  },
  formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR');
  },
  computeExamStatus(exam, attempt, now = new Date()) {
    if (!exam) return { label: 'Sem olimpíada ativa', status: 'none' };
    const start = new Date(`${exam.startDate}T${exam.startTime}`);
    const end = new Date(`${exam.endDate}T${exam.endTime}`);

    if (attempt && attempt.submittedAt) {
      if (attempt.published) {
        return { label: 'Resultado liberado', status: 'published' };
      }
      return { label: 'Em correção', status: 'submitted' };
    }

    if (attempt && attempt.startedAt) {
      return { label: 'Em andamento', status: 'in_progress' };
    }

    if (now < start) {
      return { label: 'Bloqueada', status: 'blocked', opensAt: start };
    }

    if (now >= start && now <= end) {
      return { label: 'Disponível', status: 'available' };
    }

    return { label: 'Finalizado', status: 'closed' };
  },
  medalLabel(medal) {
    const map = {
      Ouro: '🥇 Ouro',
      Prata: '🥈 Prata',
      Bronze: '🥉 Bronze',
      'Honra ao Mérito': '🎖 Honra ao Mérito',
    };
    return map[medal] || '—';
  },
};
