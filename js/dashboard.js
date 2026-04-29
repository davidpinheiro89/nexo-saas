// Módulo de Dashboard do NEXO
let chartPerda = null;

// Calcula métricas do dashboard
function calcularMetricas(pratos, vendas, inventario) {
  const totalPratos = pratos.length;
  const totalVendas = vendas.reduce((sum, v) => sum + (v.quantidade || 0), 0);
  const totalReceita = vendas.reduce((sum, v) => sum + (v.receita || 0), 0);
  
  // Calcula desperdício
  const desperdicio = calcularDesperdicio(pratos, vendas, inventario);
  
  // Calcula CMV (Custo Mercadoria Vendida)
  const cmv = calcularCMV(vendas, inventario);
  
  return {
    totalPratos,
    totalVendas,
    totalReceita,
    desperdicio,
    cmv,
    margem: totalReceita > 0 ? ((totalReceita - cmv) / totalReceita * 100) : 0
  };
}

// Calcula desperdício de alimentos
function calcularDesperdicio(pratos, vendas, inventario) {
  const consumoPorItem = {};
  
  // Calcula consumo total por item
  pratos.forEach(prato => {
    const vendasPrato = vendas.filter(v => v.prato === prato.nome);
    const totalVendas = vendasPrato.reduce((sum, v) => sum + (v.quantidade || 0), 0);
    const consumoTotal = totalVendas * (prato.kg || 0);
    
    if (!consumoPorItem[prato.item]) {
      consumoPorItem[prato.item] = 0;
    }
    consumoPorItem[prato.item] += consumoTotal;
  });
  
  // Calcula desperdício comparando com inventário
  let desperdicioTotal = 0;
  inventario.forEach(item => {
    const consumo = consumoPorItem[item.item] || 0;
    const disponivel = (item.inicial || 0) + (item.compras || 0);
    const desperdicio = Math.max(0, disponivel - consumo - (item.final || 0));
    desperdicioTotal += desperdicio * (item.custo_kg || 0);
  });
  
  return desperdicioTotal;
}

// Calcula CMV
function calcularCMV(vendas, inventario) {
  const custoPorItem = {};
  
  // Obtém custo por kg do inventário
  inventario.forEach(item => {
    custoPorItem[item.item] = item.custo_kg || 0;
  });
  
  // Calcula CMV total
  let cmvTotal = 0;
  const pratosVendidos = {};
  
  // Agrupa vendas por prato
  vendas.forEach(venda => {
    if (!pratosVendidos[venda.prato]) {
      pratosVendidos[venda.prato] = 0;
    }
    pratosVendidos[venda.prato] += venda.quantidade || 0;
  });
  
  // Calcula CMV por prato (precisa dos dados de pratos)
  if (window.PratosManager) {
    const pratos = window.PratosManager.getPratos();
    Object.entries(pratosVendidos).forEach(([nomePrato, quantidade]) => {
      const prato = pratos.find(p => p.nome === nomePrato);
      if (prato && custoPorItem[prato.item]) {
        cmvTotal += quantidade * (prato.kg || 0) * custoPorItem[prato.item];
      }
    });
  }
  
  return cmvTotal;
}

// Renderiza KPIs do dashboard
function renderizarKPIs(metricas) {
  const kpis = [
    { id: 'kpi-pratos', label: 'Total de Pratos', valor: metricas.totalPratos },
    { id: 'kpi-vendas', label: 'Total Vendido', valor: metricas.totalVendas },
    { id: 'kpi-receita', label: 'Receita Total', valor: UIManager.BRL(metricas.totalReceita) },
    { id: 'kpi-desperdicio', label: 'Desperdício', valor: UIManager.BRL(metricas.desperdicio) },
    { id: 'kpi-cmv', label: 'CMV', valor: UIManager.BRL(metricas.cmv) },
    { id: 'kpi-margem', label: 'Margem', valor: metricas.margem.toFixed(1) + '%' }
  ];
  
  kpis.forEach(kpi => {
    const elemento = document.getElementById(kpi.id);
    if (elemento) {
      elemento.innerHTML = `<span>${kpi.label}</span><strong>${kpi.valor}</strong>`;
    }
  });
}

// Renderiza gráfico de desperdício
function renderizarGraficoDesperdicio(pratos, vendas, inventario) {
  const ctx = document.getElementById('chartPerda');
  if (!ctx) return;
  
  const desperdicioPorItem = {};
  const consumoPorItem = {};
  
  // Calcula consumo por item
  pratos.forEach(prato => {
    const vendasPrato = vendas.filter(v => v.prato === prato.nome);
    const totalVendas = vendasPrato.reduce((sum, v) => sum + (v.quantidade || 0), 0);
    const consumoTotal = totalVendas * (prato.kg || 0);
    
    if (!consumoPorItem[prato.item]) {
      consumoPorItem[prato.item] = 0;
    }
    consumoPorItem[prato.item] += consumoTotal;
  });
  
  // Calcula desperdício por item
  inventario.forEach(item => {
    const consumo = consumoPorItem[item.item] || 0;
    const disponivel = (item.inicial || 0) + (item.compras || 0);
    const desperdicio = Math.max(0, disponivel - consumo - (item.final || 0));
    desperdicioPorItem[item.item] = desperdicio;
  });
  
  // Prepara dados para o gráfico
  const labels = Object.keys(desperdicioPorItem);
  const data = Object.values(desperdicioPorItem);
  
  if (chartPerda) {
    chartPerda.destroy();
  }
  
  chartPerda = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Desperdício (kg)',
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
          labels: { color: '#fff' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff' }
        },
        y: {
          ticks: { color: '#fff' }
        }
      }
    }
  });
}

// Gera insights automáticos
function gerarInsights(metricas, pratos, vendas, inventario) {
  const insights = [];
  
  // Insight sobre desperdício
  if (metricas.desperdicio > metricas.totalReceita * 0.05) {
    insights.push('⚠️ Desperdício acima de 5% da receita. Reveja o controle de porções.');
  }
  
  // Insight sobre margem
  if (metricas.margem < 30) {
    insights.push('📉 Margem abaixo de 30%. Considere revisar custos ou preços.');
  }
  
  // Insight sobre pratos mais vendidos
  const vendasPorPrato = {};
  vendas.forEach(v => {
    if (!vendasPorPrato[v.prato]) vendasPorPrato[v.prato] = 0;
    vendasPorPrato[v.prato] += v.quantidade || 0;
  });
  
  const maisVendido = Object.entries(vendasPorPrato)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (maisVendido) {
    insights.push(`🏆 Mais vendido: ${maisVendido[0]} (${maisVendido[1]} unidades)`);
  }
  
  return insights;
}

// Renderiza insights
function renderizarInsights(insights) {
  const container = document.getElementById('insights');
  if (!container) return;
  
  container.innerHTML = insights.map(insight => 
    `<div class="insight">${insight}</div>`
  ).join('');
}

// Renderiza dashboard completo
function renderizarDashboard() {
  const pratos = window.PratosManager ? window.PratosManager.getPratos() : [];
  const vendas = window.VendasManager ? window.VendasManager.getVendas() : [];
  const inventario = window.InventarioManager ? window.InventarioManager.getInventario() : [];
  
  const metricas = calcularMetricas(pratos, vendas, inventario);
  
  renderizarKPIs(metricas);
  renderizarGraficoDesperdicio(pratos, vendas, inventario);
  
  const insights = gerarInsights(metricas, pratos, vendas, inventario);
  renderizarInsights(insights);
}

// Exporta funções para uso global
window.DashboardManager = {
  renderizarDashboard,
  calcularMetricas,
  gerarInsights
};
