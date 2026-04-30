const PratosManager = (() => {

  let pratos = [];
  let editandoId = null;

  function getPratos() {
    return pratos;
  }

  async function carregarPratos() {

    const supabase = SupabaseManager.getSupabaseClient();

    const restauranteId = SupabaseManager.getRestauranteId();

    const { data, error } = await supabase
      .from('pratos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .eq('ativo', true)
      .order('nome_prato');

    if (error) {
      console.error(error);
      return;
    }

    pratos = data || [];

    renderizarPratos();
  }

  async function salvarPrato() {

    const supabase = SupabaseManager.getSupabaseClient();

    const payload = {

      restaurante_id: SupabaseManager.getRestauranteId(),

      nome_prato:
        document.getElementById('nomePrato').value.trim(),

      grupo:
        document.getElementById('grupoPrato').value,

      item:
        document.getElementById('itemProteina').value.trim(),

      kg_por_prato:
        UIManager.NUM(
          document.getElementById('kgPrato').value
        ),

      preco_venda:
        UIManager.NUM(
          document.getElementById('precoVenda').value
        ),

      custo:
        UIManager.NUM(
          document.getElementById('custoPrato').value
        ),

      ativo: true
    };

    let response;

    if (editandoId) {

      response = await supabase
        .from('pratos')
        .update(payload)
        .eq('id', editandoId);

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

    VendasManager.atualizarSelectPratos();
  }

  function renderizarPratos() {

    const tbody =
      document.getElementById('tabelaPratos');

    if (!tbody) return;

    tbody.innerHTML = pratos.map(p => `

      <tr>

        <td>${p.nome_prato}</td>

        <td>${p.grupo || ''}</td>

        <td>${p.item || ''}</td>

        <td>${p.kg_por_prato || 0}</td>

        <td>${UIManager.BRL(p.preco_venda)}</td>

        <td>${UIManager.BRL(p.custo)}</td>

        <td>

          <button onclick="PratosManager.editarPrato('${p.id}')">
            Editar
          </button>

          <button class="btn-red"
            onclick="PratosManager.excluirPrato('${p.id}')">
            Excluir
          </button>

        </td>

      </tr>

    `).join('');
  }

  function editarPrato(id) {

    const p = pratos.find(x => x.id == id);

    if (!p) return;

    editandoId = id;

    nomePrato.value = p.nome_prato || '';
    grupoPrato.value = p.grupo || '';
    itemProteina.value = p.item || '';
    kgPrato.value = p.kg_por_prato || '';
    precoVenda.value = p.preco_venda || '';
    custoPrato.value = p.custo || '';
  }

  async function excluirPrato(id) {

    if (!confirm('Ocultar prato?')) return;

    const supabase =
      SupabaseManager.getSupabaseClient();

    await supabase
      .from('pratos')
      .update({ ativo: false })
      .eq('id', id);

    await carregarPratos();

    VendasManager.atualizarSelectPratos();
  }

  function limparFormulario() {

    editandoId = null;

    nomePrato.value = '';
    grupoPrato.value = '';
    itemProteina.value = '';
    kgPrato.value = '';
    precoVenda.value = '';
    custoPrato.value = '';
  }

  function limparDados() {
    pratos = [];
    editandoId = null;
  }

  return {
    getPratos,
    carregarPratos,
    salvarPrato,
    renderizarPratos,
    editarPrato,
    excluirPrato,
    limparDados
  };

})();

window.PratosManager = PratosManager;