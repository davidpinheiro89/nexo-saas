const PratosManager = (() => {
  let pratos = [];
  let editandoId = null;

  function getPratos() {
    return pratos;
  }

  function num(v) {
    return Number(String(v || '').replace(',', '.')) || 0;
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

    const nome = document.getElementById('nomePrato')?.value?.trim();
    const grupo = document.getElementById('grupoPrato')?.value || '';
    const item = document.getElementById('itemProteina')?.value?.trim();
    const kg = num(document.getElementById('kgPrato')?.value);
    const preco = num(document.getElementById('precoVenda')?.value);
    const custo = num(document.getElementById('custoPrato')?.value);

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
    const tbody = document.getElementById('tabelaPratos');
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

    document.getElementById('nomePrato').value = p.nome_prato || '';
    document.getElementById('grupoPrato').value = p.grupo || '';
    document.getElementById('itemProteina').value = p.item || '';
    document.getElementById('kgPrato').value = p.kg_por_prato || '';
    document.getElementById('precoVenda').value = p.preco_venda || '';
    document.getElementById('custoPrato').value = p.custo || '';

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

    const campos = ['nomePrato', 'itemProteina', 'kgPrato', 'precoVenda', 'custoPrato'];
    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const grupo = document.getElementById('grupoPrato');
    if (grupo) grupo.value = 'Alimentos';

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