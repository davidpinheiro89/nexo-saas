// Módulo de Administração Master do NEXO
let restaurantes = [];
let usuarios = [];
let editRestaurante = null;
let editUsuario = null;

// Verifica se usuário é admin master
async function verificarAdminMaster() {
  const supabase = SupabaseManager.getSupabaseClient();
  const usuarioLogado = SupabaseManager.getUsuarioLogado();
  
  if (!supabase || !usuarioLogado) return false;
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('auth_id', usuarioLogado.id)
    .single();
  
  if (error || !data) return false;
  
  return data.tipo === 'admin_master';
}

// Carrega todos os restaurantes
async function carregarRestaurantes() {
  const supabase = SupabaseManager.getSupabaseClient();
  
  if (!supabase) {
    console.error('Cliente Supabase não disponível');
    return;
  }

  const { data, error } = await supabase
    .from('restaurantes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar restaurantes:', error);
    throw error;
  }

  restaurantes = data || [];
}

// Carrega todos os usuários
async function carregarUsuarios() {
  const supabase = SupabaseManager.getSupabaseClient();
  
  if (!supabase) {
    console.error('Cliente Supabase não disponível');
    return;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('*, restaurantes(nome)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar usuários:', error);
    throw error;
  }

  usuarios = data || [];
}

// Salva restaurante (novo ou edição)
async function salvarRestaurante() {
  const supabase = SupabaseManager.getSupabaseClient();
  
  if (!supabase) {
    alert('Erro de conexão com o banco de dados.');
    return;
  }

  const nome = document.getElementById('restauranteNome')?.value?.trim();
  const email = document.getElementById('restauranteEmail')?.value?.trim();
  const telefone = document.getElementById('restauranteTelefone')?.value?.trim();
  const endereco = document.getElementById('restauranteEndereco')?.value?.trim();
  
  if (!nome || !email) {
    alert('Preencha nome e e-mail do restaurante.');
    return;
  }

  const restaurante = {
    nome,
    email,
    telefone,
    endereco,
    status: 'ativo'
  };

  const atual = editRestaurante !== null ? restaurantes[editRestaurante] : null;
  const res = atual && atual.id 
    ? await supabase.from('restaurantes').update(restaurante).eq('id', atual.id)
    : await supabase.from('restaurantes').insert(restaurante);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar restaurante: ' + res.error.message);
    return;
  }

  cancelarEdicaoRestaurante();
  await carregarRestaurantes();
  renderizarRestaurantes();
}

// Edita restaurante
function editarRestaurante(index) {
  editRestaurante = index;
  const r = restaurantes[index];
  
  document.getElementById('restauranteNome').value = r.nome || '';
  document.getElementById('restauranteEmail').value = r.email || '';
  document.getElementById('restauranteTelefone').value = r.telefone || '';
  document.getElementById('restauranteEndereco').value = r.endereco || '';
  
  document.getElementById('btnSalvarRestaurante').textContent = 'Atualizar';
  document.getElementById('btnCancelarRestaurante').style.display = 'inline-block';
}

// Cancela edição de restaurante
function cancelarEdicaoRestaurante() {
  editRestaurante = null;
  document.getElementById('restauranteNome').value = '';
  document.getElementById('restauranteEmail').value = '';
  document.getElementById('restauranteTelefone').value = '';
  document.getElementById('restauranteEndereco').value = '';
  
  document.getElementById('btnSalvarRestaurante').textContent = 'Adicionar';
  document.getElementById('btnCancelarRestaurante').style.display = 'none';
}

// Exclui restaurante
async function excluirRestaurante(index) {
  if (!confirm('Excluir este restaurante? Todos os dados associados serão perdidos.')) return;
  
  const supabase = SupabaseManager.getSupabaseClient();
  const r = restaurantes[index];
  
  if (r && r.id) {
    const { error } = await supabase.from('restaurantes').delete().eq('id', r.id);
    if (error) {
      console.error(error);
      alert('Erro ao excluir restaurante: ' + error.message);
      return;
    }
  }
  
  await carregarRestaurantes();
  renderizarRestaurantes();
}

