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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar vendas:', error);
    throw error;
  }

  vendas = data || [];
}

// Salva venda (novo ou edição)
async function salvarVenda() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  
  if (!supabase || !restauranteId) {
    alert('Faça login novamente. Restaurante não identificado.');
    return;
  }

  const prato = document.getElementById('vendaPrato')?.value;
  const quantidade = UIManager.NUM(document.getElementById('vendaQuantidade')?.value);
  const modo = document.getElementById('vendaModo')?.value;
  const dataInicio = document.getElementById('vendaDataInicio')?.value;
  const dataFim = document.getElementById('vendaDataFim')?.value;
  
  if (!prato || !quantidade || !modo || !dataInicio) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  // Busca dados do prato para calcular receita
  const pratos = window.PratosManager ? window.PratosManager.getPratos() : [];
  const dadosPrato = pratos.find(p => (p.nome || p.nome_prato) === prato);
  
  if (!dadosPrato) {
    alert('Prato não encontrado. Verifique o cadastro.');
    return;
  }

  const receita = dadosPrato.preco * quantidade;
  
  const venda = {
    restaurante_id: restauranteId,
    prato,
    quantidade,
    modo,
    data_inicio: dataInicio,
    data_fim: modo === 'consolidado' && dataFim ? dataFim : dataInicio,
    data: dataInicio,
    receita
  };

  const atual = editVenda !== null ? vendas[editVenda] : null;
  const res = atual && atual.id 
    ? await supabase.from('vendas').update(venda).eq('id', atual.id)
    : await supabase.from('vendas').insert(venda);

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
  
  document.getElementById('vendaPrato').value = v.prato || '';
  document.getElementById('vendaQuantidade').value = v.quantidade || '';
  document.getElementById('vendaModo').value = v.modo || '';
  document.getElementById('vendaDataInicio').value = v.data_inicio || v.data || '';
  document.getElementById('vendaDataFim').value = v.data_fim || v.data_inicio || '';
  
  document.getElementById('btnSalvarVenda').textContent = 'Atualizar';
  document.getElementById('btnCancelarVenda').style.display = 'inline-block';
}

// Cancela edição de venda
function cancelarEdicaoVenda() {
  editVenda = null;
  document.getElementById('vendaPrato').value = '';
  document.getElementById('vendaQuantidade').value = '';
  document.getElementById('vendaModo').value = '';
  document.getElementById('vendaDataInicio').value = '';
  document.getElementById('vendaDataFim').value = '';
  
  document.getElementById('btnSalvarVenda').textContent = 'Adicionar';
  document.getElementById('btnCancelarVenda').style.display = 'none';
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

// Renderiza tabela de vendas
function renderizarVendas() {
  const tbody = document.getElementById('vendasTableBody');
  if (!tbody) return;

  tbody.innerHTML = vendas.map((v, i) => {
    const data = v.data_inicio || v.data || '';
    const periodo = v.modo === 'consolidado' && v.data_fim && v.data_fim !== v.data_inicio 
      ? `${v.data_inicio} a ${v.data_fim}` 
      : data;
    
    return `
      <tr>
        <td>${periodo}</td>
        <td>${v.prato}</td>
        <td>${v.modo}</td>
        <td>${v.quantidade}</td>
        <td>${UIManager.BRL(v.receita || 0)}</td>
        <td>
          <div class="actions">
            <button class="btn-edit" onclick="VendasManager.editarVenda(${i})">Editar</button>
            <button class="btn-red" onclick="VendasManager.excluirVenda(${i})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Atualiza select de pratos no formulário de vendas
function atualizarSelectPratos() {
  const select = document.getElementById('vendaPrato');
  if (!select) return;

  const pratos = window.PratosManager ? window.PratosManager.getPratos() : [];
  select.innerHTML = '<option value="">Selecione um prato</option>' + 
    pratos.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
}

// Atualiza preview de receita
function atualizarPreviewReceita() {
  const prato = document.getElementById('vendaPrato')?.value;
  const quantidade = UIManager.NUM(document.getElementById('vendaQuantidade')?.value);
  
  const previewEl = document.getElementById('vendaReceitaPreview');
  if (!previewEl) return;
  
  if (!prato || !quantidade) {
    previewEl.value = UIManager.BRL(0);
    return;
  }
  
  const pratos = window.PratosManager ? window.PratosManager.getPratos() : [];
  const dadosPrato = pratos.find(p => (p.nome || p.nome_prato) === prato);
  
  if (dadosPrato) {
    const receita = dadosPrato.preco * quantidade;
    previewEl.value = UIManager.BRL(receita);
  } else {
    previewEl.value = UIManager.BRL(0);
  }
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
  renderizarVendas,
  atualizarSelectPratos,
  atualizarPreviewReceita,
  limparDados
};
