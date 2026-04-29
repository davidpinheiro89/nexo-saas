// Módulo de Dashboard do NEXO
let chartPerda = null;

// Calcula métricas do dashboard
function calcularMetricas(pratos, vendas, inventario) {
  const totalReceita = vendas.reduce((s, v) => s + (v.receita || 0), 0);
  const totalVendido = vendas.reduce((s, v) => s + (v.quantidade || 0), 0);
  
  // Calcula desperdício
  let desperdicio = 0;
  const mapaConsumo = {};
  
  // Calcula consumo teórico por item
  vendas.forEach(v => {
    const prato = pratos.find(p => (p.nome || p.nome_prato) === v.prato);
    if (prato) {
      const item = prato.item;
      const consumo = prato.kg * v.quantidade;
      mapaConsumo[item] = (mapaConsumo[item] || 0) + consumo;
    }
  });
  
  // Calcula desperdício real
  inventario.forEach(i => {
    const consumoReal = i.inicial + i.compras - i.final;
    const consumoTeorico = mapaConsumo[i.item] || 0;
    const perda = Math.max(0, consumoReal - consumoTeorico);
    desperdicio += perda * i.custo_kg;
  });
  
  // Calcula CMV
  let cmv = 0;
  inventario.forEach(i => {
    const consumoReal = i.inicial + i.compras - i.final;
    cmv += consumoReal * i.custo_kg;
  });
  
  // Calcula margem
  const margem = totalReceita > 0 ? ((totalReceita - cmv) / totalReceita * 100) : 0;
  
  return {
    totalReceita,
    totalVendido,
    desperdicio,
    cmv,
    margem
  };
}

// Gera insights automáticos
function gerarInsights(metricas, pratos, vendas, inventario) {
  const insights = [];
  
  if (metricas.desperdicio > 0) {
    insights.push(`Desperdício estimado de ${UIManager.BRL(metricas.desperdicio)}. Verifique porcionamento e controle de estoque.`);
  }
  
  if (metricas.margem < 70) {
    insights.push(`Margem de ${metricas.margem.toFixed(1)}% abaixo do ideal. Considere revisar preços ou custos.`);
  } else {
    insights.push(`Margem de ${metricas.margem.toFixed(1)}% dentro do esperado.`);
  }
  
  if (metricas.cmv > 0 && metricas.totalReceita > 0) {
    const cmvPerc = (metricas.cmv / metricas.totalReceita * 100);
    if (cmvPerc > 40) {
      insights.push(`CMV de ${cmvPerc.toFixed(1)}% acima do recomendado (35%).`);
    }
  }
  
  // Encontra itens com maior desperdício
  const mapaPerda = {};
  const mapaConsumo = {};
  
  vendas.forEach(v => {
    const prato = pratos.find(p => (p.nome || p.nome_prato) === v.prato);
    if (prato) {
      const item = prato.item;
      const consumo = prato.kg * v.quantidade;
      mapaConsumo[item] = (mapaConsumo[item] || 0) + consumo;
    }
  });
  
  inventario.forEach(i => {
    const consumoReal = i.inicial + i.compras - i.final;
    const consumoTeorico = mapaConsumo[i.item] || 0;
    const perda = Math.max(0, consumoReal - consumoTeorico);
    if (perda > 0) {
      mapaPerda[i.item] = perda * i.custo_kg;
    }
  });
  
  const itensPerda = Object.entries(mapaPerda)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  if (itensPerda.length > 0) {
    insights.push(`Principais itens com desperdício: ${itensPerda.map(([item]) => item).join(', ')}`);
  }
  
  return insights;
}

// Renderiza dashboard
function renderizarDashboard() {
  const pratos = window.PratosManager ? window.PratosManager.getPratos() : [];
  const vendas = window.VendasManager ? window.VendasManager.getVendas() : [];
  const inventario = window.InventarioManager ? window.InventarioManager.getInventario() : [];
  
  const metricas = calcularMetricas(pratos, vendas, inventario);
  const insights = gerarInsights(metricas, pratos, vendas, inventario);
  
  // Atualiza KPIs
  document.getElementById('kpi-pratos').innerHTML = `<span>Total de Pratos</span><strong>${pratos.length}</strong>`;
  document.getElementById('kpi-vendas').innerHTML = `<span>Total Vendido</span><strong>${metricas.totalVendido}</strong>`;
  document.getElementById('kpi-receita').innerHTML = `<span>Receita Total</span><strong>${UIManager.BRL(metricas.totalReceita)}</strong>`;
  document.getElementById('kpi-desperdicio').innerHTML = `<span>Desperdício</span><strong>${UIManager.BRL(metricas.desperdicio)}</strong>`;
  document.getElementById('kpi-cmv').innerHTML = `<span>CMV</span><strong>${UIManager.BRL(metricas.cmv)}</strong>`;
  document.getElementById('kpi-margem').innerHTML = `<span>Margem</span><strong>${metricas.margem.toFixed(1)}%</strong>`;
  
  // Renderiza insights
  const insightsEl = document.getElementById('insights');
  if (insightsEl) {
    insightsEl.innerHTML = insights.map(i => `<div class="insight">${i}</div>`).join('');
  }
  
  // Renderiza gráfico de desperdício
  renderizarGraficoDesperdicio(pratos, vendas, inventario);
}

// Renderiza gráfico de desperdício por item
function renderizarGraficoDesperdicio(pratos, vendas, inventario) {
  const canvas = document.getElementById('chartPerda');
  if (!canvas) return;
  
  // Calcula desperdício por item
  const mapaConsumo = {};
  const mapaPerda = {};
  
  vendas.forEach(v => {
    const prato = pratos.find(p => (p.nome || p.nome_prato) === v.prato);
    if (prato) {
      const item = prato.item;
      const consumo = prato.kg * v.quantidade;
      mapaConsumo[item] = (mapaConsumo[item] || 0) + consumo;
    }
  });
  
  inventario.forEach(i => {
    const consumoReal = i.inicial + i.compras - i.final;
    const consumoTeorico = mapaConsumo[i.item] || 0;
    const perda = Math.max(0, consumoReal - consumoTeorico);
    if (perda > 0) {
      mapaPerda[i.item] = perda * i.custo_kg;
    }
  });
  
  const labels = Object.keys(mapaPerda);
  const data = Object.values(mapaPerda);
  
  // Destroi gráfico anterior se existir
  if (chartPerda) {
    chartPerda.destroy();
  }
  
  // Cria novo gráfico
  const ctx = canvas.getContext('2d');
  chartPerda = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Desperdício (R$)',
        data: data,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#f8fafc'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#f8fafc'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#f8fafc'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

// Exporta funções para uso global
window.DashboardManager = {
  calcularMetricas,
  gerarInsights,
  renderizarDashboard,
  renderizarGraficoDesperdicio
};
