// Módulo de CRUD de Pratos do NEXO
let pratos = [];
let editPrato = null;

function getPratos() {
  return pratos;
}

async function carregarPratos() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) {
    console.error('Cliente Supabase ou restauranteId não disponível');
    return;
  }

  const { data, error } = await supabase
    .from('pratos')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar pratos:', error);
    return;
  }

  pratos = data || [];
}

async function salvarPrato() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) {
    alert('Faça login novamente.');
    return;
  }

  const p = {
    restaurante_id: restauranteId,
    nome_prato: pratoNome.value,
    grupo: pratoGrupo.value,
    item_proteina: pratoItem.value,
    kg_por_prato: parseFloat(pratoKg.value) || 0,
    preco_venda: parseFloat(pratoPreco.value) || 0,
    custo_prato: parseFloat(pratoCusto.value) || 0
  };

  const res = await supabase.from('pratos').insert(p);

  if (res.error) {
    console.error(res.error);
    alert(res.error.message);
    return;
  }

  pratoNome.value = '';
  pratoItem.value = '';
  pratoKg.value = '';
  pratoPreco.value = '';
  pratoCusto.value = '';

  await carregarPratos();
  renderizarPratos();
}

function renderizarPratos() {
  const tbody = document.getElementById('pratosTableBody');

  if (!tbody) return;

  tbody.innerHTML = pratos.map((p) => `
    <tr>
      <td>${p.nome_prato || ''}</td>
      <td>${p.grupo || ''}</td>
      <td>${p.item_proteina || ''}</td>
      <td>${p.kg_por_prato || ''}</td>
      <td>R$ ${p.preco_venda || 0}</td>
      <td>R$ ${p.custo_prato || 0}</td>
      <td>${p.preco_venda ? (((p.custo_prato || 0) / p.preco_venda) * 100).toFixed(1) : 0}%</td>
      <td>${p.preco_venda ? ((((p.preco_venda - (p.custo_prato || 0)) / p.preco_venda) * 100)).toFixed(1) : 0}%</td>
      <td>-</td>
    </tr>
  `).join('');
}

window.PratosManager = {
  getPratos,
  carregarPratos,
  salvarPrato,
  renderizarPratos
};