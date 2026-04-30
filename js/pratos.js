const PratosManager = {
  pratos: [],
  editandoId: null,

  async carregarPratos() {
    try {
      const restauranteId = SupabaseManager.getRestauranteId();

      const { data, error } = await SupabaseManager.client
        .from('pratos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.pratos = data || [];
      this.renderizarTabela();

    } catch (err) {
      console.error('Erro ao carregar pratos:', err);
    }
  },

  renderizarTabela() {
    const tbody = document.getElementById('tabelaPratos');

    if (!tbody) return;

    tbody.innerHTML = '';

    this.pratos.forEach(prato => {
      const preco = Number(prato.preco_venda || 0);
      const custo = Number(prato.custo || prato.custo_prato || 0);

      const cmv = preco > 0
        ? ((custo / preco) * 100).toFixed(1)
        : 0;

      const margem = (100 - cmv).toFixed(1);

      tbody.innerHTML += `
        <tr>
          <td>${prato.nome_prato || '-'}</td>
          <td>${prato.grupo || '-'}</td>
          <td>${prato.item || prato.item_proteina || '-'}</td>
          <td>${Number(prato.kg_por_prato || 0).toFixed(3)}</td>
          <td>R$ ${preco.toFixed(2)}</td>
          <td>R$ ${custo.toFixed(2)}</td>
          <td>${cmv}%</td>
          <td>${margem}%</td>
          <td>
            <button onclick="PratosManager.editarPrato(${prato.id})">
              Editar
            </button>

            <button onclick="PratosManager.excluirPrato(${prato.id})">
              Excluir
            </button>
          </td>
        </tr>
      `;
    });
  },

  async salvarPrato() {
    try {
      const restauranteId = SupabaseManager.getRestauranteId();

      const nome = document.getElementById('nomePrato').value;
      const grupo = document.getElementById('grupoPrato').value;
      const item = document.getElementById('itemProteina').value;
      const kg = parseFloat(
        document.getElementById('kgPrato').value.replace(',', '.')
      );

      const preco = parseFloat(
        document.getElementById('precoVenda').value.replace(',', '.')
      );

      const custo = parseFloat(
        document.getElementById('custoPrato').value.replace(',', '.')
      );

      const payload = {
        restaurante_id: restauranteId,
        nome_prato: nome,
        grupo: grupo,
        item: item,
        kg_por_prato: kg,
        preco_venda: preco,
        custo: custo,
        ativo: true
      };

      let response;

      if (this.editandoId) {
        response = await SupabaseManager.client
          .from('pratos')
          .update(payload)
          .eq('id', this.editandoId);

      } else {
        response = await SupabaseManager.client
          .from('pratos')
          .insert([payload]);
      }

      if (response.error) throw response.error;

      this.limparFormulario();

      await this.carregarPratos();

      if (window.VendasManager?.atualizarSelectPratos) {
        await window.VendasManager.atualizarSelectPratos();
      }

    } catch (err) {
      console.error('Erro ao salvar prato:', err);
      alert('Erro ao salvar prato');
    }
  },

  editarPrato(id) {
    const prato = this.pratos.find(p => p.id === id);

    if (!prato) return;

    this.editandoId = id;

    document.getElementById('nomePrato').value =
      prato.nome_prato || '';

    document.getElementById('grupoPrato').value =
      prato.grupo || '';

    document.getElementById('itemProteina').value =
      prato.item || '';

    document.getElementById('kgPrato').value =
      prato.kg_por_prato || '';

    document.getElementById('precoVenda').value =
      prato.preco_venda || '';

    document.getElementById('custoPrato').value =
      prato.custo || '';
  },

  async excluirPrato(id) {
    const confirmar = confirm(
      'Deseja ocultar este prato?'
    );

    if (!confirmar) return;

    try {
      const { error } = await SupabaseManager.client
        .from('pratos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      await this.carregarPratos();

      if (window.VendasManager?.atualizarSelectPratos) {
        await window.VendasManager.atualizarSelectPratos();
      }

    } catch (err) {
      console.error('Erro ao excluir prato:', err);
    }
  },

  limparFormulario() {
    this.editandoId = null;

    document.getElementById('nomePrato').value = '';
    document.getElementById('grupoPrato').value = 'Alimentos';
    document.getElementById('itemProteina').value = '';
    document.getElementById('kgPrato').value = '';
    document.getElementById('precoVenda').value = '';
    document.getElementById('custoPrato').value = '';
  }
};

window.PratosManager = PratosManager;