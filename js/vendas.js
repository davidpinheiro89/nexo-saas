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

    const pratos = PratosManager.getPratos();

    select.innerHTML =
      '<option value="">Selecione um prato</option>' +
      pratos.map(p => `
        <option value="${p.nome_prato}">
          ${p.nome_prato}
        </option>
      `).join('');

    atualizarReceitaPreview();
  }

  function atualizarReceitaPreview() {
    const pratoNome =
      document.getElementById('vendaPrato')?.value || '';

    const quantidade =
      num(document.getElementById('vendaQuantidade')?.value);

    const prato = PratosManager
      .getPratos()
      .find(p => p.nome_prato === pratoNome);

    const receita =
      prato
        ? quantidade * Number(prato.preco_venda || 0)
        : 0;

    const campo =
      document.getElementById('vendaReceitaPreview');

    if (campo) {
      campo.value = UIManager.BRL(receita);
    }
  }

  async function salvarVenda() {
    const supabase = SupabaseManager.getSupabaseClient();

    const restauranteId =
      SupabaseManager.getRestauranteId();

    if (!restauranteId) {
      alert('Restaurante não identificado.');
      return;
    }

    const prato =
      document.getElementById('vendaPrato')?.value;

    const quantidade =
      num(document.getElementById('vendaQuantidade')?.value);

    const modo =
      document.getElementById('vendaModo')?.value || 'diario';

    const dataInicio =
      document.getElementById('vendaDataInicio')?.value;

    const dataFimCampo =
      document.getElementById('vendaDataFim')?.value;

    const dataFim =
      modo === 'consolidado'
        ? (dataFimCampo || dataInicio)
        : dataInicio;

    if (!prato) {
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

    const pratoObj =
      PratosManager
        .getPratos()
        .find(p => p.nome_prato === prato);

    const receita =
      pratoObj
        ? quantidade * Number(pratoObj.preco_venda || 0)
        : 0;

    const payload = {
      restaurante_id: restauranteId,
      prato,
      quantidade,
      modo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      data: dataInicio,
      receita
    };

    const response = editandoId
      ? await supabase
          .from('vendas')
          .update(payload)
          .eq('id', editandoId)
      : await supabase
          .from('vendas')
          .insert(payload);

    if (response.error) {
      console.error(response.error);
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
    const tbody =
      document.getElementById('vendasTableBody');

    if (!tbody) return;

    tbody.innerHTML = vendas.map(v => `
      <tr>
        <td>${v.data_inicio || ''}</td>
        <td>${v.prato || ''}</td>
        <td>${v.modo || ''}</td>
        <td>${v.quantidade || 0}</td>
        <td>${UIManager.BRL(v.receita || 0)}</td>

        <td>
          <div class="actions">

            <button
              class="btn-edit"
              onclick="VendasManager.editarVenda('${v.id}')"
            >
              Editar
            </button>

            <button
              class="btn-red"
              onclick="VendasManager.excluirVenda('${v.id}')"
            >
              Excluir
            </button>

          </div>
        </td>

      </tr>
    `).join('');
  }

  function editarVenda(id) {
    const venda =
      vendas.find(v => String(v.id) === String(id));

    if (!venda) return;

    editandoId = id;

    document.getElementById('vendaPrato').value =
      venda.prato || '';

    document.getElementById('vendaQuantidade').value =
      venda.quantidade || '';

    document.getElementById('vendaModo').value =
      venda.modo || 'diario';

    document.getElementById('vendaDataInicio').value =
      venda.data_inicio || '';

    document.getElementById('vendaDataFim').value =
      venda.data_fim || '';

    atualizarReceitaPreview();

    const btn =
      document.getElementById('btnSalvarVenda');

    if (btn) {
      btn.textContent = 'Atualizar venda';
    }
  }

  function cancelarEdicao() {
    editandoId = null;

    [
      'vendaQuantidade',
      'vendaDataInicio',
      'vendaDataFim',
      'vendaReceitaPreview'
    ].forEach(id => {
      const el = document.getElementById(id);

      if (el) el.value = '';
    });

    const prato =
      document.getElementById('vendaPrato');

    if (prato) prato.value = '';

    const modo =
      document.getElementById('vendaModo');

    if (modo) modo.value = 'diario';

    const btn =
      document.getElementById('btnSalvarVenda');

    if (btn) {
      btn.textContent = 'Salvar venda';
    }
  }

  async function excluirVenda(id) {
    if (!confirm('Excluir esta venda?')) {
      return;
    }

    const supabase =
      SupabaseManager.getSupabaseClient();

    const { error } = await supabase
      .from('vendas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
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

  document.addEventListener('input', e => {
    if (e.target?.id === 'vendaQuantidade') {
      atualizarReceitaPreview();
    }
  });

  document.addEventListener('change', e => {
    if (
      e.target?.id === 'vendaPrato'
    ) {
      atualizarReceitaPreview();
    }
  });

  return {
    getVendas,
    carregarVendas,
    atualizarSelectPratos,
    atualizarReceitaPreview,
    salvarVenda,
    renderizarVendas,
    editarVenda,
    cancelarEdicao,
    excluirVenda,
    limparDados
  };
})();

window.VendasManager = VendasManager;
window.salvarVenda = VendasManager.salvarVenda;