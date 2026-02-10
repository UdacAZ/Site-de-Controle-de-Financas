/* ============================================================
   CONTROLE FINANCEIRO — AUTENTICAÇÃO (auth.js)

   Este arquivo contém a lógica da tela de login:
   - Alternância entre abas (Entrar / Criar Conta)
   - Toggle PF/PJ no cadastro
   - Cadastro de novos usuários no LocalStorage
   - Login com validação de credenciais
   - Redirecionamento para o dashboard após login

   NOTA: Este é um projeto de portfólio/estudo.
   Em produção, a autenticação deve ser feita no servidor
   com senhas criptografadas (bcrypt) e tokens seguros (JWT).
   ============================================================ */

// ==================== SELEÇÃO DE ELEMENTOS ====================

// Abas
const abas = document.querySelectorAll('.login-aba');

// Formulários
const formLogin = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');

// Campos do login
const loginEmail = document.getElementById('login-email');
const loginSenha = document.getElementById('login-senha');
const loginMensagem = document.getElementById('login-mensagem');

// Campos do cadastro (dados pessoais)
const cadastroNome = document.getElementById('cadastro-nome');
const cadastroEmail = document.getElementById('cadastro-email');
const cadastroSenha = document.getElementById('cadastro-senha');
const cadastroConfirmar = document.getElementById('cadastro-confirmar');
const cadastroMensagem = document.getElementById('cadastro-mensagem');

// Campos do cadastro (dados da empresa — apenas PJ)
const cadastroEmpresa = document.getElementById('cadastro-empresa');
const cadastroCnpj = document.getElementById('cadastro-cnpj');
const cadastroTipoEmpresa = document.getElementById('cadastro-tipo-empresa');

// Toggle PF/PJ
const cadastroTipoConta = document.getElementById('cadastro-tipo-conta');
const camposPj = document.getElementById('campos-pj');
const tipoContaBtns = document.querySelectorAll('.tipo-conta-btn');

// ==================== VERIFICAÇÃO INICIAL ====================
// Se o usuário já está logado, redireciona direto para o dashboard

(function verificarSessao() {
  var sessao = localStorage.getItem('sessao-usuario');
  if (sessao) {
    window.location.href = 'index.html';
  }
})();

// ==================== TOGGLE PF / PJ ====================

/**
 * Alterna entre Pessoa Física e Pessoa Jurídica no cadastro.
 * Mostra ou esconde os campos de empresa conforme o tipo selecionado.
 */
function alternarTipoConta(evento) {
  var tipo = evento.target.getAttribute('data-tipo');
  cadastroTipoConta.value = tipo;

  // Atualiza visual dos botões
  for (var i = 0; i < tipoContaBtns.length; i++) {
    tipoContaBtns[i].classList.remove('ativo');
  }
  evento.target.classList.add('ativo');

  // Mostra/esconde campos de empresa
  if (tipo === 'PJ') {
    camposPj.classList.remove('oculto');
    cadastroEmpresa.setAttribute('required', '');
    cadastroCnpj.setAttribute('required', '');
    cadastroTipoEmpresa.setAttribute('required', '');
  } else {
    camposPj.classList.add('oculto');
    cadastroEmpresa.removeAttribute('required');
    cadastroCnpj.removeAttribute('required');
    cadastroTipoEmpresa.removeAttribute('required');
    // Limpa campos PJ ao voltar para PF
    cadastroEmpresa.value = '';
    cadastroCnpj.value = '';
    cadastroTipoEmpresa.value = '';
  }
}

// ==================== LOCALSTORAGE DE USUÁRIOS ====================

/**
 * Carrega a lista de usuários cadastrados do LocalStorage.
 * Cada usuário é um objeto { nome, email, senha, tipoConta, empresa? }.
 */
function carregarUsuarios() {
  var dados = localStorage.getItem('usuarios');
  return dados ? JSON.parse(dados) : [];
}

/**
 * Salva a lista de usuários no LocalStorage.
 */
