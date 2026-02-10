/* ============================================================
   GESTÃO EMPRESARIAL — FUNCIONÁRIOS (funcionarios.js)

   Este arquivo contém a lógica da página de funcionários:
   - CRUD de cargos (adicionar, remover, listar)
   - CRUD de funcionários (adicionar, remover, listar)
   - Regra de limite MEI (máximo 1 funcionário)
   - Máscara de CPF
   - Persistência no LocalStorage por usuário

   Depende do shared.js (carregado antes deste arquivo).
   ============================================================ */

// ==================== SELEÇÃO DE ELEMENTOS ====================

// Elementos de cargos
const formCargo = document.getElementById('form-cargo');
const inputCargo = document.getElementById('input-cargo');
const listaCargosEl = document.getElementById('lista-cargos');
const cargosVazio = document.getElementById('cargos-vazio');

// Elementos de funcionários
const formFuncionario = document.getElementById('form-funcionario');
const funcNome = document.getElementById('func-nome');
const funcCpf = document.getElementById('func-cpf');
const funcCargo = document.getElementById('func-cargo');
const funcVinculo = document.getElementById('func-vinculo');
const funcSalario = document.getElementById('func-salario');
const listaFuncionariosEl = document.getElementById('lista-funcionarios');
const funcionariosVazio = document.getElementById('funcionarios-vazio');
const contadorFuncionarios = document.getElementById('contador-funcionarios');
const limiteMeiEl = document.getElementById('limite-mei');

// ==================== ESTADO ====================

// Arrays de cargos e funcionários (por usuário)
let cargos = [];
let funcionarios = [];

// ==================== LOCALSTORAGE DE CARGOS ====================

function salvarCargosNoLS() {
  var chave = 'cargos-' + obterEmailUsuario();
  localStorage.setItem(chave, JSON.stringify(cargos));
}

function carregarCargosDoLS() {
  var chave = 'cargos-' + obterEmailUsuario();
  var dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : [];
}

// ==================== LOCALSTORAGE DE FUNCIONÁRIOS ====================

function salvarFuncionariosNoLS() {
  var chave = 'funcionarios-' + obterEmailUsuario();
  localStorage.setItem(chave, JSON.stringify(funcionarios));
}

function carregarFuncionariosDoLS() {
  var chave = 'funcionarios-' + obterEmailUsuario();
  var dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : [];
}

// ==================== CARGOS (CRUD) ====================

/**
 * Adiciona um novo cargo personalizado.
 * O cargo é salvo no LocalStorage e aparece no select de funcionários.
 */
function adicionarCargo(evento) {
  evento.preventDefault();

  var nomeCargo = inputCargo.value.trim();
  if (!nomeCargo) return;

  // Verifica se o cargo já existe (ignorando maiúsculas/minúsculas)
  var cargoExiste = false;
  for (var i = 0; i < cargos.length; i++) {
    if (cargos[i].nome.toLowerCase() === nomeCargo.toLowerCase()) {
      cargoExiste = true;
      break;
    }
  }

  if (cargoExiste) {
    alert('Este cargo já está cadastrado.');
    return;
  }

  var novoCargo = {
    id: gerarId(),
    nome: nomeCargo
  };

  cargos.push(novoCargo);
  salvarCargosNoLS();
  renderizarCargos();
  popularSelectCargos();

  // Limpa o campo
  inputCargo.value = '';
  inputCargo.focus();
}

/**
 * Remove um cargo pelo ID.
 */
function removerCargo(id) {
  cargos = cargos.filter(function(cargo) {
    return cargo.id !== id;
  });

  salvarCargosNoLS();
  renderizarCargos();
  popularSelectCargos();
}

/**
 * Renderiza a lista de cargos como tags/chips na tela.
 */
