// Módulo de autenticação do NEXO
async function carregarPerfilUsuario() {
  const supabase = SupabaseManager.getSupabaseClient();
  if (!supabase) throw new Error('Cliente Supabase não inicializado');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão não encontrada. Faça login novamente.');
  
  SupabaseManager.setUsuarioLogado(user);

  const { data, error } = await supabase
    .from('usuarios')
    .select('usuario, restaurante, restaurante_id, auth_id')
    .eq('auth_id', user.id)
    .single();

  if (error || !data) throw new Error('Usuário sem restaurante vinculado na tabela usuarios.');

  if (!data.restaurante_id) {
    throw new Error('Usuário sem restaurante_id vinculado na tabela usuarios.');
  }

  SupabaseManager.setRestauranteId(data.restaurante_id);
  
  // Atualiza informações do cliente na UI
  if (window.UIManager) {
    UIManager.atualizarInfoCliente({
      restaurante: data.restaurante || 'Restaurante',
      usuario: data.usuario || user.email
    });
  }
}

// Processa tokens da URL (após confirmação de e-mail)
async function processarAuthCallback() {
  try {
    const supabase = SupabaseManager.getSupabaseClient();
    if (!supabase) return false;

    const { data } = await supabase.auth.getSession();
    
    // Verifica se há parâmetros de autenticação na URL
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (accessToken || refreshToken) {
      console.log('Processando callback de autenticação...');
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao processar callback:', sessionError);
        throw sessionError;
      }
      
      if (sessionData.session) {
        console.log('Sessão estabelecida com sucesso');
        window.history.replaceState({}, document.title, window.location.pathname);
        
        await carregarPerfilUsuario();
        
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) loginScreen.style.display = 'none';
        
        // Carrega dados da aplicação
        if (window.DataManager) {
          await DataManager.carregarTodosDados();
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro no processamento do callback:', error);
    return false;
  }
}

// Verifica sessão existente
async function verificarSessao() {
  if (window.UIManager) {
    UIManager.aplicarDatasPadrao();
  }
  
  // Primeiro, tenta processar callback de autenticação
  const callbackProcessado = await processarAuthCallback();
  if (callbackProcessado) {
    return;
  }
  
  // Se não houver callback, verifica sessão existente
  const supabase = SupabaseManager.getSupabaseClient();
  if (!supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    try {
      await carregarPerfilUsuario();
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) loginScreen.style.display = 'none';
      
      // Carrega dados da aplicação
      if (window.DataManager) {
        await DataManager.carregarTodosDados();
      }
    } catch (e) {
      console.error(e);
      await supabase.auth.signOut();
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) loginScreen.style.display = 'flex';
    }
  }
}

// Login do usuário
async function fazerLogin() {
  const email = document.getElementById('loginUser')?.value;
  const senha = document.getElementById('loginPass')?.value;
  const errorEl = document.getElementById('loginError');

  if (!email || !senha) {
    if (errorEl) {
      errorEl.textContent = 'Preencha e-mail e senha.';
      errorEl.style.display = 'block';
    } else {
      alert('Preencha e-mail e senha.');
    }
    return;
  }

  try {
    const supabase = SupabaseManager.getSupabaseClient();
    if (!supabase) throw new Error('Cliente Supabase não inicializado');

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    
    await carregarPerfilUsuario();
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.style.display = 'none';
    
    // Carrega dados da aplicação
    if (window.DataManager) {
      await DataManager.carregarTodosDados();
    }
  } catch (e) {
    console.error(e);
    if (errorEl) {
      errorEl.textContent = 'E-mail ou senha inválidos, ou usuário sem restaurante vinculado.';
      errorEl.style.display = 'block';
    } else {
      alert('E-mail ou senha inválidos.');
    }
  }
}

// Logout do usuário
async function sair() {
  const supabase = SupabaseManager.getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  
  SupabaseManager.setRestauranteId(null);
  SupabaseManager.setUsuarioLogado(null);
  
  // Limpa dados dos módulos
  if (window.DataManager) {
    DataManager.limparDados();
  }
  
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'flex';
}

// Exporta funções para uso global
window.AuthManager = {
  carregarPerfilUsuario,
  processarAuthCallback,
  verificarSessao,
  fazerLogin,
  sair
};