function salvarUsuarios(usuarios) {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

/**
 * Salva a sessão do usuário logado no LocalStorage.
 * Armazena nome, e-mail, tipo de conta e dados da empresa (se PJ).
 */
function criarSessao(usuario) {
  var sessao = {
    nome: usuario.nome,
    email: usuario.email,
    tipoConta: usuario.tipoConta || 'PJ'
  };

  // Apenas PJ tem dados de empresa
  if (usuario.empresa) {
    sessao.empresa = usuario.empresa;
  }

  localStorage.setItem('sessao-usuario', JSON.stringify(sessao));
}

// ==================== FORMATAÇÃO DE CNPJ ====================

/**
 * Aplica a máscara de CNPJ enquanto o usuário digita.
 * Formato: 00.000.000/0000-00
 */
function formatarCnpj(evento) {
  var valor = evento.target.value.replace(/\D/g, ''); // Remove não-dígitos
  if (valor.length > 14) valor = valor.substring(0, 14);

  // Aplica a máscara progressivamente
  if (valor.length > 12) {
    valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
  } else if (valor.length > 8) {
    valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
  } else if (valor.length > 5) {
    valor = valor.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{1,3})/, '$1.$2');
  }

  evento.target.value = valor;
}

/**
 * Validação visual simples do CNPJ.
 * Verifica apenas se tem 14 dígitos (não calcula dígitos verificadores).
 */
function validarCnpjSimples(cnpj) {
  var apenasDigitos = cnpj.replace(/\D/g, '');
  return apenasDigitos.length === 14;
}

// ==================== EXIBIR MENSAGENS ====================

/**
 * Exibe uma mensagem de erro ou sucesso no elemento informado.
 * @param {HTMLElement} elemento - O parágrafo de mensagem
 * @param {string} texto - Texto da mensagem
 * @param {string} tipo - 'erro' ou 'sucesso'
 */
function exibirMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  // Remove classes anteriores e aplica a nova
  elemento.classList.remove('erro', 'sucesso');
  elemento.classList.add(tipo);
}

/**
 * Limpa a mensagem de um elemento.
 */
function limparMensagem(elemento) {
  elemento.textContent = '';
  elemento.classList.remove('erro', 'sucesso');
}

// ==================== ALTERNAR ABAS ====================

/**
 * Alterna entre as abas "Entrar" e "Criar Conta".
 * Mostra o formulário correspondente e esconde o outro.
 */
function alternarAba(evento) {
  var abaSelecionada = evento.target.getAttribute('data-aba');

  // Atualiza visual das abas
  for (var i = 0; i < abas.length; i++) {
    abas[i].classList.remove('ativo');
  }
  evento.target.classList.add('ativo');

  // Mostra/esconde os formulários
  if (abaSelecionada === 'entrar') {
    formLogin.classList.remove('oculto');
    formCadastro.classList.add('oculto');
  } else {
    formLogin.classList.add('oculto');
    formCadastro.classList.remove('oculto');
  }

  // Limpa mensagens ao trocar de aba
  limparMensagem(loginMensagem);
  limparMensagem(cadastroMensagem);
}

// ==================== CADASTRO ====================

/**
 * Processa o cadastro de um novo usuário.
 * Valida campos pessoais e, se PJ, valida também os campos da empresa.
 */
