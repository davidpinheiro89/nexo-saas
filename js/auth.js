let vendas = [];
let editVenda = null;

function getVendas() {
  return vendas;
}

function numero(v) {
  return parseFloat(String(v || '').replace(',', '.')) || 0;
}

function nomePrato(p) {
  return p.nome_prato || p.nome || '';
}

function precoPrato(p) {
  return Number(p.preco_venda ?? p.preco ?? 0);
}

async function carregarVendas() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) return;

  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  vendas = data || [];
  renderizarVendas();
}

function atualizarSelectPratos() {
  const select = document.getElementById('vendaPrato');
  if (!select) return;

  const pratos = window.PratosManager?.getPratos ? window.PratosManager.getPratos() : [];

  const pratosValidos = pratos.filter(p => nomePrato(p));

  select.innerHTML =
    '<option value="">Selecione um prato</option>' +
    pratosValidos.map(p => `<option value="${nomePrato(p)}">${nomePrato(p)}</option>`).join('');
}

async function salvarVenda() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) {
    alert('Faça login novamente.');
    return;
  }

  const pratoNome = vendaPrato.value;
  const quantidade = numero(vendaQuantidade.value);
  const modo = vendaModo.value;
  const dataInicio = vendaDataInicio.value;
  const dataFim = vendaDataFim.value || dataInicio;

  const pratos = window.PratosManager?.getPratos ? window.PratosManager.getPratos() : [];
  const prato = pratos.find(p => nomePrato(p) === pratoNome);

  if (!prato) {
    alert('Selecione um prato válido.');
    return;
  }

  const receita = precoPrato(prato) * quantidade;

  const payload = {
    restaurante_id: restauranteId,
    prato: pratoNome,
    quantidade,
    modo,
    data_inicio: dataInicio,
    data_fim: modo === 'consolidado' ? dataFim : dataInicio,
    data: dataInicio,
    receita
  };

  const res = editVenda !== null && vendas[editVenda]?.id
    ? await supabase.from('vendas').update(payload).eq('id', vendas[editVenda].id)
    : await supabase.from('vendas').insert(payload);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar venda.');
    return;
  }

  cancelarEdicaoVenda();
  await carregarVendas();

  if (window.DashboardManager?.renderizarDashboard) {
    window.DashboardManager.renderizarDashboard();
  }
}

function renderizarVendas() {
  const tbody = document.getElementById('vendasTableBody');
  if (!tbody) return;

  tbody.innerHTML = vendas.map((v, i) => `
    <tr>
      <td>${v.data_inicio || v.data || ''}</td>
      <td>${v.prato || ''}</td>
      <td>${v.modo || ''}</td>
      <td>${v.quantidade || 0}</td>
      <td>${UIManager.BRL(v.receita || 0)}</td>
      <td>
        <button class="btn-edit" onclick="VendasManager.editarVenda(${i})">Editar</button>
        <button class="btn-red" onclick="VendasManager.excluirVenda(${i})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function editarVenda(index) {
  editVenda = index;
  const v = vendas[index];

  vendaPrato.value = v.prato || '';
  vendaQuantidade.value = v.quantidade || '';
  vendaModo.value = v.modo || '';
  vendaDataInicio.value = v.data_inicio || v.data || '';
  vendaDataFim.value = v.data_fim || v.data_inicio || '';

  const btn = document.getElementById('btnSalvarVenda');
  if (btn) btn.textContent = 'Atualizar venda';
}

function cancelarEdicaoVenda() {
  editVenda = null;
  vendaPrato.value = '';
  vendaQuantidade.value = '';
  vendaModo.value = 'diario';

  const btn = document.getElementById('btnSalvarVenda');
  if (btn) btn.textContent = 'Salvar venda';
}

async function excluirVenda(index) {
  if (!confirm('Excluir venda?')) return;

  const supabase = SupabaseManager.getSupabaseClient();
  const v = vendas[index];

  if (!v?.id) return;

  const { error } = await supabase.from('vendas').delete().eq('id', v.id);

  if (error) {
    console.error(error);
    alert('Erro ao excluir venda.');
    return;
  }

  await carregarVendas();
}

function limparDados() {
  vendas = [];
  editVenda = null;
  renderizarVendas();
}

window.VendasManager = {
  getVendas,
  carregarVendas,
  salvarVenda,
  renderizarVendas,
  editarVenda,
  cancelarEdicaoVenda,
  excluirVenda,
  atualizarSelectPratos,
  limparDados
};