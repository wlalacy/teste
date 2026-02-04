const Auth = {
  login(email, password) {
    const user = DataAPI.findUserByEmail(email);
    if (!user || !user.active) {
      return { success: false, message: "Usuário não encontrado ou inativo." };
    }
    if (user.password !== password) {
      return { success: false, message: "Senha incorreta." };
    }
    Storage.setSession({ userId: user.id, role: user.role });
    return { success: true, user };
  },
  logout() {
    Storage.clearSession();
  },
  currentUser() {
    const session = Storage.getSession();
    if (!session) return null;
    const data = Storage.getData();
    return data.users.find((user) => user.id === session.userId) || null;
  },
  requireRole(role) {
    const session = Storage.getSession();
    return session && session.role === role;
  },
  updatePassword(userId, nextPassword) {
    const data = Storage.getData();
    const user = data.users.find((item) => item.id === userId);
    if (user) {
      user.password = nextPassword;
      Storage.setData(data);
      return true;
    }
    return false;
  },
};
