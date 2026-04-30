const PratosManager = (() => {
  let pratos = [];
  let editandoId = null;

  function getPratos() {
    return pratos;
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
      nome: document.getElementById('nomePrato') || campoPorLabel('Nome do prato'),
      grupo: document.getElementById('grupoPrato') || campoPorLabel('Grupo'),
      item: document.getElementById('itemProteina') || campoPorLabel('Item/proteína'),
      kg: document.getElementById('kgPrato') || campoPorLabel('Quantidade por prato'),
      preco: document.getElementById('precoVenda') || campoPorLabel('Preço de venda'),
      custo: document.getElementById('custoPrato') || campoPorLabel('Custo do prato')
    };
  }

  async function carregarPratos() {
    const supabase = SupabaseManager.getSupabaseClient();
    const restauranteId = SupabaseManager.getRestauranteId();

    if (!supabase || !restauranteId) return;

    const { data, error } = await supabase
      .from('pratos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pratos:', error);
      alert('Erro ao carregar pratos.');
      return;
    }

    pratos = data || [];
    renderizarPratos();

    if (window.VendasManager?.atualizarSelectPratos) {
      VendasManager.atualizarSelectPratos();
    }
  }

  async function salvarPrato() {
    const supabase = SupabaseManager.getSupabaseClient();
    const restauranteId = SupabaseManager.getRestauranteId();

    if (!restauranteId) {
      alert('Restaurante não identificado.');
      return;
    }

    const campos = getCampos();

    const nome = campos.nome?.value?.trim();
    const grupo = campos.grupo?.value || 'Alimentos';
    const item = campos.item?.value?.trim();
    const kg = num(campos.kg?.value);
    const preco = num(campos.preco?.value);
    const custo = num(campos.custo?.value);

    if (!nome) {
      alert('Informe o nome do prato.');
      return;
    }

    const payload = {
      restaurante_id: restauranteId,
      nome_prato: nome,
      grupo,
      item,
      kg_por_prato: kg,
      preco_venda: preco,
      custo,
      ativo: true
    };

    const res = editandoId
      ? await supabase.from('pratos').update(payload).eq('id', editandoId)
      : await supabase.from('pratos').insert(payload);

    if (res.error) {
      console.error('Erro ao salvar prato:', res.error);
      alert('Erro ao salvar prato.');
      return;
    }

    limparFormulario();
    await carregarPratos();

    if (window.DashboardManager?.renderizarDashboard) {
      DashboardManager.renderizarDashboard();
    }
  }

  function renderizarPratos() {
    const tbody =
      document.getElementById('tabelaPratos') ||
      document.querySelector('#pratos table tbody') ||
      document.querySelector('tbody');

    if (!tbody) return;

    tbody.innerHTML = pratos.map(p => {
      const preco = Number(p.preco_venda || 0);
      const custo = Number(p.custo || 0);
      const cmv = preco > 0 ? ((custo / preco) * 100).toFixed(1) : '0.0';
      const margem = preco > 0 ? (100 - Number(cmv)).toFixed(1) : '0.0';

      return `
        <tr>
          <td>${p.nome_prato || ''}</td>
          <td>${p.grupo || ''}</td>
          <td>${p.item || ''}</td>
          <td>${Number(p.kg_por_prato || 0).toFixed(3)}</td>
          <td>${UIManager.BRL(preco)}</td>
          <td>${UIManager.BRL(custo)}</td>
          <td>${cmv}%</td>
          <td>${margem}%</td>
          <td>
            <div class="actions">
              <button class="btn-edit" onclick="PratosManager.editarPrato('${p.id}')">Editar</button>
              <button class="btn-red" onclick="PratosManager.excluirPrato('${p.id}')">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function editarPrato(id) {
    const p = pratos.find(item => String(item.id) === String(id));
    if (!p) return;

    editandoId = id;

    const campos = getCampos();

    if (campos.nome) campos.nome.value = p.nome_prato || '';
    if (campos.grupo) campos.grupo.value = p.grupo || 'Alimentos';
    if (campos.item) campos.item.value = p.item || '';
    if (campos.kg) campos.kg.value = p.kg_por_prato || '';
    if (campos.preco) campos.preco.value = p.preco_venda || '';
    if (campos.custo) campos.custo.value = p.custo || '';

    const btn = document.getElementById('btnSalvarPrato');
    if (btn) btn.textContent = 'Atualizar prato';
  }

  async function excluirPrato(id) {
    if (!confirm('Ocultar este prato?')) return;

    const supabase = SupabaseManager.getSupabaseClient();

    const { error } = await supabase
      .from('pratos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Erro ao ocultar prato:', error);
      alert('Erro ao ocultar prato.');
      return;
    }

    await carregarPratos();
  }

  function limparFormulario() {
    editandoId = null;

    const campos = getCampos();

    if (campos.nome) campos.nome.value = '';
    if (campos.item) campos.item.value = '';
    if (campos.kg) campos.kg.value = '';
    if (campos.preco) campos.preco.value = '';
    if (campos.custo) campos.custo.value = '';
    if (campos.grupo) campos.grupo.value = 'Alimentos';

    const btn = document.getElementById('btnSalvarPrato');
    if (btn) btn.textContent = 'Salvar prato';
  }

  function limparDados() {
    pratos = [];
    editandoId = null;
    renderizarPratos();
  }

  return {
    getPratos,
    carregarPratos,
    salvarPrato,
    renderizarPratos,
    editarPrato,
    excluirPrato,
    limparFormulario,
    limparDados
  };
})();

window.PratosManager = PratosManager;
window.salvarPrato = PratosManager.salvarPrato;
window.cancelarEdicao = PratosManager.limparFormulario;