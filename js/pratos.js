let pratos = [];
let editando = null;

function moeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function numero(v) {
  return parseFloat(String(v || 0).replace(',', '.')) || 0;
}

async function carregarPratos() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  if (!supabase || !restauranteId) {
    console.error('Supabase ou restauranteId ausente');
    return;
  }

  const { data, error } = await supabase
    .from('pratos')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  pratos = data || [];

  renderizarTabela();
}

function renderizarTabela() {
  const tabela =
    document.getElementById('pratosTableBody') ||
    document.getElementById('pratosTabelaBody') ||
    document.querySelector('tbody');

  if (!tabela) {
    console.error('tbody não encontrado');
    return;
  }

  tabela.innerHTML = '';

  pratos.forEach((p, index) => {
    const preco = numero(p.preco_venda);
    const custo = numero(p.custo_prato);
    const cmv = preco ? ((custo / preco) * 100).toFixed(1) : 0;
    const margem = preco ? (((preco - custo) / preco) * 100).toFixed(1) : 0;

    tabela.innerHTML += `
      <tr>
        <td>${p.nome_prato || '-'}</td>
        <td>${p.grupo || '-'}</td>
        <td>${p.item_proteina || '-'}</td>
        <td>${p.kg_por_prato || '-'}</td>
        <td>${moeda(preco)}</td>
        <td>${moeda(custo)}</td>
        <td>${cmv}%</td>
        <td>${margem}%</td>
        <td>
          <button onclick="PratosManager.editar(${index})">
            Editar
          </button>

          <button onclick="PratosManager.excluir(${index})">
            Excluir
          </button>
        </td>
      </tr>
    `;
  });
}

async function salvarPrato() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();

  const payload = {
    restaurante_id: restauranteId,
    nome_prato: pratoNome.value,
    grupo: pratoGrupo.value,
    item_proteina: pratoItem.value,
    kg_por_prato: numero(pratoKg.value),
    preco_venda: numero(pratoPreco.value),
    custo_prato: numero(pratoCusto.value)
  };

  let response;

  if (editando !== null) {
    response = await supabase
      .from('pratos')
      .update(payload)
      .eq('id', pratos[editando].id);
  } else {
    response = await supabase
      .from('pratos')
      .insert(payload);
  }

  if (response.error) {
    console.error(response.error);
    alert('Erro ao salvar prato');
    return;
  }

  limparFormulario();

  await carregarPratos();

  if (window.VendasManager?.atualizarSelectPratos) {
    window.VendasManager.atualizarSelectPratos();
  }
}

function editar(index) {
  const p = pratos[index];

  editando = index;

  pratoNome.value = p.nome_prato || '';
  pratoGrupo.value = p.grupo || '';
  pratoItem.value = p.item_proteina || '';
  pratoKg.value = p.kg_por_prato || '';
  pratoPreco.value = p.preco_venda || '';
  pratoCusto.value = p.custo_prato || '';
}

async function excluir(index) {
  if (!confirm('Excluir prato?')) return;

  const supabase = SupabaseManager.getSupabaseClient();

  const { error } = await supabase
    .from('pratos')
    .delete()
    .eq('id', pratos[index].id);

  if (error) {
    console.error(error);
    return;
  }

  await carregarPratos();
}

function limparFormulario() {
  editando = null;

  pratoNome.value = '';
  pratoItem.value = '';
  pratoKg.value = '';
  pratoPreco.value = '';
  pratoCusto.value = '';
}

window.PratosManager = {
  carregarPratos,
  salvarPrato,
  editar,
  excluir
};