function renderizarCargos() {
  listaCargosEl.innerHTML = '';

  if (cargos.length === 0) {
    cargosVazio.classList.remove('oculto');
  } else {
    cargosVazio.classList.add('oculto');
  }

  for (var i = 0; i < cargos.length; i++) {
    var li = document.createElement('li');
    li.className = 'cargo-item';
    li.innerHTML =
      '<span>' + escapeHTML(cargos[i].nome) + '</span>' +
      '<button class="cargo-item__remover" data-cargo-id="' + cargos[i].id + '" title="Remover cargo">✕</button>';

    listaCargosEl.appendChild(li);
  }
}

/**
 * Popula o select de cargos no formulário de funcionários.
 */
function popularSelectCargos() {
  funcCargo.innerHTML = '<option value="">Selecione um cargo...</option>';

  for (var i = 0; i < cargos.length; i++) {
    var option = document.createElement('option');
    option.value = cargos[i].nome;
    option.textContent = cargos[i].nome;
    funcCargo.appendChild(option);
  }
}

// ==================== FUNCIONÁRIOS (CRUD) ====================

/**
 * Verifica se o limite de funcionários foi atingido para empresas MEI.
 * MEI: máximo de 1 funcionário. Outros tipos: ilimitado.
 */
function verificarLimiteMEI() {
  if (!dadosEmpresa) return false;

  if (dadosEmpresa.tipo === 'MEI' && funcionarios.length >= 1) {
    return true;
  }
  return false;
}

/**
 * Atualiza a interface do limite MEI:
 * - Mostra/esconde mensagem de limite
 * - Habilita/desabilita o formulário
 */
function atualizarLimiteMEI() {
  var limiteAtingido = verificarLimiteMEI();

  if (limiteAtingido) {
    limiteMeiEl.classList.remove('oculto');
    var campos = formFuncionario.querySelectorAll('input, select, button');
    for (var i = 0; i < campos.length; i++) {
      campos[i].disabled = true;
    }
  } else {
    limiteMeiEl.classList.add('oculto');
    var campos = formFuncionario.querySelectorAll('input, select, button');
    for (var i = 0; i < campos.length; i++) {
      campos[i].disabled = false;
    }
  }
}

/**
 * Atualiza o contador de funcionários exibido na tela.
 */
function atualizarContadorFuncionarios() {
  var total = funcionarios.length;

  if (dadosEmpresa && dadosEmpresa.tipo === 'MEI') {
    contadorFuncionarios.textContent = total + '/1 cadastrado' + (total !== 1 ? 's' : '');
  } else {
    contadorFuncionarios.textContent = total + ' cadastrado' + (total !== 1 ? 's' : '');
  }
}

/**
 * Aplica máscara de CPF enquanto o usuário digita.
 * Formato: 000.000.000-00
 */
function formatarCpf(evento) {
  var valor = evento.target.value.replace(/\D/g, '');
  if (valor.length > 11) valor = valor.substring(0, 11);

  if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (valor.length > 3) {
    valor = valor.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
  }

  evento.target.value = valor;
}

/**
 * Cadastra um novo funcionário.
 * Valida os campos, verifica limite MEI e salva.
 */
function adicionarFuncionario(evento) {
  evento.preventDefault();

  // Verifica limite MEI antes de tudo
  if (verificarLimiteMEI()) {
    alert('Limite de funcionários atingido para empresas MEI (máximo 1).');
    return;
  }

  var nome = funcNome.value.trim();
  var cpf = funcCpf.value.trim();
  var cargo = funcCargo.value;
  var vinculo = funcVinculo.value;
  var salario = parseFloat(funcSalario.value);

  // Validação: todos os campos preenchidos
  if (!nome || !cpf || !cargo || !vinculo || isNaN(salario) || salario <= 0) {
    alert('Preencha todos os campos do funcionário.');
    return;
  }

  // Validação simples do CPF (11 dígitos)
  var cpfDigitos = cpf.replace(/\D/g, '');
  if (cpfDigitos.length !== 11) {
    alert('CPF inválido. Deve conter 11 dígitos.');
    return;
  }

  var novoFuncionario = {
    id: gerarId(),
    nome: nome,
    cpf: cpf,
    cargo: cargo,
    vinculo: vinculo,
    salario: salario,
    data: new Date().toISOString()
  };

  funcionarios.push(novoFuncionario);
  salvarFuncionariosNoLS();
  renderizarFuncionarios();
  atualizarContadorFuncionarios();
  atualizarLimiteMEI();

  // Limpa o formulário
  formFuncionario.reset();
  funcNome.focus();
}

