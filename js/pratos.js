let pratos = [];
let editando = null;

function getPratos() { return pratos; }
function numero(v) { return parseFloat(String(v || 0).replace(',', '.')) || 0; }
function moeda(v) { return UIManager?.BRL ? UIManager.BRL(v) : `R$ ${Number(v || 0).toFixed(2)}`; }

async function carregarPratos() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  if (!supabase || !restauranteId) return;

  const { data, error } = await supabase
    .from('pratos')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('id', { ascending: true });

  if (error) { console.error(error); return; }

  pratos = data || [];
  renderizarTabela();
}

function renderizarTabela() {
  const tabela = document.getElementById('pratosTableBody') || document.querySelector('#pratos tbody');
  if (!tabela) return;

  tabela.innerHTML = pratos.map((p, i) => {
    const nome = p.nome_prato || p.nome || '';
    const item = p.item_proteina || p.item || '';
    const kg = p.kg_por_prato ?? p.kg ?? 0;
    const preco = numero(p.preco_venda ?? p.preco);
    const custo = numero(p.custo_prato ?? p.custo);
    const cmv = preco ? (custo / preco) * 100 : 0;
    const margem = preco ? ((preco - custo) / preco) * 100 : 0;

    return `
      <tr>
        <td>${nome}</td>
        <td>${p.grupo || ''}</td>
        <td>${item}</td>
        <td>${Number(kg).toFixed(3)}</td>
        <td>${moeda(preco)}</td>
        <td>${moeda(custo)}</td>
        <td>${cmv.toFixed(1)}%</td>
        <td>${margem.toFixed(1)}%</td>
        <td>
          <button class="btn-edit" onclick="PratosManager.editarPrato(${i})">Editar</button>
          <button class="btn-red" onclick="PratosManager.excluirPrato(${i})">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function salvarPrato() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) {
    alert('Faça login novamente. Restaurante não identificado.');
    return;
  }

  const payload = {
    restaurante_id: restauranteId,
    nome_prato: pratoNome.value.trim(),
    grupo: pratoGrupo.value,
    item_proteina: pratoItem.value.trim(),
    kg_por_prato: numero(pratoKg.value),
    preco_venda: numero(pratoPreco.value),
    custo_prato: numero(pratoCusto.value)
  };

  if (!payload.nome_prato || !payload.item_proteina || !payload.kg_por_prato || !payload.preco_venda) {
    alert('Preencha nome, item/proteína, kg por prato e preço.');
    return;
  }

  const res = editando !== null && pratos[editando]?.id
    ? await supabase.from('pratos').update(payload).eq('id', pratos[editando].id)
    : await supabase.from('pratos').insert(payload);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar prato: ' + res.error.message);
    return;
  }

  cancelarEdicaoPrato();
  await carregarPratos();

  if (window.VendasManager?.atualizarSelectPratos) {
    window.VendasManager.atualizarSelectPratos();
  }

  if (window.DashboardManager?.renderizarDashboard) {
    window.DashboardManager.renderizarDashboard();
  }
}

function editarPrato(index) {
  editando = index;
  const p = pratos[index];

  pratoNome.value = p.nome_prato || p.nome || '';
  pratoGrupo.value = p.grupo || '';
  pratoItem.value = p.item_proteina || p.item || '';
  pratoKg.value = p.kg_por_prato ?? p.kg ?? '';
  pratoPreco.value = p.preco_venda ?? p.preco ?? '';
  pratoCusto.value = p.custo_prato ?? p.custo ?? '';

  const btn = document.getElementById('btnSalvarPrato');
  if (btn) btn.textContent = 'Atualizar prato';
}

function cancelarEdicaoPrato() {
  editando = null;
  pratoNome.value = '';
  pratoItem.value = '';
  pratoKg.value = '';
  pratoPreco.value = '';
  pratoCusto.value = '';

  const btn = document.getElementById('btnSalvarPrato');
  if (btn) btn.textContent = 'Salvar prato';
}

async function excluirPrato(index) {
  if (!confirm('Excluir prato?')) return;

  const supabase = SupabaseManager.getSupabaseClient();
  const p = pratos[index];
  if (!supabase || !p?.id) return;

  const { error } = await supabase.from('pratos').delete().eq('id', p.id);
  if (error) {
    console.error(error);
    alert('Erro ao excluir prato.');
    return;
  }

  await carregarPratos();

  if (window.VendasManager?.atualizarSelectPratos) {
    window.VendasManager.atualizarSelectPratos();
  }
}

function limparDados() {
  pratos = [];
  editando = null;
  renderizarTabela();
}

window.PratosManager = {
  getPratos,
  carregarPratos,
  salvarPrato,
  editar: editarPrato,
  editarPrato,
  excluir: excluirPrato,
  excluirPrato,
  renderizarPratos: renderizarTabela,
  limparDados
};