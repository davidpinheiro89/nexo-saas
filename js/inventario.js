// Módulo de CRUD de Inventário do NEXO
let inventario = [];
let editInv = null;

// Obtém inventário carregado
function getInventario() {
  return inventario;
}

// Carrega inventário do Supabase
async function carregarInventario() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  
  if (!supabase || !restauranteId) {
    console.error('Cliente Supabase ou restauranteId não disponível');
    return;
  }

  const { data, error } = await supabase
    .from('inventario')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar inventário:', error);
    throw error;
  }

  inventario = data || [];
}

// Salva item do inventário (novo ou edição)
async function salvarInventario() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  
  if (!supabase || !restauranteId) {
    alert('Faça login novamente. Restaurante não identificado.');
    return;
  }

  const dataInicio = invDataInicio.value;
  const dataFim = invDataFim.value;
  
  if (!dataInicio || !dataFim) {
    alert('Informe a data inicial e a data final do inventário.');
    return;
  }
  
  if (dataFim < dataInicio) {
    alert('A data final do inventário não pode ser menor que a data inicial.');
    return;
  }

  const it = {
    restaurante_id: restauranteId,
    data_inicio: dataInicio,
    data_fim: dataFim,
    mes: dataInicio.slice(0, 7),
    item: UIManager.normalizarItem(invItem.value),
    inicial: UIManager.NUM(invInicial.value),
    compras: UIManager.NUM(invCompras.value),
    final: UIManager.NUM(invFinal.value),
    custo_kg: UIManager.NUM(invCusto.value)
  };

  if (!it.item || !it.custo_kg) {
    alert('Preencha item/proteína e custo/kg.');
    return;
  }

  const atual = editInv !== null ? inventario[editInv] : null;
  const res = atual && atual.id 
    ? await supabase.from('inventario').update(it).eq('id', atual.id)
    : await supabase.from('inventario').insert(it);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar inventário: ' + res.error.message);
    return;
  }

  cancelarEdicaoInventario();
  await carregarInventario();
  renderizarInventario();
}

// Edita item do inventário
function editarInventario(index) {
  editInv = index;
  const it = inventario[index];
  
  invDataInicio.value = it.data_inicio || '';
  invDataFim.value = it.data_fim || '';
  invItem.value = it.item || '';
  invInicial.value = it.inicial || '';
  invCompras.value = it.compras || '';
  invFinal.value = it.final || '';
  invCusto.value = it.custo_kg || '';
  
  document.getElementById('btnSalvarInv').textContent = 'Atualizar';
  document.getElementById('btnCancelarInv').style.display = 'inline-block';
}

// Cancela edição de inventário
function cancelarEdicaoInventario() {
  editInv = null;
  invDataInicio.value = '';
  invDataFim.value = '';
  invItem.value = '';
  invInicial.value = '';
  invCompras.value = '';
  invFinal.value = '';
  invCusto.value = '';
  
  document.getElementById('btnSalvarInv').textContent = 'Adicionar';
  document.getElementById('btnCancelarInv').style.display = 'none';
}

// Exclui item do inventário
async function excluirInventario(index) {
  if (!confirm('Excluir este item do inventário?')) return;
  
  const supabase = SupabaseManager.getSupabaseClient();
  const it = inventario[index];
  
  if (it && it.id) {
    const { error } = await supabase.from('inventario').delete().eq('id', it.id);
    if (error) {
      console.error(error);
      alert('Erro ao excluir inventário: ' + error.message);
      return;
    }
  }
  
  await carregarInventario();
  renderizarInventario();
}

// Renderiza tabela de inventário
function renderizarInventario() {
  const tbody = document.getElementById('invTableBody');
  if (!tbody) return;

  tbody.innerHTML = inventario.map((it, i) => `
    <tr>
      <td>${it.data_inicio || ''}</td>
      <td>${it.data_fim || ''}</td>
      <td>${it.item || ''}</td>
      <td>${it.inicial || ''}kg</td>
      <td>${it.compras || ''}kg</td>
      <td>${it.final || ''}kg</td>
      <td>${UIManager.BRL(it.custo_kg)}/kg</td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="InventarioManager.editarInventario(${i})">Editar</button>
          <button class="btn-red" onclick="InventarioManager.excluirInventario(${i})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Limpa dados do módulo
function limparDados() {
  inventario = [];
  editInv = null;
}

// Exporta funções para uso global
window.InventarioManager = {
  getInventario,
  carregarInventario,
  salvarInventario,
  editarInventario,
  cancelarEdicaoInventario,
  excluirInventario,
  renderizarInventario,
  limparDados
};
