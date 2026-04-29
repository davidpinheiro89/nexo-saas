// Módulo de CRUD de Vendas do NEXO
let vendas = [];
let editVenda = null;

// Obtém vendas carregadas
function getVendas() {
  return vendas;
}

// Carrega vendas do Supabase
async function carregarVendas() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  
  if (!supabase || !restauranteId) {
    console.error('Cliente Supabase ou restauranteId não disponível');
    return;
  }

  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar vendas:', error);
    throw error;
  }

  vendas = data || [];
}

// Salva venda (nova ou edição)
async function salvarVenda() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  
  if (!supabase || !restauranteId) {
    alert('Faça login novamente. Restaurante não identificado.');
    return;
  }

  const modo = vendaModo.value;
  const dataInicio = vendaDataInicio.value;
  const dataFim = modo === 'consolidado' ? vendaDataFim.value : vendaDataInicio.value;
  
  if (!dataInicio || !dataFim) {
    alert('Informe a data inicial e final.');
    return;
  }
  
  if (dataFim < dataInicio) {
    alert('A data final não pode ser menor que a data inicial.');
    return;
  }

  // Obtém prato selecionado
  const pratoSelect = document.getElementById('vendaPrato');
  const pratoOption = pratoSelect.options[pratoSelect.selectedIndex];
  const p = {
    nome: pratoOption.text,
    preco: UIManager.NUM(pratoOption.dataset.preco) || 0
  };
  
  const q = UIManager.NUM(vendaQuantidade.value);
  if (!q || q <= 0) {
    alert('Informe uma quantidade válida.');
    return;
  }

  const v = {
    restaurante_id: restauranteId,
    modo,
    data_inicio: dataInicio,
    data_fim: dataFim,
    data: dataInicio,
    prato: p.nome,
    quantidade: q,
    receita: q * p.preco
  };

  const atual = editVenda !== null ? vendas[editVenda] : null;
  const res = atual && atual.id 
    ? await supabase.from('vendas').update(v).eq('id', atual.id)
    : await supabase.from('vendas').insert(v);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar venda: ' + res.error.message);
    return;
  }

  cancelarEdicaoVenda();
  await carregarVendas();
  renderizarVendas();
}

// Edita venda
function editarVenda(index) {
  editVenda = index;
  const v = vendas[index];
  
  vendaModo.value = v.modo || 'diario';
  vendaDataInicio.value = v.data_inicio || '';
  vendaDataFim.value = v.data_fim || '';
  vendaQuantidade.value = v.quantidade || '';
  
  // Seleciona o prato
  const pratoSelect = document.getElementById('vendaPrato');
  for (let i = 0; i < pratoSelect.options.length; i++) {
    if (pratoSelect.options[i].text === v.prato) {
      pratoSelect.selectedIndex = i;
      break;
    }
  }
  
  const btnSalvarVenda = document.getElementById('btnSalvarVenda'); if (btnSalvarVenda) btnSalvarVenda.textContent = 'Atualizar';
  const btnCancelarVenda = document.getElementById('btnCancelarVenda'); if (btnCancelarVenda) btnCancelarVenda.style.display = 'inline-block';
}

// Cancela edição de venda
function cancelarEdicaoVenda() {
  editVenda = null;
  vendaModo.value = 'diario';
  vendaDataInicio.value = '';
  vendaDataFim.value = '';
  vendaQuantidade.value = '';
  
  const pratoSelect = document.getElementById('vendaPrato');
  if (pratoSelect.options.length > 0) {
    pratoSelect.selectedIndex = 0;
  }
  
  const btnSalvarVenda = document.getElementById('btnSalvarVenda'); if (btnSalvarVenda) btnSalvarVenda.textContent = 'Salvar venda';
  const btnCancelarVenda = document.getElementById('btnCancelarVenda'); if (btnCancelarVenda) btnCancelarVenda.style.display = 'none';
}

// Exclui venda
async function excluirVenda(index) {
  if (!confirm('Excluir esta venda?')) return;
  
  const supabase = SupabaseManager.getSupabaseClient();
  const v = vendas[index];
  
  if (v && v.id) {
    const { error } = await supabase.from('vendas').delete().eq('id', v.id);
    if (error) {
      console.error(error);
      alert('Erro ao excluir venda: ' + error.message);
      return;
    }
  }
  
  await carregarVendas();
  renderizarVendas();
}

// Atualiza select de pratos
function atualizarSelectPratos() {
  const pratoSelect = document.getElementById('vendaPrato');
  if (!pratoSelect) return;
  
  const pratos = window.PratosManager ? window.PratosManager.getPratos() : [];
  
  pratoSelect.innerHTML = '<option value="">Selecione um prato</option>' +
    pratos.map(p => `<option value="${p.id}" data-preco="${p.preco}">${p.nome}</option>`).join('');
}

// Renderiza tabela de vendas
function renderizarVendas() {
  const tbody = document.getElementById('vendasTableBody');
  if (!tbody) return;

  tbody.innerHTML = vendas.map((v, i) => `
    <tr>
      <td>${v.data || ''}</td>
      <td>${v.prato || ''}</td>
      <td>${v.modo || ''}</td>
      <td>${v.quantidade || ''}</td>
      <td>${UIManager.BRL(v.receita)}</td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="VendasManager.editarVenda(${i})">Editar</button>
          <button class="btn-red" onclick="VendasManager.excluirVenda(${i})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Limpa dados do módulo
function limparDados() {
  vendas = [];
  editVenda = null;
}

// Exporta funções para uso global
window.VendasManager = {
  getVendas,
  carregarVendas,
  salvarVenda,
  editarVenda,
  cancelarEdicaoVenda,
  excluirVenda,
  atualizarSelectPratos,
  renderizarVendas,
  limparDados
};