// Renderiza tabela de restaurantes
function renderizarRestaurantes() {
  const tbody = document.getElementById('restaurantesTableBody');
  if (!tbody) return;

  tbody.innerHTML = restaurantes.map((r, i) => `
    <tr>
      <td>${r.nome || ''}</td>
      <td>${r.email || ''}</td>
      <td>${r.telefone || ''}</td>
      <td><span class="badge ${r.status === 'ativo' ? 'badge-success' : 'badge-danger'}">${r.status || ''}</span></td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="AdminManager.editarRestaurante(${i})">Editar</button>
          <button class="btn-primary" onclick="AdminManager.acessarRestaurante('${r.id}')">Acessar</button>
          <button class="btn-red" onclick="AdminManager.excluirRestaurante(${i})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Salva usuário (novo ou edição)
async function salvarUsuario() {
  const supabase = SupabaseManager.getSupabaseClient();
  
  if (!supabase) {
    alert('Erro de conexão com o banco de dados.');
    return;
  }

  const email = document.getElementById('usuarioEmail')?.value?.trim();
  const nome = document.getElementById('usuarioNome')?.value?.trim();
  const tipo = document.getElementById('usuarioTipo')?.value;
  const restauranteId = document.getElementById('usuarioRestaurante')?.value;
  
  if (!email || !nome || !tipo) {
    alert('Preencha e-mail, nome e tipo do usuário.');
    return;
  }

  if (tipo === 'cliente' && !restauranteId) {
    alert('Selecione um restaurante para usuários do tipo cliente.');
    return;
  }

  const usuario = {
    email,
    nome: nome,
    tipo,
    restaurante_id: tipo === 'cliente' ? restauranteId : null
  };

  const atual = editUsuario !== null ? usuarios[editUsuario] : null;
  const res = atual && atual.id 
    ? await supabase.from('usuarios').update(usuario).eq('id', atual.id)
    : await supabase.from('usuarios').insert(usuario);

  if (res.error) {
    console.error(res.error);
    alert('Erro ao salvar usuário: ' + res.error.message);
    return;
  }

  cancelarEdicaoUsuario();
  await carregarUsuarios();
  renderizarUsuarios();
}

// Edita usuário
function editarUsuario(index) {
  editUsuario = index;
  const u = usuarios[index];
  
  document.getElementById('usuarioEmail').value = u.email || '';
  document.getElementById('usuarioNome').value = u.nome || '';
  document.getElementById('usuarioTipo').value = u.tipo || '';
  document.getElementById('usuarioRestaurante').value = u.restaurante_id || '';
  
  // Mostrar/ocultar campo de restaurante baseado no tipo
  toggleRestauranteField();
  
  document.getElementById('btnSalvarUsuario').textContent = 'Atualizar';
  document.getElementById('btnCancelarUsuario').style.display = 'inline-block';
}

// Cancela edição de usuário
function cancelarEdicaoUsuario() {
  editUsuario = null;
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioNome').value = '';
  document.getElementById('usuarioTipo').value = '';
  document.getElementById('usuarioRestaurante').value = '';
  
  document.getElementById('btnSalvarUsuario').textContent = 'Adicionar';
  document.getElementById('btnCancelarUsuario').style.display = 'none';
}

// Exclui usuário
async function excluirUsuario(index) {
  if (!confirm('Excluir este usuário?')) return;
  
  const supabase = SupabaseManager.getSupabaseClient();
  const u = usuarios[index];
  
  if (u && u.id) {
    const { error } = await supabase.from('usuarios').delete().eq('id', u.id);
    if (error) {
      console.error(error);
      alert('Erro ao excluir usuário: ' + error.message);
      return;
    }
  }
  
  await carregarUsuarios();
  renderizarUsuarios();
}

// Renderiza tabela de usuários
function renderizarUsuarios() {
  const tbody = document.getElementById('usuariosTableBody');
  if (!tbody) return;

  tbody.innerHTML = usuarios.map((u, i) => `
    <tr>
      <td>${u.nome || ''}</td>
      <td>${u.email || ''}</td>
      <td><span class="badge ${u.tipo === 'admin_master' ? 'badge-danger' : 'badge-primary'}">${u.tipo || ''}</span></td>
      <td>${u.restaurantes?.nome || '-'}</td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="AdminManager.editarUsuario(${i})">Editar</button>
          <button class="btn-red" onclick="AdminManager.excluirUsuario(${i})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Atualiza select de restaurantes no formulário de usuário
function atualizarSelectRestaurantes() {
  const select = document.getElementById('usuarioRestaurante');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um restaurante</option>' + 
    restaurantes.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
}

// Mostra/oculta campo de restaurante baseado no tipo de usuário
function toggleRestauranteField() {
  const tipo = document.getElementById('usuarioTipo')?.value;
  const campo = document.getElementById('usuarioRestauranteField');
  
  if (campo) {
    campo.style.display = tipo === 'cliente' ? 'block' : 'none';
  }
}

// Acessa restaurante específico (simula login como restaurante)
async function acessarRestaurante(restauranteId) {
  if (!confirm('Acessar este restaurante? Você será redirecionado para a visão do cliente.')) return;
  
  // Aqui poderíamos implementar uma sessão admin que acessa restaurante específico
  // Por enquanto, apenas informamos
  alert('Funcionalidade de acesso direto ao restaurante será implementada com autenticação avançada.');
}

// Calcula métricas globais
function calcularMetricasGlobais() {
  const totalRestaurantes = restaurantes.length;
  const totalUsuarios = usuarios.length;
  const usuariosAdmin = usuarios.filter(u => u.tipo === 'admin_master').length;
  const usuariosClientes = usuarios.filter(u => u.tipo === 'cliente').length;
  const restaurantesAtivos = restaurantes.filter(r => r.status === 'ativo').length;

  return {
    totalRestaurantes,
    totalUsuarios,
    usuariosAdmin,
    usuariosClientes,
    restaurantesAtivos
  };
}

// Renderiza dashboard admin
function renderizarDashboardAdmin() {
  const metricas = calcularMetricasGlobais();
  
  document.getElementById('admin-kpi-restaurantes').innerHTML = `<span>Total de Restaurantes</span><strong>${metricas.totalRestaurantes}</strong>`;
  document.getElementById('admin-kpi-usuarios').innerHTML = `<span>Total de Usuários</span><strong>${metricas.totalUsuarios}</strong>`;
  document.getElementById('admin-kpi-admins').innerHTML = `<span>Admins Master</span><strong>${metricas.usuariosAdmin}</strong>`;
  document.getElementById('admin-kpi-clientes').innerHTML = `<span>Clientes</span><strong>${metricas.usuariosClientes}</strong>`;
  document.getElementById('admin-kpi-ativos').innerHTML = `<span>Restaurantes Ativos</span><strong>${metricas.restaurantesAtivos}</strong>`;
}

// Inicializa módulo admin
async function inicializarAdmin() {
  try {
    await Promise.all([
      carregarRestaurantes(),
      carregarUsuarios()
    ]);
    
    atualizarSelectRestaurantes();
    renderizarRestaurantes();
    renderizarUsuarios();
    renderizarDashboardAdmin();
  } catch (error) {
    console.error('Erro ao inicializar admin:', error);
  }
}

// Limpa dados do módulo
function limparDados() {
  restaurantes = [];
  usuarios = [];
  editRestaurante = null;
  editUsuario = null;
}

// Exporta funções para uso global
window.AdminManager = {
  verificarAdminMaster,
  carregarRestaurantes,
  carregarUsuarios,
  salvarRestaurante,
  editarRestaurante,
  cancelarEdicaoRestaurante,
  excluirRestaurante,
  renderizarRestaurantes,
  salvarUsuario,
  editarUsuario,
  cancelarEdicaoUsuario,
  excluirUsuario,
  renderizarUsuarios,
  atualizarSelectRestaurantes,
  toggleRestauranteField,
  acessarRestaurante,
  calcularMetricasGlobais,
  renderizarDashboardAdmin,
  inicializarAdmin,
  limparDados
};
