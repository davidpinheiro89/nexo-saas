// Módulo de UI e utilitários do NEXO
const CLIENTE_NEXO = {
  restaurante: 'Restaurante Cliente',
  usuario: 'Usuário'
};

// Formatação de valores
const BRL = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const NUM = v => Number(String(v ?? 0).replace(',', '.')) || 0;

// Funções de texto
const texto = v => String(v || '').trim();
const normalizarItem = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

// Aplica datas padrão nos formulários
function aplicarDatasPadrao() {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  
  if (document.getElementById('vendaDataInicio') && !vendaDataInicio.value) {
    vendaDataInicio.value = hojeStr;
  }
  if (document.getElementById('vendaDataFim') && !vendaDataFim.value) {
    vendaDataFim.value = hojeStr;
  }
  if (document.getElementById('invDataInicio') && !invDataInicio.value) {
    invDataInicio.value = hojeStr;
  }
  if (document.getElementById('invDataFim') && !invDataFim.value) {
    invDataFim.value = hojeStr;
  }
}

// Atualiza informações do cliente na UI
function atualizarInfoCliente(dados) {
  CLIENTE_NEXO.restaurante = dados.restaurante;
  CLIENTE_NEXO.usuario = dados.usuario;
  
  const nomeRestauranteTopo = document.getElementById('nomeRestauranteTopo');
  if (nomeRestauranteTopo) {
    nomeRestauranteTopo.textContent = CLIENTE_NEXO.restaurante;
  }
}

// Aplica informações do cliente nos elementos
function aplicarCliente() {
  const nomeRestauranteTopo = document.getElementById('nomeRestauranteTopo');
  if (nomeRestauranteTopo) {
    nomeRestauranteTopo.textContent = CLIENTE_NEXO.restaurante;
  }
}

// Sistema de abas
function showTab(id, btn) {
  try {
    document.querySelectorAll('main .section').forEach(function(sec) {
      sec.classList.remove('active');
      sec.style.display = 'none';
    });

    const alvo = document.getElementById(id);
    if (alvo) {
      alvo.classList.add('active');
      alvo.style.display = 'block';
    }

    document.querySelectorAll('nav button').forEach(function(b) {
      b.classList.remove('active');
    });

    if (btn) {
      btn.classList.add('active');
    } else {
      const botao = document.querySelector('nav button[data-tab="' + id + '"]');
      if (botao) botao.classList.add('active');
    }

    // Renderiza dados da aba se existir
    if (typeof renderAll === 'function') {
      try { renderAll(); } catch (e) { console.warn('renderAll não impediu troca de aba:', e); }
    }
  } catch (e) {
    console.error('Erro ao trocar aba:', e);
    alert('Erro ao abrir a aba. Veja o console para detalhes.');
  }
}

// Inicializa abas
function inicializarAbas() {
  const mapa = [
    ['dashboard', 'Dashboard'],
    ['pratos', 'Cadastro de pratos'],
    ['vendas', 'Vendas'],
    ['inventario', 'Inventário'],
    ['engenharia', 'Engenharia'],
    ['dados', 'Dados / Backup']
  ];

  document.querySelectorAll('nav button').forEach(function(btn) {
    const texto = (btn.textContent || '').trim();
    mapa.forEach(function(item) {
      if (texto === item[1]) {
        btn.setAttribute('data-tab', item[0]);
        btn.onclick = function() { showTab(item[0], btn); };
      }
    });
  });

  // Garante que a aba dashboard fique ativa ao carregar
  const ativa = document.querySelector('main .section.active');
  if (!ativa) {
    showTab('dashboard', document.querySelector('nav button[data-tab="dashboard"]'));
  } else {
    document.querySelectorAll('main .section').forEach(function(sec) {
      sec.style.display = sec.classList.contains('active') ? 'block' : 'none';
    });
  }
}

// Inicializa eventos do login
function inicializarLogin() {
  const user = document.getElementById('loginUser');
  const pass = document.getElementById('loginPass');
  
  [user, pass].forEach(function(el) {
    if (el) {
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          if (window.AuthManager) {
            AuthManager.fazerLogin();
          }
        }
      });
    }
  });
}

// Exporta funções e objetos para uso global
window.UIManager = {
  BRL,
  NUM,
  texto,
  normalizarItem,
  aplicarDatasPadrao,
  atualizarInfoCliente,
  aplicarCliente,
  showTab,
  inicializarAbas,
  inicializarLogin,
  CLIENTE_NEXO
};
