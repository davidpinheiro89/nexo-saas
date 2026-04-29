// Módulo de CRUD de Pratos do NEXO
let pratos = [];
let editPrato = null;

// Obtém pratos carregados
function getPratos() {
  return pratos;
}

// Carrega pratos do Supabase
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
    throw error;
  }

  pratos = data || [];
}

// Salva prato (novo ou edição)
async function salvarPrato() {
  const supabase = SupabaseManager.getSupabaseClient();
  const restauranteId = SupabaseManager.getRestauranteId();
  
  if (!supabase || !restauranteId) {
    alert('Faça login novamente. Restaurante não identificado.');
    return;
  }

  const nome = UIManager.texto(pratoNome.value);
  const item = UIManager.normalizarItem(pratoItem.value);
  const p = {
    restaurante_id: restauranteId,
    nome,
    nome_prato: nome,
    grupo: pratoGrupo.value,
    item,
    kg: UIManager.NUM(pratoKg.value),
    preco: UIManager.NUM(pratoPreco.value),
    custo: UIManager.NUM(pratoCusto.value)
  };

  if (!p.nome || !p.item || !p.kg || !p.preco) {
    alert('Preencha nome, item, kg/prato e preço.');
    return;
  }

  const atual = editPrato !== null ? pratos[editPrato] : null;
  const res = atual && atual.id 
    ? await supabase.from('pratos').update(p).eq('id', atual.id)
    : await supabase.from('pratos').insert(p);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar prato: ' + res.error.message);
    return;
  }

  cancelarEdicaoPrato();
  await carregarPratos();
  renderizarPratos();
}

// Edita prato
function editarPrato(index) {
  editPrato = index;
  const p = pratos[index];
  
  pratoNome.value = p.nome || '';
  pratoItem.value = p.item || '';
  pratoGrupo.value = p.grupo || '';
  pratoKg.value = p.kg || '';
  pratoPreco.value = p.preco || '';
  pratoCusto.value = p.custo || '';
  
  document.getElementById('btnSalvarPrato').textContent = 'Atualizar';
  document.getElementById('btnCancelarPrato').style.display = 'inline-block';
}

// Cancela edição de prato
function cancelarEdicaoPrato() {
  editPrato = null;
  pratoNome.value = '';
  pratoItem.value = '';
  pratoGrupo.value = '';
  pratoKg.value = '';
  pratoPreco.value = '';
  pratoCusto.value = '';
  
  document.getElementById('btnSalvarPrato').textContent = 'Adicionar';
  document.getElementById('btnCancelarPrato').style.display = 'none';
}

// Exclui prato
async function excluirPrato(index) {
  if (!confirm('Excluir este prato?')) return;
  
  const supabase = SupabaseManager.getSupabaseClient();
  const p = pratos[index];
  
  if (p && p.id) {
    const { error } = await supabase.from('pratos').delete().eq('id', p.id);
    if (error) {
      console.error(error);
      alert('Erro ao excluir prato: ' + error.message);
      return;
    }
  }
  
  await carregarPratos();
  renderizarPratos();
}

// Renderiza tabela de pratos
function renderizarPratos() {
  const tbody = document.getElementById('pratosTableBody');
  if (!tbody) return;

  tbody.innerHTML = pratos.map((p, i) => `
    <tr>
      <td>${p.nome || ''}</td>
      <td>${p.item || ''}</td>
      <td>${p.grupo || ''}</td>
      <td>${p.kg || ''}kg</td>
      <td>${UIManager.BRL(p.preco)}</td>
      <td>${UIManager.BRL(p.custo)}</td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="PratosManager.editarPrato(${i})">Editar</button>
          <button class="btn-red" onclick="PratosManager.excluirPrato(${i})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Limpa dados do módulo
function limparDados() {
  pratos = [];
  editPrato = null;
}

// Exporta funções para uso global
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
