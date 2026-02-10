/* ============================================================
   GESTÃO EMPRESARIAL — FUNÇÕES COMPARTILHADAS (shared.js)

   Este arquivo contém funções usadas em todas as páginas:
   - Proteção de rota (autenticação)
   - Controle de acesso PF/PJ
   - Alternância de tema claro/escuro
   - Saudação e logout
   - Dados da empresa
   - Funções utilitárias (formatação, escape, ID)

   Carregado por todas as páginas protegidas (index, funcionários, financeiro).
   ============================================================ */

// ==================== PROTEÇÃO DE ROTA ====================
// Se não há sessão ativa, redireciona para a tela de login
(function verificarAutenticacao() {
  var sessao = localStorage.getItem('sessao-usuario');
  if (!sessao) {
    window.location.href = 'login.html';
  }
})();

// ==================== SELEÇÃO DE ELEMENTOS COMUNS ====================

const btnTema = document.getElementById('btn-tema');
const btnLogout = document.getElementById('btn-logout');
const saudacaoUsuario = document.getElementById('saudacao-usuario');

// Elementos da empresa (podem não existir em todas as páginas)
const empresaNomeEl = document.getElementById('empresa-nome');
const empresaCnpjEl = document.getElementById('empresa-cnpj');
const empresaTipoEl = document.getElementById('empresa-tipo');

// ==================== ESTADO COMPARTILHADO ====================

// Dados da empresa (carregados da sessão)
let dadosEmpresa = null;

// ==================== CONTROLE DE ACESSO PF/PJ ====================

/**
 * Retorna o tipo de conta do usuário logado ('PF' ou 'PJ').
 * Usuários antigos (sem tipoConta) são tratados como PJ para compatibilidade.
 */
function obterTipoConta() {
  var sessao = localStorage.getItem('sessao-usuario');
  if (sessao) {
    var dados = JSON.parse(sessao);
    return dados.tipoConta || 'PJ';
  }
  return 'PJ';
}

/**
 * Verifica se o usuário é Pessoa Física.
 */
function ehPessoaFisica() {
  return obterTipoConta() === 'PF';
}

/**
 * Aplica o controle de acesso na navegação.
 * Remove o link de Funcionários para PF e esconde seções de empresa.
 */
function aplicarControleAcesso() {
  var tipoConta = obterTipoConta();

  // Esconde/mostra links de Funcionários no nav
  var navLinks = document.querySelectorAll('.nav__link');
  for (var i = 0; i < navLinks.length; i++) {
    if (navLinks[i].getAttribute('href') === 'funcionarios.html') {
      navLinks[i].style.display = tipoConta === 'PF' ? 'none' : '';
    }
  }

  // Esconde/mostra cards de navegação para Funcionários (página inicial)
  var navCards = document.querySelectorAll('.nav-card');
  for (var j = 0; j < navCards.length; j++) {
    if (navCards[j].getAttribute('href') === 'funcionarios.html') {
      navCards[j].style.display = tipoConta === 'PF' ? 'none' : '';
    }
  }

  // Esconde seção Dados da Empresa para PF (não tem empresa)
  var secaoEmpresa = document.querySelector('.empresa');
  if (secaoEmpresa) {
    secaoEmpresa.style.display = tipoConta === 'PF' ? 'none' : '';
  }
}

/**
 * Bloqueia o acesso à página de Funcionários para PF.
 * Redireciona de volta para o index.
 */
function bloquearAcessoPF() {
  if (ehPessoaFisica()) {
    window.location.href = 'index.html';
  }
}

// ==================== LOCALSTORAGE ====================

/**
 * Salva a preferência de tema (claro/escuro) no LocalStorage.
 */
function salvarTema(escuro) {
  localStorage.setItem('tema-escuro', JSON.stringify(escuro));
}

/**
 * Carrega a preferência de tema do LocalStorage.
 */
function carregarTema() {
  const tema = localStorage.getItem('tema-escuro');
  return tema ? JSON.parse(tema) : false;
}

// ==================== CHAVE POR USUÁRIO ====================

/**
 * Retorna o e-mail do usuário logado para criar chaves únicas no LocalStorage.
 * Cada usuário tem seus próprios dados separados.
 */
function obterEmailUsuario() {
  var sessao = localStorage.getItem('sessao-usuario');
  if (sessao) {
    return JSON.parse(sessao).email;
  }
  return '';
}

