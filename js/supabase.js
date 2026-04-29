// Módulo de gerenciamento do Supabase do NEXO
let supabaseClient = null;
let restauranteId = null;
let usuarioLogado = null;

// Inicializa o cliente Supabase
function initSupabase() {
  if (!window.NEXO_CONFIG) {
    console.error('Configuração NEXO não encontrada');
    return;
  }

  supabaseClient = window.supabase.createClient(
    window.NEXO_CONFIG.SUPABASE_URL,
    window.NEXO_CONFIG.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  console.log('Cliente Supabase inicializado');
}

// Obtém o cliente Supabase
function getSupabaseClient() {
  return supabaseClient;
}

// Define o ID do restaurante
function setRestauranteId(id) {
  restauranteId = id;
  console.log('Restaurante ID definido:', id);
}

// Obtém o ID do restaurante
function getRestauranteId() {
  return restauranteId;
}

// Define o usuário logado
function setUsuarioLogado(usuario) {
  usuarioLogado = usuario;
  console.log('Usuário logado definido:', usuario);
}

// Obtém o usuário logado
function getUsuarioLogado() {
  return usuarioLogado;
}

// Limpa estado
function limparEstado() {
  restauranteId = null;
  usuarioLogado = null;
}

// Exporta funções para uso global
window.SupabaseManager = {
  initSupabase,
  getSupabaseClient,
  setRestauranteId,
  getRestauranteId,
  setUsuarioLogado,
  getUsuarioLogado,
  limparEstado
};
