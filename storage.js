const STORAGE_KEY = "ommo-data";
const SESSION_KEY = "ommo-session";

const defaultData = () => ({
  users: [
    {
      id: "admin-1",
      name: "Administrador OMMO",
      email: "adm@ommo.org",
      password: "adm12345",
      role: "admin",
      level: "Nível 3",
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-1",
      name: "Aluno Demo",
      email: "aluno@ommo.org",
      password: "aluno123",
      role: "student",
      level: "Nível 1",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  exams: [
    {
      id: "exam-demo",
      name: "OMMO 2025 • Etapa Classificatória",
      level: "Nível 1",
      startDate: new Date().toISOString().slice(0, 10),
      startTime: "08:00",
      endDate: new Date().toISOString().slice(0, 10),
      endTime: "23:59",
      durationMinutes: 120,
      questions: {
        objective: [
          {
            id: "obj-1",
            type: "objective",
            prompt: "Qual é o valor de 2 + 2?",
            options: ["2", "3", "4", "5", "6"],
            correct: 2,
          },
        ],
        discursive: [
          {
            id: "disc-1",
            type: "discursive",
            prompt: "Explique o raciocínio para calcular 15 × 3.",
            items: [{ label: "Item A" }],
          },
        ],
      },
    },
  ],
  attempts: [],
  logs: [],
});

const createId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `ommo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

const Storage = {
  getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = defaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  },
  setData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },
};

const DataAPI = {
  findUserByEmail(email) {
    const data = Storage.getData();
    return data.users.find((user) => user.email === email);
  },
  saveUser(user) {
    const data = Storage.getData();
    const index = data.users.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      data.users[index] = user;
    } else {
      data.users.push(user);
    }
    Storage.setData(data);
  },
  removeUser(userId) {
    const data = Storage.getData();
    data.users = data.users.filter((user) => user.id !== userId);
    Storage.setData(data);
  },
  saveExam(exam) {
    const data = Storage.getData();
    const index = data.exams.findIndex((item) => item.id === exam.id);
    if (index >= 0) {
      data.exams[index] = exam;
    } else {
      data.exams.push(exam);
    }
    Storage.setData(data);
  },
  removeExam(examId) {
    const data = Storage.getData();
    data.exams = data.exams.filter((exam) => exam.id !== examId);
    data.attempts = data.attempts.filter((attempt) => attempt.examId !== examId);
    Storage.setData(data);
  },
  saveAttempt(attempt) {
    const data = Storage.getData();
    const index = data.attempts.findIndex((item) => item.id === attempt.id);
    if (index >= 0) {
      data.attempts[index] = attempt;
    } else {
      data.attempts.push(attempt);
    }
    Storage.setData(data);
  },
  logAntiCheat(entry) {
    const data = Storage.getData();
    data.logs.push(entry);
    Storage.setData(data);
  },
};
