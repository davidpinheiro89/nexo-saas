// Módulo de UI e utilitários do NEXO

// Formata valor em BRL
function BRL(val) {
  return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(val || 0);
}

// Converte string para número
function NUM(str) {
  const clean = String(str || '').replace(/[^\d.-]/g, '');
  return clean ? parseFloat(clean) : 0;
}

// Normaliza nome de item/proteína
function normalizarItem(nome) {
  return String(nome || '').trim().toLowerCase();
}

// Formata data para padrão brasileiro
function formatarData(data) {
  if (!data) return '';
  return new Date(data).toLocaleDateString('pt-BR');
}

// Inicializa abas de navegação
function inicializarAbas() {
  const mapa = [
    ['dashboard', 'Dashboard'],
    ['pratos', 'Cadastro de pratos'],
    ['vendas', 'Vendas'],
    ['inventario', 'Inventário'],
    ['engenharia', 'Engenharia'],
    ['dados', 'Dados / Backup'],
    ['admin', 'Admin Master']
  ];

  document.querySelectorAll('nav button').forEach(function(btn){
    const texto = (btn.textContent || '').trim();
    mapa.forEach(function(item){
      if(texto === item[1]){
        btn.setAttribute('data-tab', item[0]);
        btn.onclick = function(){ window.showTab(item[0], btn); };
      }
    });
  });

  // Garante que a aba dashboard fique ativa ao carregar
  const ativa = document.querySelector('main .section.active');
  if(!ativa){
    window.showTab('dashboard', document.querySelector('nav button[data-tab="dashboard"]'));
  } else {
    document.querySelectorAll('main .section').forEach(function(sec){
      sec.style.display = sec.classList.contains('active') ? 'block' : 'none';
    });
  }
}

// Inicializa eventos de login
function inicializarLogin() {
  const user = document.getElementById('loginUser');
  const pass = document.getElementById('loginPass');
  [user, pass].forEach(function(el){
    if(el){el.addEventListener('keydown', function(e){if(e.key === 'Enter') AuthManager.fazerLogin();});}
  });
}

// Define datas padrão para formulários
function aplicarDatasPadrao() {
  const hoje = new Date().toISOString().slice(0,10);
  const camposData = ['vendaDataInicio', 'vendaDataFim', 'invDataInicio', 'invDataFim'];
  camposData.forEach(id => {
    const campo = document.getElementById(id);
    if(campo && !campo.value) campo.value = hoje;
  });
}

// Mostra/oculta abas
window.showTab = function(id, btn){
  try{
    document.querySelectorAll('main .section').forEach(function(sec){
      sec.classList.remove('active');
      sec.style.display = 'none';
    });

    const alvo = document.getElementById(id);
    if(alvo){
      alvo.classList.add('active');
      alvo.style.display = 'block';
    }

    document.querySelectorAll('nav button').forEach(function(b){
      b.classList.remove('active');
    });

    if(btn){
      btn.classList.add('active');
    } else {
      const botao = document.querySelector('nav button[data-tab="' + id + '"]');
      if(botao) botao.classList.add('active');
    }

    if(typeof renderAll === 'function'){
      try { renderAll(); } catch(e){ console.warn('renderAll não impediu troca de aba:', e); }
    }
  }catch(e){
    console.error('Erro ao trocar aba:', e);
    alert('Erro ao abrir a aba. Veja o console para detalhes.');
  }
};

// Exporta funções para uso global
window.UIManager = {
  BRL,
  NUM,
  normalizarItem,
  formatarData,
  inicializarAbas,
  inicializarLogin,
  aplicarDatasPadrao
};
