// Módulo de gerenciamento de dados do NEXO
async function carregarTodosDados() {
  try {
    // Carrega todos os módulos em paralelo
    await Promise.all([
      window.PratosManager?.carregarPratos(),
      window.VendasManager?.carregarVendas(),
      window.InventarioManager?.carregarInventario()
    ]);
    
    // Atualiza selects e renderiza dados
    if (window.VendasManager) {
      window.VendasManager.atualizarSelectPratos();
    }
    
    renderAll();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    throw error;
  }
}

// Limpa todos os dados dos módulos
function limparTodosDados() {
  if (window.PratosManager) window.PratosManager.limparDados();
  if (window.VendasManager) window.VendasManager.limparDados();
  if (window.InventarioManager) window.InventarioManager.limparDados();
}

// Renderiza todos os dados da aplicação
function renderAll() {
  if (window.DashboardManager) {
    window.DashboardManager.renderizarDashboard();
  }
  if (window.PratosManager) {
    window.PratosManager.renderizarPratos();
  }
  if (window.VendasManager) {
    window.VendasManager.renderizarVendas();
  }
  if (window.InventarioManager) {
    window.InventarioManager.renderizarInventario();
  }
}

// Exporta funções para uso global
window.DataManager = {
  carregarTodosDados,
  limparTodosDados,
  renderAll
};
