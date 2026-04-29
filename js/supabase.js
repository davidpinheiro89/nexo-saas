// Configuração e cliente Supabase
let supabaseClient = null;
let restauranteId = null;
let usuarioLogado = null;

// Inicializa o cliente Supabase
function initSupabase() {
  if (!window.NEXO_CONFIG) {
    console.error('Configuração do NEXO não encontrada');
    return null;
  }

  const SUPABASE_URL = window.NEXO_CONFIG.SUPABASE_URL;
  const SUPABASE_KEY = window.NEXO_CONFIG.SUPABASE_ANON_KEY;

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: false
    }
  });

  return supabaseClient;
}

// Obtém o cliente Supabase
function getSupabaseClient() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

// Define o restaurante_id atual
function setRestauranteId(id) {
  restauranteId = id;
}

// Obtém o restaurante_id atual
function getRestauranteId() {
  return restauranteId;
}

// Define o usuário logado
function setUsuarioLogado(user) {
  usuarioLogado = user;
}

// Obtém o usuário logado
function getUsuarioLogado() {
  return usuarioLogado;
}

// Exporta as funções para uso global
window.SupabaseManager = {
  initSupabase,
  getSupabaseClient,
  setRestauranteId,
  getRestauranteId,
  setUsuarioLogado,
  getUsuarioLogado
};