function cadastrarUsuario(evento) {
  evento.preventDefault();

  // Dados pessoais
  var nome = cadastroNome.value.trim();
  var email = cadastroEmail.value.trim().toLowerCase();
  var senha = cadastroSenha.value;
  var confirmar = cadastroConfirmar.value;
  var tipoConta = cadastroTipoConta.value; // 'PF' ou 'PJ'

  // Validação: campos pessoais obrigatórios
  if (!nome || !email || !senha || !confirmar) {
    exibirMensagem(cadastroMensagem, 'Preencha todos os campos.', 'erro');
    return;
  }

  // Validação: senha mínima de 4 caracteres
  if (senha.length < 4) {
    exibirMensagem(cadastroMensagem, 'A senha deve ter no mínimo 4 caracteres.', 'erro');
    return;
  }

  // Validação: senhas devem ser iguais
  if (senha !== confirmar) {
    exibirMensagem(cadastroMensagem, 'As senhas não coincidem.', 'erro');
    return;
  }

  // Validações adicionais para PJ
  if (tipoConta === 'PJ') {
    var nomeEmpresa = cadastroEmpresa.value.trim();
    var cnpj = cadastroCnpj.value.trim();
    var tipoEmpresa = cadastroTipoEmpresa.value;

    if (!nomeEmpresa || !cnpj || !tipoEmpresa) {
      exibirMensagem(cadastroMensagem, 'Preencha todos os campos da empresa.', 'erro');
      return;
    }

    if (!validarCnpjSimples(cnpj)) {
      exibirMensagem(cadastroMensagem, 'CNPJ inválido. Deve conter 14 dígitos.', 'erro');
      return;
    }
  }

  // Carrega usuários existentes
  var usuarios = carregarUsuarios();

  // Verifica se o e-mail já está cadastrado
  var emailExiste = false;
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].email === email) {
      emailExiste = true;
      break;
    }
  }

  if (emailExiste) {
    exibirMensagem(cadastroMensagem, 'Este e-mail já está cadastrado.', 'erro');
    return;
  }

  // Cria o novo usuário
  var novoUsuario = {
    nome: nome,
    email: email,
    senha: senha,
    tipoConta: tipoConta
  };

  // Apenas PJ tem dados de empresa
  if (tipoConta === 'PJ') {
    novoUsuario.empresa = {
      nome: cadastroEmpresa.value.trim(),
      cnpj: cadastroCnpj.value.trim(),
      tipo: cadastroTipoEmpresa.value
    };
  }

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  // Mostra mensagem de sucesso
  exibirMensagem(cadastroMensagem, 'Conta criada com sucesso! Faça login.', 'sucesso');

  // Limpa o formulário de cadastro
  formCadastro.reset();
  // Reseta o toggle para PF
  cadastroTipoConta.value = 'PF';
  for (var j = 0; j < tipoContaBtns.length; j++) {
    tipoContaBtns[j].classList.remove('ativo');
  }
  tipoContaBtns[0].classList.add('ativo');
  camposPj.classList.add('oculto');

  // Após 1.5s, muda automaticamente para a aba de login
  setTimeout(function() {
    // Simula clique na aba "Entrar"
    abas[0].click();
    // Preenche o e-mail no campo de login para facilitar
    loginEmail.value = email;
    loginSenha.focus();
  }, 1500);
}

// ==================== LOGIN ====================

/**
 * Processa o login do usuário.
 * Verifica se o e-mail existe e se a senha está correta.
 */
function fazerLogin(evento) {
  evento.preventDefault();

  var email = loginEmail.value.trim().toLowerCase();
  var senha = loginSenha.value;

  // Validação básica
  if (!email || !senha) {
    exibirMensagem(loginMensagem, 'Preencha todos os campos.', 'erro');
    return;
  }

  // Busca o usuário pelo e-mail
  var usuarios = carregarUsuarios();
  var usuarioEncontrado = null;

  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].email === email) {
      usuarioEncontrado = usuarios[i];
      break;
    }
  }

  // E-mail não encontrado
  if (!usuarioEncontrado) {
    exibirMensagem(loginMensagem, 'E-mail ou senha incorretos.', 'erro');
    return;
  }

  // Senha incorreta
  if (usuarioEncontrado.senha !== senha) {
    exibirMensagem(loginMensagem, 'E-mail ou senha incorretos.', 'erro');
    return;
  }

  // Login bem-sucedido: cria sessão e redireciona
  criarSessao(usuarioEncontrado);
  exibirMensagem(loginMensagem, 'Login realizado! Redirecionando...', 'sucesso');

  setTimeout(function() {
    window.location.href = 'index.html';
  }, 800);
}

// ==================== EVENT LISTENERS ====================

// Abas: alternar entre Entrar e Criar Conta
for (var i = 0; i < abas.length; i++) {
  abas[i].addEventListener('click', alternarAba);
}

// Toggle PF/PJ
for (var j = 0; j < tipoContaBtns.length; j++) {
  tipoContaBtns[j].addEventListener('click', alternarTipoConta);
}

// Formulário de login
formLogin.addEventListener('submit', fazerLogin);

// Formulário de cadastro
formCadastro.addEventListener('submit', cadastrarUsuario);

// Máscara de CNPJ: formata enquanto digita
cadastroCnpj.addEventListener('input', formatarCnpj);