// ==================== FORMATAÇÃO ====================

/**
 * Formata um número para o padrão monetário brasileiro.
 * Exemplo: 1500.50 → "R$ 1.500,50"
 */
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Formata uma data ISO para o padrão brasileiro legível.
 * Exemplo: "2026-02-06T14:30:00" → "06/02/2026 às 14:30"
 */
function formatarDataHora(dataISO) {
  var data = new Date(dataISO);
  var dia = String(data.getDate()).padStart(2, '0');
  var mes = String(data.getMonth() + 1).padStart(2, '0');
  var ano = data.getFullYear();
  var horas = String(data.getHours()).padStart(2, '0');
  var minutos = String(data.getMinutes()).padStart(2, '0');

  return dia + '/' + mes + '/' + ano + ' às ' + horas + ':' + minutos;
}

// ==================== GERAR ID ÚNICO ====================

/**
 * Gera um ID único para cada registro.
 * Usa timestamp + número aleatório para evitar duplicatas.
 */
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// ==================== ESCAPE HTML ====================

/**
 * Protege contra injeção de HTML escapando caracteres especiais.
 * Importante para segurança ao inserir texto digitado pelo usuário.
 */
function escapeHTML(texto) {
  var div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ==================== EMPRESA ====================

/**
 * Carrega os dados da empresa do usuário logado da sessão.
 */
function carregarEmpresa() {
  var sessao = localStorage.getItem('sessao-usuario');
  if (sessao) {
    var usuario = JSON.parse(sessao);
    dadosEmpresa = usuario.empresa || null;
  }
}

/**
 * Exibe os dados da empresa nos campos da seção (se existirem na página).
 */
function exibirEmpresa() {
  if (!dadosEmpresa) return;

  if (empresaNomeEl) empresaNomeEl.textContent = dadosEmpresa.nome;
  if (empresaCnpjEl) empresaCnpjEl.textContent = dadosEmpresa.cnpj;
  if (empresaTipoEl) empresaTipoEl.textContent = dadosEmpresa.tipo;
}

// ==================== AUTENTICAÇÃO (Logout e Saudação) ====================

/**
 * Exibe o nome do usuário logado no header.
 */
function exibirSaudacao() {
  var sessao = localStorage.getItem('sessao-usuario');
  if (sessao && saudacaoUsuario) {
    var usuario = JSON.parse(sessao);
    saudacaoUsuario.textContent = 'Olá, ' + usuario.nome;
  }
}

/**
 * Encerra a sessão do usuário e redireciona para o login.
 */
function fazerLogout() {
  if (!confirm('Deseja realmente sair?')) {
    return;
  }
  localStorage.removeItem('sessao-usuario');
  window.location.href = 'login.html';
}

// ==================== TEMA CLARO / ESCURO ====================

/**
 * Alterna entre modo claro e escuro.
 */
function alternarTema() {
  var estaEscuro = document.body.classList.toggle('tema-escuro');
  btnTema.textContent = estaEscuro ? '☀️ Modo Claro' : '🌙 Modo Escuro';
  salvarTema(estaEscuro);

  // Dispara evento customizado para que páginas específicas possam reagir
  window.dispatchEvent(new Event('tema-alterado'));
}

/**
 * Aplica o tema salvo ao carregar a página.
 */
function aplicarTemaSalvo() {
  var temaEscuro = carregarTema();
  if (temaEscuro) {
    document.body.classList.add('tema-escuro');
    if (btnTema) btnTema.textContent = '☀️ Modo Claro';
  }
}

// ==================== EVENT LISTENERS COMUNS ====================

// Botão de tema: alterna claro/escuro
if (btnTema) btnTema.addEventListener('click', alternarTema);

// Botão "Sair": encerra a sessão
if (btnLogout) btnLogout.addEventListener('click', fazerLogout);

// ==================== INICIALIZAÇÃO COMPARTILHADA ====================

/**
 * Inicializa as funcionalidades comuns a todas as páginas.
 * Cada página chama esta função no início e depois executa sua lógica própria.
 */
function inicializarCompartilhado() {
  exibirSaudacao();
  carregarEmpresa();
  exibirEmpresa();
  aplicarTemaSalvo();
  aplicarControleAcesso();
}
