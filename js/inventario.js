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

  const dataInicio = document.getElementById('invDataInicio')?.value;
  const dataFim = document.getElementById('invDataFim')?.value;
  const item = document.getElementById('invItem')?.value?.trim();
  const inicial = UIManager.NUM(document.getElementById('invInicial')?.value);
  const compras = UIManager.NUM(document.getElementById('invCompras')?.value);
  const final = UIManager.NUM(document.getElementById('invFinal')?.value);
  const custo = UIManager.NUM(document.getElementById('invCusto')?.value);
  
  if (!dataInicio || !dataFim || !item || !custo) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  
  if (dataFim < dataInicio) {
    alert('A data final não pode ser menor que a data inicial.');
    return;
  }

  const invItem = {
    restaurante_id: restauranteId,
    data_inicio: dataInicio,
    data_fim: dataFim,
    mes: dataInicio.slice(0, 7),
    item: UIManager.normalizarItem(item),
    inicial,
    compras,
    final,
    custo_kg: custo
  };

  const atual = editInv !== null ? inventario[editInv] : null;
  const res = atual && atual.id 
    ? await supabase.from('inventario').update(invItem).eq('id', atual.id)
    : await supabase.from('inventario').insert(invItem);

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
  
  document.getElementById('invDataInicio').value = it.data_inicio || '';
  document.getElementById('invDataFim').value = it.data_fim || '';
  document.getElementById('invItem').value = it.item || '';
  document.getElementById('invInicial').value = it.inicial || '';
  document.getElementById('invCompras').value = it.compras || '';
  document.getElementById('invFinal').value = it.final || '';
  document.getElementById('invCusto').value = it.custo_kg || '';
  
  document.getElementById('btnSalvarInv').textContent = 'Atualizar';
  document.getElementById('btnCancelarInv').style.display = 'inline-block';
}

// Cancela edição de inventário
function cancelarEdicaoInventario() {
  editInv = null;
  document.getElementById('invDataInicio').value = '';
  document.getElementById('invDataFim').value = '';
  document.getElementById('invItem').value = '';
  document.getElementById('invInicial').value = '';
  document.getElementById('invCompras').value = '';
  document.getElementById('invFinal').value = '';
  document.getElementById('invCusto').value = '';
  
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

  tbody.innerHTML = inventario.map((it, i) => {
    const consumo = it.inicial + it.compras - it.final;
    const custo = consumo * it.custo_kg;
    const periodo = it.data_inicio === it.data_fim ? it.data_inicio : `${it.data_inicio} a ${it.data_fim}`;
    
    return `
      <tr>
        <td>${periodo}</td>
        <td>${it.item}</td>
        <td>${it.inicial?.toFixed(2) || 0}kg</td>
        <td>${it.compras?.toFixed(2) || 0}kg</td>
        <td>${it.final?.toFixed(2) || 0}kg</td>
        <td>${consumo.toFixed(2)}kg</td>
        <td>${UIManager.BRL(custo)}</td>
        <td>
          <div class="actions">
            <button class="btn-edit" onclick="InventarioManager.editarInventario(${i})">Editar</button>
            <button class="btn-red" onclick="InventarioManager.excluirInventario(${i})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
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
