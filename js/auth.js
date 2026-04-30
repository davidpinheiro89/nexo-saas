const AuthManager = (() => {
  async function verificarSessao() {
    const supabase = SupabaseManager.getSupabaseClient();

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      mostrarLogin();
      return;
    }

    await carregarUsuario(data.session.user);
  }

  async function fazerLogin() {
    try {
      const email = document.getElementById('loginUser')?.value?.trim();
      const senha = document.getElementById('loginPass')?.value?.trim();

      if (!email || !senha) {
        alert('Informe e-mail e senha.');
        return;
      }

      const supabase = SupabaseManager.getSupabaseClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) {
        console.error('Erro login:', error);
        alert('E-mail ou senha inválidos.');
        return;
      }

      await carregarUsuario(data.user);

    } catch (err) {
      console.error('Erro inesperado no login:', err);
      alert('Erro ao fazer login.');
    }
  }

  async function carregarUsuario(user) {
    const supabase = SupabaseManager.getSupabaseClient();

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      alert('Erro ao carregar usuário.');
      mostrarLogin();
      return;
    }

    if (!data) {
      alert('Usuário sem restaurante vinculado.');
      mostrarLogin();
      return;
    }

    const restauranteId =
      data.restaurante_i ||
      data.restaurante_id ||
      data.restaurante;

    if (!restauranteId) {
      alert('Usuário sem restaurante_id configurado.');
      mostrarLogin();
      return;
    }

    SupabaseManager.setUsuarioLogado(user);
    SupabaseManager.setRestauranteId(restauranteId);

    if (window.UIManager?.atualizarInfoCliente) {
      UIManager.atualizarInfoCliente({
        restaurante: data.restaurante || 'Restaurante',
        usuario: data.usuario || data.nome || user.email
      });
    }

    esconderLogin();

    if (window.DataManager?.carregarTodosDados) {
      await DataManager.carregarTodosDados();
    }
  }

  async function logout() {
    try {
      const supabase = SupabaseManager.getSupabaseClient();

      await supabase.auth.signOut();

      SupabaseManager.setUsuarioLogado(null);
      SupabaseManager.setRestauranteId(null);

      if (window.DataManager?.limparTodosDados) {
        DataManager.limparTodosDados();
      }

      mostrarLogin();

    } catch (err) {
      console.error('Erro no logout:', err);
      alert('Erro ao sair.');
    }
  }

  function mostrarLogin() {
    const login = document.getElementById('loginScreen');
    if (login) login.style.display = 'flex';
  }

  function esconderLogin() {
    const login = document.getElementById('loginScreen');
    if (login) login.style.display = 'none';
  }

  document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.onclick = logout;
    }
  });

  return {
    fazerLogin,
    verificarSessao,
    logout
  };
})();

window.AuthManager = AuthManager;

// Compatibilidade com HTML antigo
window.fazerLogin = AuthManager.fazerLogin;
window.logout = AuthManager.logout;