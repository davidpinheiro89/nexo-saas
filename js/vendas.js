const VendasManager = (() => {
  let vendas = [];
  let editandoId = null;

  function getVendas() {
    return vendas;
  }

  function num(v) {
    return Number(String(v || '').replace(',', '.')) || 0;
  }

  function campoPorLabel(textoLabel) {
    const labels = [...document.querySelectorAll('label')];

    const label = labels.find(l =>
      (l.innerText || '').toLowerCase().includes(textoLabel.toLowerCase())
    );

    if (!label) return null;

    const container = label.parentElement;
    if (!container) return null;

    return container.querySelector('input, select, textarea');
  }

  function getCampos() {
    return {
      modo: document.getElementById('vendaModo') || campoPorLabel('Modo'),
      dataInicio: document.getElementById('vendaDataInicio') || campoPorLabel('Data inicial'),
      dataFim: document.getElementById('vendaDataFim') || campoPorLabel('Data final'),
      prato: document.getElementById('vendaPrato') || campoPorLabel('Prato'),
      quantidade: document.getElementById('vendaQuantidade') || campoPorLabel('Quantidade vendida'),
      receita: document.getElementById('vendaReceitaPreview') || campoPorLabel('Receita automática')
    };
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
    const campos = getCampos();
    const select = campos.prato;

    if (!select) return;

    const pratos = PratosManager.getPratos();

    select.innerHTML =
      '<option value="">Selecione um prato</option>' +
      pratos.map(p => {
        const nome = p.nome_prato || p.nome || '';
        return `<option value="${nome}">${nome}</option>`;
      }).join('');

    atualizarReceitaPreview();
  }

  function atualizarReceitaPreview() {
    const campos = getCampos();

    const pratoNome = campos.prato?.value || '';
    const quantidade = num(campos.quantidade?.value);

    const prato = PratosManager.getPratos().find(p =>
      (p.nome_prato || p.nome) === pratoNome
    );

    const receita = prato
      ? quantidade * Number(prato.preco_venda || p.preco || 0)
      : 0;

    if (campos.receita) {
      campos.receita.value = UIManager.BRL(receita);
    }
  }

  async function salvarVenda() {
    const supabase = SupabaseManager.getSupabaseClient();
    const restauranteId = SupabaseManager.getRestauranteId();

    if (!restauranteId) {
      alert('Restaurante não identificado.');
      return;
    }

    const campos = getCampos();

    const pratoNome = campos.prato?.value || '';
    const quantidade = num(campos.quantidade?.value);
    const modo = campos.modo?.value || 'diario';
    const dataInicio = campos.dataInicio?.value;
    const dataFimCampo = campos.dataFim?.value;
    const dataFim = modo === 'consolidado' ? (dataFimCampo || dataInicio) : dataInicio;

    if (!pratoNome) {
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

    const prato = PratosManager.getPratos().find(p =>
      (p.nome_prato || p.nome) === pratoNome
    );

    const receita = prato
      ? quantidade * Number(prato.preco_venda || prato.preco || 0)
      : 0;

    const payload = {
      restaurante_id: restauranteId,
      prato: pratoNome,
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
        <td>${v.modo || ''}</td>
        <td>${v.prato || ''}</td>
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
    const venda = vendas.find(v => String(v.id) === String(id));
    if (!venda) return;

    editandoId = id;

    const campos = getCampos();

    if (campos.prato) campos.prato.value = venda.prato || '';
    if (campos.quantidade) campos.quantidade.value = venda.quantidade || '';
    if (campos.modo) campos.modo.value = venda.modo || 'diario';
    if (campos.dataInicio) campos.dataInicio.value = venda.data_inicio || venda.data || '';
    if (campos.dataFim) campos.dataFim.value = venda.data_fim || venda.data_inicio || venda.data || '';

    atualizarReceitaPreview();

    const btn = document.getElementById('btnSalvarVenda');
    if (btn) btn.textContent = 'Atualizar venda';
  }

  function cancelarEdicao() {
    editandoId = null;

    const campos = getCampos();

    if (campos.prato) campos.prato.value = '';
    if (campos.quantidade) campos.quantidade.value = '';
    if (campos.dataInicio) campos.dataInicio.value = '';
    if (campos.dataFim) campos.dataFim.value = '';
    if (campos.receita) campos.receita.value = '';
    if (campos.modo) campos.modo.value = 'diario';

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

  document.addEventListener('input', () => {
    atualizarReceitaPreview();
  });

  document.addEventListener('change', () => {
    atualizarReceitaPreview();
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