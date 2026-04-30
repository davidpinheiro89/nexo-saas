const AuthManager = (() => {
  async function verificarSessao() {
    const supabase = SupabaseManager.getSupabaseClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      mostrarLogin();
      return;
    }

    await carregarUsuario(data.session.user);
  }

  async function fazerLogin() {
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
      console.error(error);
      alert('E-mail ou senha inválidos.');
      return;
    }

    await carregarUsuario(data.user);
  }

  async function carregarUsuario(user) {
    const supabase = SupabaseManager.getSupabaseClient();

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (error || !data) {
      console.error(error);
      alert('Usuário sem restaurante vinculado.');
      mostrarLogin();
      return;
    }

    const restauranteId = data.restaurante_i || data.restaurante_id;

    if (!restauranteId) {
      alert('Restaurante não configurado para este usuário.');
      mostrarLogin();
      return;
    }

    SupabaseManager.setUsuarioLogado(user);
    SupabaseManager.setRestauranteId(restauranteId);

    if (window.UIManager?.atualizarInfoCliente) {
      UIManager.atualizarInfoCliente({
        restaurante: data.restaurante || 'Restaurante Cliente',
        usuario: data.usuario || data.nome || user.email
      });
    }

    esconderLogin();

    if (window.DataManager?.carregarTodosDados) {
      await DataManager.carregarTodosDados();
    }
  }

  async function logout() {
    const supabase = SupabaseManager.getSupabaseClient();

    await supabase.auth.signOut();

    SupabaseManager.setUsuarioLogado(null);
    SupabaseManager.setRestauranteId(null);

    if (window.DataManager?.limparTodosDados) {
      DataManager.limparTodosDados();
    }

    mostrarLogin();
  }

  function mostrarLogin() {
    const el = document.getElementById('loginScreen');
    if (el) el.style.display = 'flex';
  }

  function esconderLogin() {
    const el = document.getElementById('loginScreen');
    if (el) el.style.display = 'none';
  }

  document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.onclick = logout;
  });

  return {
    verificarSessao,
    fazerLogin,
    logout
  };
})();

window.AuthManager = AuthManager;
window.fazerLogin = AuthManager.fazerLogin;
window.logout = AuthManager.logout;
window.sair = AuthManager.logout;