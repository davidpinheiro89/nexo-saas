// Módulo de CRUD de Pratos do NEXO
let pratos = [];
let editPrato = null;

function getPratos() {
  return pratos;
}

function num(valor) {
  return parseFloat(String(valor || '').replace(',', '.')) || 0;
}

async function carregarPratos() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) return;

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
    alert('Faça login novamente. Restaurante não identificado.');
    return;
  }

  const prato = {
    restaurante_id: restauranteId,
    nome_prato: pratoNome.value.trim(),
    grupo: pratoGrupo.value,
    item_proteina: pratoItem.value.trim(),
    kg_por_prato: num(pratoKg.value),
    preco_venda: num(pratoPreco.value),
    custo_prato: num(pratoCusto.value)
  };

  if (!prato.nome_prato || !prato.item_proteina || !prato.kg_por_prato || !prato.preco_venda) {
    alert('Preencha nome, item/proteína, kg por prato e preço.');
    return;
  }

  const res = editPrato !== null && pratos[editPrato]?.id
    ? await supabase.from('pratos').update(prato).eq('id', pratos[editPrato].id)
    : await supabase.from('pratos').insert(prato);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar prato: ' + res.error.message);
    return;
  }

  cancelarEdicaoPrato();
  await carregarPratos();
  renderizarPratos();

  if (window.VendasManager) {
    window.VendasManager.atualizarSelectPratos();
  }
}

function editarPrato(index) {
  editPrato = index;
  const p = pratos[index];

  pratoNome.value = p.nome_prato || p.nome || '';
  pratoGrupo.value = p.grupo || '';
  pratoItem.value = p.item_proteina || p.item || '';
  pratoKg.value = p.kg_por_prato || p.kg || '';
  pratoPreco.value = p.preco_venda || p.preco || '';
  pratoCusto.value = p.custo_prato || p.custo || '';

  const btnSalvarPrato = document.getElementById('btnSalvarPrato');
  if (btnSalvarPrato) btnSalvarPrato.textContent = 'Atualizar prato';

  const btnCancelarPrato = document.getElementById('btnCancelarPrato');
  if (btnCancelarPrato) btnCancelarPrato.style.display = 'inline-block';
}

function cancelarEdicaoPrato() {
  editPrato = null;

  pratoNome.value = '';
  pratoItem.value = '';
  pratoKg.value = '';
  pratoPreco.value = '';
  pratoCusto.value = '';

  const btnSalvarPrato = document.getElementById('btnSalvarPrato');
  if (btnSalvarPrato) btnSalvarPrato.textContent = 'Salvar prato';

  const btnCancelarPrato = document.getElementById('btnCancelarPrato');
  if (btnCancelarPrato) btnCancelarPrato.style.display = 'none';
}

async function excluirPrato(index) {
  if (!confirm('Excluir este prato?')) return;

  const supabase = SupabaseManager.getSupabaseClient();
  const p = pratos[index];

  if (!supabase || !p?.id) return;

  const { error } = await supabase.from('pratos').delete().eq('id', p.id);

  if (error) {
    console.error(error);
    alert('Erro ao excluir prato: ' + error.message);
    return;
  }

  await carregarPratos();
  renderizarPratos();

  if (window.VendasManager) {
    window.VendasManager.atualizarSelectPratos();
  }
}

function renderizarPratos() {
  const tbody = document.getElementById('pratosTableBody');
  if (!tbody) return;

  tbody.innerHTML = pratos.map((p, i) => {
    const nome = p.nome_prato || p.nome || '';
    const item = p.item_proteina || p.item || '';
    const kg = p.kg_por_prato ?? p.kg ?? 0;
    const preco = p.preco_venda ?? p.preco ?? 0;
    const custo = p.custo_prato ?? p.custo ?? 0;
    const cmv = preco ? (custo / preco) * 100 : 0;
    const margem = preco ? ((preco - custo) / preco) * 100 : 0;

    return `
      <tr>
        <td>${nome}</td>
        <td>${p.grupo || ''}</td>
        <td>${item}</td>
        <td>${Number(kg).toFixed(3)}</td>
        <td>${UIManager.BRL(preco)}</td>
        <td>${UIManager.BRL(custo)}</td>
        <td>${cmv.toFixed(1)}%</td>
        <td>${margem.toFixed(1)}%</td>
        <td>
          <div class="actions">
            <button class="btn-edit" onclick="PratosManager.editarPrato(${i})">Editar</button>
            <button class="btn-red" onclick="PratosManager.excluirPrato(${i})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function limparDados() {
  pratos = [];
  editPrato = null;
}

window.PratosManager = {
  getPratos,
  carregarPratos,
  salvarPrato,
  editarPrato,
  cancelarEdicaoPrato,
  excluirPrato,
  renderizarPratos,
  limparDados
};