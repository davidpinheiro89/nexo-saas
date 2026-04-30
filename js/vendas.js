const VendasManager = (() => {
  let vendas = [];
  let editandoId = null;

  function getVendas() {
    return vendas;
  }

  function num(v) {
    return Number(String(v || '').replace(',', '.')) || 0;
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
      console.error('Erro ao carregar vendas:', error);
      alert('Erro ao carregar vendas.');
      return;
    }

    vendas = data || [];
    renderizarVendas();
  }

  function atualizarSelectPratos() {
    const select = document.getElementById('vendaPrato');
    if (!select) return;

    const pratos = window.PratosManager?.getPratos
      ? PratosManager.getPratos()
      : [];

    select.innerHTML =
      '<option value="">Selecione um prato</option>' +
      pratos.map(p => `
        <option value="${p.id}">
          ${p.nome_prato}
        </option>
      `).join('');
  }

  async function salvarVenda() {
    const supabase = SupabaseManager.getSupabaseClient();
    const restauranteId = SupabaseManager.getRestauranteId();

    if (!restauranteId) {
      alert('Restaurante não identificado.');
      return;
    }

    const pratoId = document.getElementById('vendaPrato')?.value;
    const quantidade = num(document.getElementById('vendaQuantidade')?.value);
    const modo = document.getElementById('vendaModo')?.value || 'diario';
    const dataInicio = document.getElementById('vendaDataInicio')?.value;
    const dataFimCampo = document.getElementById('vendaDataFim')?.value;
    const dataFim = modo === 'consolidado' ? (dataFimCampo || dataInicio) : dataInicio;

    if (!pratoId) {
      alert('Selecione um prato.');
      return;
    }

    if (!quantidade || quantidade <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }

    if (!dataInicio) {
      alert('Informe a data.');
      return;
    }

    const pratos = PratosManager.getPratos();
    const prato = pratos.find(p => String(p.id) === String(pratoId));

    if (!prato) {
      alert('Prato não encontrado. Recarregue a página.');
      return;
    }

    const receita = quantidade * Number(prato.preco_venda || 0);

    const payload = {
      restaurante_id: restauranteId,
      prato_id: prato.id,
      prato: prato.nome_prato,
      quantidade,
      modo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      data: dataInicio,
      receita
    };

    const res = editandoId
      ? await supabase.from('vendas').update(payload).eq('id', editandoId)
      : await supabase.from('vendas').insert(payload);

    if (res.error) {
      console.error('Erro ao salvar venda:', res.error);
      alert('Erro ao salvar venda.');
      return;
    }

    cancelarEdicao();
    await carregarVendas();

    if (window.DashboardManager?.renderizarDashboard) {
      DashboardManager.renderizarDashboard();
    }
  }

  function renderizarVendas() {
    const tbody = document.getElementById('vendasTableBody');
    if (!tbody) return;

    tbody.innerHTML = vendas.map(v => `
      <tr>
        <td>${v.data_inicio || v.data || ''}</td>
        <td>${v.prato || ''}</td>
        <td>${v.modo || ''}</td>
        <td>${v.quantidade || 0}</td>
        <td>${UIManager.BRL(v.receita || 0)}</td>
        <td>
          <div class="actions">
            <button class="btn-edit" onclick="VendasManager.editarVenda('${v.id}')">Editar</button>
            <button class="btn-red" onclick="VendasManager.excluirVenda('${v.id}')">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function editarVenda(id) {
    const v = vendas.find(item => String(item.id) === String(id));
    if (!v) return;

    editandoId = id;

    const select = document.getElementById('vendaPrato');
    if (select) select.value = v.prato_id || '';

    document.getElementById('vendaQuantidade').value = v.quantidade || '';
    document.getElementById('vendaModo').value = v.modo || 'diario';
    document.getElementById('vendaDataInicio').value = v.data_inicio || v.data || '';
    document.getElementById('vendaDataFim').value = v.data_fim || v.data_inicio || v.data || '';

    const btn = document.getElementById('btnSalvarVenda');
    if (btn) btn.textContent = 'Atualizar venda';
  }

  function cancelarEdicao() {
    editandoId = null;

    const campos = ['vendaPrato', 'vendaQuantidade', 'vendaDataInicio', 'vendaDataFim'];
    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const modo = document.getElementById('vendaModo');
    if (modo) modo.value = 'diario';

    const btn = document.getElementById('btnSalvarVenda');
    if (btn) btn.textContent = 'Salvar venda';
  }

  async function excluirVenda(id) {
    if (!confirm('Excluir esta venda?')) return;

    const supabase = SupabaseManager.getSupabaseClient();

    const { error } = await supabase
      .from('vendas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir venda:', error);
      alert('Erro ao excluir venda.');
      return;
    }

    await carregarVendas();

    if (window.DashboardManager?.renderizarDashboard) {
      DashboardManager.renderizarDashboard();
    }
  }

  function limparDados() {
    vendas = [];
    editandoId = null;
    renderizarVendas();
  }

  return {
    getVendas,
    carregarVendas,
    atualizarSelectPratos,
    salvarVenda,
    renderizarVendas,
    editarVenda,
    excluirVenda,
    cancelarEdicao,
    limparDados
  };
})();

window.VendasManager = VendasManager;

window.salvarVenda = VendasManager.salvarVenda;