/**
 * Remove um funcionário pelo ID.
 */
function removerFuncionario(id) {
  if (!confirm('Deseja realmente remover este funcionário?')) {
    return;
  }

  funcionarios = funcionarios.filter(function(func) {
    return func.id !== id;
  });

  salvarFuncionariosNoLS();
  renderizarFuncionarios();
  atualizarContadorFuncionarios();
  atualizarLimiteMEI();
}

/**
 * Renderiza a lista de funcionários na tela.
 */
function renderizarFuncionarios() {
  listaFuncionariosEl.innerHTML = '';

  if (funcionarios.length === 0) {
    funcionariosVazio.classList.remove('oculto');
  } else {
    funcionariosVazio.classList.add('oculto');
  }

  for (var i = 0; i < funcionarios.length; i++) {
    var func = funcionarios[i];
    var li = document.createElement('li');
    li.className = 'func-item';

    var salarioTexto = func.salario ? formatarMoeda(func.salario) : '—';

    li.innerHTML =
      '<div class="func-item__info">' +
        '<span class="func-item__nome">' + escapeHTML(func.nome) + '</span>' +
        '<span class="func-item__detalhes">CPF: ' + escapeHTML(func.cpf) + ' | Salário: ' + salarioTexto + '</span>' +
        '<div class="func-item__tags">' +
          '<span class="func-tag func-tag--cargo">' + escapeHTML(func.cargo) + '</span>' +
          '<span class="func-tag func-tag--vinculo">' + escapeHTML(func.vinculo) + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn--remover" data-func-id="' + func.id + '" title="Remover funcionário">✕</button>';

    listaFuncionariosEl.appendChild(li);
  }
}

// ==================== EVENT LISTENERS ====================

// Formulário de cargos: adicionar cargo
formCargo.addEventListener('submit', adicionarCargo);

// Lista de cargos: delegação de eventos para remover
listaCargosEl.addEventListener('click', function(evento) {
  var botaoRemover = evento.target.closest('.cargo-item__remover');
  if (botaoRemover) {
    var id = botaoRemover.getAttribute('data-cargo-id');
    removerCargo(id);
  }
});

// Formulário de funcionários: adicionar funcionário
formFuncionario.addEventListener('submit', adicionarFuncionario);

// Lista de funcionários: delegação de eventos para remover
listaFuncionariosEl.addEventListener('click', function(evento) {
  var botaoRemover = evento.target.closest('.btn--remover');
  if (botaoRemover) {
    var id = botaoRemover.getAttribute('data-func-id');
    removerFuncionario(id);
  }
});

// Máscara de CPF: formata enquanto digita
funcCpf.addEventListener('input', formatarCpf);

// ==================== INICIALIZAÇÃO ====================

/**
 * Inicializa a página de funcionários:
 * 1. Executa inicialização compartilhada (saudação, empresa, tema)
 * 2. Carrega cargos e funcionários do LocalStorage
 * 3. Renderiza tudo na tela
 */
function inicializarFuncionarios() {
  // Bloqueia PF: redireciona para a página inicial
  bloquearAcessoPF();

  // Funções compartilhadas (shared.js)
  inicializarCompartilhado();

  // Carrega dados do LocalStorage
  cargos = carregarCargosDoLS();
  funcionarios = carregarFuncionariosDoLS();

  // Renderiza na tela
  renderizarCargos();
  popularSelectCargos();
  renderizarFuncionarios();
  atualizarContadorFuncionarios();
  atualizarLimiteMEI();
}

// Executa a inicialização
inicializarFuncionarios();
