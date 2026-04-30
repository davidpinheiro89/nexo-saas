const VendasManager = (() => {

  let vendas = [];
  let editandoId = null;

  function getVendas() {
    return vendas;
  }

  async function carregarVendas() {

    const supabase =
      SupabaseManager.getSupabaseClient();

    const restauranteId =
      SupabaseManager.getRestauranteId();

    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.error(error);
      return;
    }

    vendas = data || [];

    renderizarVendas();
  }

  function atualizarSelectPratos() {

    const select =
      document.getElementById('vendaPrato');

    if (!select) return;

    const pratos =
      PratosManager.getPratos();

    select.innerHTML = `

      <option value="">
        Selecione
      </option>

      ${pratos.map(p => `

        <option value="${p.id}">
          ${p.nome_prato}
        </option>

      `).join('')}

    `;
  }

  async function salvarVenda() {

    const pratoId =
      document.getElementById('vendaPrato').value;

    const pratos =
      PratosManager.getPratos();

    const prato =
      pratos.find(p => p.id == pratoId);

    if (!prato) {
      alert('Selecione um prato');
      return;
    }

    const quantidade =
      UIManager.NUM(vendaQuantidade.value);

    const receita =
      quantidade * Number(prato.preco_venda || 0);

    const payload = {

      restaurante_id:
        SupabaseManager.getRestauranteId(),

      prato_id: prato.id,

      prato: prato.nome_prato,

      quantidade,

      receita,

      modo: vendaModo.value,

      data_inicio:
        vendaDataInicio.value,

      data_fim:
        vendaDataFim.value ||

        vendaDataInicio.value,

      data:
        vendaDataInicio.value
    };

    const supabase =
      SupabaseManager.getSupabaseClient();

    let response;

    if (editandoId) {

      response = await supabase
        .from('vendas')
        .update(payload)
        .eq('id', editandoId);

    } else {

      response = await supabase
        .from('vendas')
        .insert(payload);
    }

    if (response.error) {
      console.error(response.error);
      alert('Erro ao salvar venda');
      return;
    }

    cancelarEdicao();

    await carregarVendas();

    DashboardManager.renderizarDashboard();
  }

  function renderizarVendas() {

    const tbody =
      document.getElementById(
        'vendasTableBody'
      );

    if (!tbody) return;

    tbody.innerHTML = vendas.map(v => `

      <tr>

        <td>${v.data || ''}</td>

        <td>${v.prato || ''}</td>

        <td>${v.quantidade || 0}</td>

        <td>${UIManager.BRL(v.receita)}</td>

        <td>

          <button
            onclick="VendasManager.editarVenda('${v.id}')">
            Editar
          </button>

          <button class="btn-red"
            onclick="VendasManager.excluirVenda('${v.id}')">
            Excluir
          </button>

        </td>

      </tr>

    `).join('');
  }

  function editarVenda(id) {

    const v =
      vendas.find(x => x.id == id);

    if (!v) return;

    editandoId = id;

    vendaPrato.value = v.prato_id;
    vendaQuantidade.value = v.quantidade;
    vendaModo.value = v.modo;
    vendaDataInicio.value = v.data_inicio;
    vendaDataFim.value = v.data_fim;
  }

  function cancelarEdicao() {

    editandoId = null;

    vendaPrato.value = '';
    vendaQuantidade.value = '';
  }

  async function excluirVenda(id) {

    if (!confirm('Excluir venda?'))
      return;

    const supabase =
      SupabaseManager.getSupabaseClient();

    await supabase
      .from('vendas')
      .delete()
      .eq('id', id);

    await carregarVendas();
  }

  function limparDados() {

    vendas = [];
    editandoId = null;
  }

  return {

    getVendas,

    carregarVendas,

    atualizarSelectPratos,

    salvarVenda,

    renderizarVendas,

    editarVenda,

    excluirVenda,

    limparDados
  };

})();

window.VendasManager = VendasManager;