// Módulo de Autenticação do NEXO

// Faz login do usuário
async function fazerLogin() {
  const userEl = document.getElementById('loginUser');
  const passEl = document.getElementById('loginPass');
  const errorEl = document.getElementById('loginError');
  const email = (userEl ? userEl.value : '').trim();
  const senha = (passEl ? passEl.value : '').trim();
  
  if(errorEl) errorEl.style.display = 'none';
  
  if(!email || !senha){
    if(errorEl){errorEl.textContent = 'Informe e-mail e senha.'; errorEl.style.display = 'block';}
    else alert('Informe e-mail e senha.');
    return;
  }
  
  try{
    const supabase = SupabaseManager.getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({email, password: senha});
    
    if(error) throw error;
    
    await carregarPerfilUsuario();
    const loginScreen = document.getElementById('loginScreen');
    if(loginScreen) loginScreen.style.display = 'none';
    
    await DataManager.carregarTodosDados();
  } catch(e){
    console.error(e);
    if(errorEl){errorEl.textContent = 'E-mail ou senha inválidos, ou usuário sem restaurante vinculado.'; errorEl.style.display = 'block';}
    else alert('E-mail ou senha inválidos.');
  }
}

// Carrega perfil do usuário logado
async function carregarPerfilUsuario() {
  const supabase = SupabaseManager.getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Sessão não encontrada');
  }
  
  SupabaseManager.setUsuarioLogado(session.user);
  
  // Busca dados do usuário na tabela usuarios
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('*, restaurantes(*)')
    .eq('auth_id', session.user.id)
    .single();
    
  if (userError) {
    console.error('Erro ao buscar perfil:', userError);
    throw userError;
  }
  
if (userData) {
  // Define restaurante_id para clientes
  if (userData.restaurante_id) {
    SupabaseManager.setRestauranteId(userData.restaurante_id);
  }

  // Atualiza nome no header
  const nomeEl = document.getElementById('nomeRestauranteTopo');
    if (nomeEl) {
      if (userData.tipo === 'admin_master') {
        nomeEl.textContent = 'Painel Admin Master';
      } else if (userData.restaurantes) {
        nomeEl.textContent = userData.restaurantes.nome || 'Restaurante Cliente';
      }
    }
  }
}

// Processa callback de autenticação} (após confirmação de e-mail)
async function processarAuthCallback() {
  try {
    const supabase = SupabaseManager.getSupabaseClient();
    
    // Verifica se há parâmetros de autenticação na URL
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (accessToken || refreshToken) {
      console.log('Processando callback de autenticação...');
      
      // Deixa o Supabase processar o callback
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao processar callback:', sessionError);
        throw sessionError;
      }
      
      if (sessionData.session) {
        console.log('Sessão estabelecida com sucesso');
        // Limpa a URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Carrega o perfil do usuário
        await carregarPerfilUsuario();
        const loginScreen = document.getElementById('loginScreen');
        if(loginScreen) loginScreen.style.display = 'none';
        await DataManager.carregarTodosDados();
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
async function verificarSessao(){
  // Primeiro, tenta processar callback de autenticação
  const callbackProcessado = await processarAuthCallback();
  if (callbackProcessado) {
    return;
  }
  
  // Se não houver callback, verifica sessão existente
  const supabase = SupabaseManager.getSupabaseClient();
  const { data:{ session } } = await supabase.auth.getSession();
  
  if(session){
    try{
      await carregarPerfilUsuario();
      const loginScreen = document.getElementById('loginScreen');
      if(loginScreen) loginScreen.style.display = 'none';
      await DataManager.carregarTodosDados();
    }catch(e){
      console.error(e);
      await supabase.auth.signOut();
      const loginScreen = document.getElementById('loginScreen');
      if(loginScreen) loginScreen.style.display = 'flex';
    }
  }else{
    UIManager.aplicarDatasPadrao();
  }
}

// Faz logout
async function sair(){
  const supabase = SupabaseManager.getSupabaseClient();
  await supabase.auth.signOut();
  SupabaseManager.limparEstado();
  DataManager.limparTodosDados();
  
  const loginScreen = document.getElementById('loginScreen');
  if(loginScreen) loginScreen.style.display = 'flex';
  
  // Limpa formulários
  const userEl = document.getElementById('loginUser');
  const passEl = document.getElementById('loginPass');
  if(userEl) userEl.value = '';
  if(passEl) passEl.value = '';
}

// Exporta funções para uso global
window.AuthManager = {
  fazerLogin,
  carregarPerfilUsuario,
  processarAuthCallback,
  verificarSessao,
  sair
};
