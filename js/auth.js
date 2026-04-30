const AuthManager = (() => {

  async function verificarSessao() {
    const supabase = SupabaseManager.getSupabaseClient();

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      mostrarLogin();
      return;
    }

    await carregarUsuario(session.user);
  }

  async function fazerLogin() {
    try {

      const email = document.getElementById('loginUser').value.trim();
      const senha = document.getElementById('loginPass').value.trim();

      const supabase = SupabaseManager.getSupabaseClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) {
        alert(error.message);
        return;
      }

      await carregarUsuario(data.user);

    } catch (err) {
      console.error(err);
      alert('Erro no login');
    }
  }

  async function carregarUsuario(user) {

    const supabase = SupabaseManager.getSupabaseClient();

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.error(error);
      alert('Usuário sem restaurante vinculado');
      return;
    }

    SupabaseManager.setUsuarioLogado(user);
    SupabaseManager.setRestauranteId(data.restaurante_id);

    esconderLogin();

    await DataManager.carregarTodosDados();
  }

  async function logout() {

    const supabase = SupabaseManager.getSupabaseClient();

    await supabase.auth.signOut();

    SupabaseManager.setUsuarioLogado(null);
    SupabaseManager.setRestauranteId(null);

    DataManager.limparTodosDados();

    mostrarLogin();
  }

  function mostrarLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
  }

  function esconderLogin() {
    document.getElementById('loginScreen').style.display = 'none';
  }

  return {
    fazerLogin,
    verificarSessao,
    logout
  };

})();

window.AuthManager = AuthManager;