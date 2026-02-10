/* ============================================================
   GESTÃO EMPRESARIAL — FINANCEIRO (financeiro.js)

   Este arquivo contém a lógica da página financeira:
   - Cadastro de entradas e saídas (CRUD)
   - Cálculo do resumo financeiro
   - Gráfico de rosca (Canvas HTML5)
   - Filtros por tipo de movimentação
   - Persistência no LocalStorage

   Depende do shared.js (carregado antes deste arquivo).
   ============================================================ */

// ==================== SELEÇÃO DE ELEMENTOS ====================

const formTransacao = document.getElementById('form-transacao');
const inputDescricao = document.getElementById('descricao');
const inputValor = document.getElementById('valor');
const selectTipo = document.getElementById('tipo');

// Elementos do select de funcionário (saída de salário)
const grupoFuncionario = document.getElementById('grupo-funcionario');
const selectFuncionario = document.getElementById('select-funcionario');

const listaTransacoes = document.getElementById('lista-transacoes');
const mensagemVazia = document.getElementById('lista-vazia');

const totalEntradasEl = document.getElementById('total-entradas');
const totalSaidasEl = document.getElementById('total-saidas');
const saldoFinalEl = document.getElementById('saldo-final');

const btnLimpar = document.getElementById('btn-limpar');

// Elementos dos gráficos
const canvasRosca = document.getElementById('grafico-rosca');
const legendaRosca = document.getElementById('legenda-rosca');
const graficosContainer = document.querySelector('.graficos__container');
const graficosVazio = document.getElementById('graficos-vazio');

// Botões de filtro
const btnsFiltro = document.querySelectorAll('[data-filtro]');

// ==================== ESTADO ====================

// Array que armazena todas as transações (carregado do LocalStorage)
let transacoes = [];

// Filtro atualmente ativo ('todas', 'entrada' ou 'saida')
let filtroAtual = 'todas';

// ==================== LOCALSTORAGE ====================

/**
 * Salva o array de transações no LocalStorage.
 */
function salvarNoLocalStorage() {
  localStorage.setItem('transacoes', JSON.stringify(transacoes));
}

/**
 * Carrega as transações salvas no LocalStorage.
 */
function carregarDoLocalStorage() {
  const dados = localStorage.getItem('transacoes');
  return dados ? JSON.parse(dados) : [];
}

// ==================== FUNCIONÁRIOS NO FINANCEIRO ====================

/**
 * Carrega os funcionários do LocalStorage do usuário atual.
 * Retorna array vazio se não houver funcionários ou se for PF.
 */
function carregarFuncionariosFinanceiro() {
  if (ehPessoaFisica()) return [];

  var chave = 'funcionarios-' + obterEmailUsuario();
  var dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : [];
}

/**
 * Popula o select de funcionários com os funcionários cadastrados.
 */
function popularSelectFuncionarios() {
  selectFuncionario.innerHTML = '<option value="">Nenhum (saída comum)</option>';

  var funcionariosLS = carregarFuncionariosFinanceiro();

  for (var i = 0; i < funcionariosLS.length; i++) {
    var option = document.createElement('option');
    option.value = funcionariosLS[i].id;
    var salarioDisplay = funcionariosLS[i].salario ? ' — ' + formatarMoeda(funcionariosLS[i].salario) : '';
    option.textContent = funcionariosLS[i].nome + ' (' + funcionariosLS[i].cargo + ')' + salarioDisplay;
    option.setAttribute('data-nome', funcionariosLS[i].nome);
    option.setAttribute('data-cargo', funcionariosLS[i].cargo);
    option.setAttribute('data-salario', funcionariosLS[i].salario || 0);
    selectFuncionario.appendChild(option);
  }
}

/**
 * Mostra ou esconde o select de funcionários conforme o tipo selecionado.
 * Só aparece para PJ e quando o tipo é "saida".
 */
function toggleSelectFuncionario() {
  var tipoSaida = selectTipo.value === 'saida';
  var ehPJ = !ehPessoaFisica();

  if (tipoSaida && ehPJ) {
    grupoFuncionario.classList.remove('oculto');
  } else {
    grupoFuncionario.classList.add('oculto');
    selectFuncionario.value = '';
  }
}

/**
 * Quando um funcionário é selecionado, preenche a descrição automaticamente.
 */
function aoSelecionarFuncionario() {
  var opcaoSelecionada = selectFuncionario.options[selectFuncionario.selectedIndex];

  if (selectFuncionario.value) {
    var nomeFuncionario = opcaoSelecionada.getAttribute('data-nome');
    var cargoFuncionario = opcaoSelecionada.getAttribute('data-cargo');
    var salarioFuncionario = parseFloat(opcaoSelecionada.getAttribute('data-salario'));

    inputDescricao.value = 'Salário — ' + nomeFuncionario + ' (' + cargoFuncionario + ')';

    if (salarioFuncionario > 0) {
      inputValor.value = salarioFuncionario.toFixed(2);
    }
  }
}

// ==================== ADICIONAR TRANSAÇÃO ====================

/**
 * Cria uma nova transação a partir dos dados do formulário.
 */
function adicionarTransacao(evento) {
  evento.preventDefault();

  const descricao = inputDescricao.value.trim();
  const valor = parseFloat(inputValor.value);
  const tipo = selectTipo.value;

  if (!descricao || isNaN(valor) || valor <= 0) {
    return;
  }

  const novaTransacao = {
    id: gerarId(),
    descricao: descricao,
    valor: valor,
    tipo: tipo,
    data: new Date().toISOString()
  };

  transacoes.unshift(novaTransacao);
  salvarNoLocalStorage();
  atualizarInterface();

  formTransacao.reset();
  toggleSelectFuncionario();
  inputDescricao.focus();
}

// ==================== REMOVER TRANSAÇÃO ====================

/**
 * Remove uma transação pelo seu ID.
 */
function removerTransacao(id) {
  if (!confirm('Deseja realmente remover esta movimentação?')) {
    return;
  }

  transacoes = transacoes.filter(function(transacao) {
    return transacao.id !== id;
  });

  salvarNoLocalStorage();
  atualizarInterface();
}

// ==================== LIMPAR TUDO ====================

/**
 * Remove todas as transações após confirmação.
 */
function limparTudo() {
  if (transacoes.length === 0) {
    return;
  }

  if (!confirm('Tem certeza que deseja apagar TODAS as movimentações?')) {
    return;
  }

  transacoes = [];
  salvarNoLocalStorage();
  atualizarInterface();
}

// ==================== CALCULAR RESUMO ====================

/**
 * Calcula e retorna o resumo financeiro.
 */
function calcularResumo() {
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (let i = 0; i < transacoes.length; i++) {
    if (transacoes[i].tipo === 'entrada') {
      totalEntradas += transacoes[i].valor;
    } else {
      totalSaidas += transacoes[i].valor;
    }
  }

  return {
    totalEntradas: totalEntradas,
    totalSaidas: totalSaidas,
    saldo: totalEntradas - totalSaidas
  };
}

// ==================== FILTRAR TRANSAÇÕES ====================

/**
 * Retorna as transações filtradas conforme o filtro ativo.
 */
function obterTransacoesFiltradas() {
  if (filtroAtual === 'todas') {
    return transacoes;
  }

  return transacoes.filter(function(transacao) {
    return transacao.tipo === filtroAtual;
  });
}

// ==================== RENDERIZAR LISTA ====================

/**
 * Cria os elementos HTML para cada transação e insere na lista.
 */
function renderizarLista() {
  listaTransacoes.innerHTML = '';

  const transacoesFiltradas = obterTransacoesFiltradas();

  if (transacoesFiltradas.length === 0) {
    mensagemVazia.classList.remove('oculto');
  } else {
    mensagemVazia.classList.add('oculto');
  }

  for (let i = 0; i < transacoesFiltradas.length; i++) {
    var transacao = transacoesFiltradas[i];

    var li = document.createElement('li');
    li.className = 'item item--' + transacao.tipo;

    var sinal = transacao.tipo === 'entrada' ? '+ ' : '- ';
    var valorFormatado = sinal + formatarMoeda(transacao.valor);

    var dataFormatada = transacao.data ? formatarDataHora(transacao.data) : '';

    li.innerHTML =
      '<div class="item__info">' +
        '<span class="item__descricao">' + escapeHTML(transacao.descricao) + '</span>' +
        '<span class="item__valor">' + valorFormatado + '</span>' +
        (dataFormatada ? '<span class="item__data">' + dataFormatada + '</span>' : '') +
      '</div>' +
      '<button class="btn btn--remover" data-id="' + transacao.id + '" title="Remover">' +
        '✕' +
      '</button>';

    listaTransacoes.appendChild(li);
  }
}

// ==================== ATUALIZAR RESUMO ====================

/**
 * Atualiza os valores exibidos nos cards de resumo.
 */
function atualizarResumo() {
  var resumo = calcularResumo();

  totalEntradasEl.textContent = formatarMoeda(resumo.totalEntradas);
  totalSaidasEl.textContent = formatarMoeda(resumo.totalSaidas);
  saldoFinalEl.textContent = formatarMoeda(resumo.saldo);

  if (resumo.saldo < 0) {
    saldoFinalEl.classList.add('negativo');
  } else {
    saldoFinalEl.classList.remove('negativo');
  }
}

// ==================== ATUALIZAR INTERFACE ====================

/**
 * Atualiza toda a interface: lista, resumo e gráficos.
 */
function atualizarInterface() {
  renderizarLista();
  atualizarResumo();
  atualizarGraficos();
}

// ==================== FILTROS ====================

/**
 * Altera o filtro ativo e atualiza a lista.
 */
function aplicarFiltro(evento) {
  var filtro = evento.target.getAttribute('data-filtro');
  if (!filtro) return;

  filtroAtual = filtro;

  for (var i = 0; i < btnsFiltro.length; i++) {
    btnsFiltro[i].classList.remove('ativo');
  }
  evento.target.classList.add('ativo');

  renderizarLista();
}

// ==================== GRÁFICOS (Canvas HTML5) ====================

/**
 * Obtém as cores do tema atual lendo as variáveis CSS.
 */
function obterCoresTema() {
  var estilos = getComputedStyle(document.body);
  return {
    entrada: estilos.getPropertyValue('--cor-entrada').trim(),
    saida: estilos.getPropertyValue('--cor-saida').trim(),
    textoSecundario: estilos.getPropertyValue('--cor-texto-secundario').trim(),
    texto: estilos.getPropertyValue('--cor-texto').trim(),
    borda: estilos.getPropertyValue('--cor-borda').trim(),
    fundo: estilos.getPropertyValue('--cor-superficie').trim()
  };
}

/**
 * Desenha um gráfico de rosca (donut) mostrando a proporção Entradas vs Saídas.
 */
function desenharGraficoRosca() {
  var ctx = canvasRosca.getContext('2d');
  var cores = obterCoresTema();
  var resumo = calcularResumo();
  var total = resumo.totalEntradas + resumo.totalSaidas;

  // Tamanho do canvas (considerando alta resolução / retina)
  var tamanho = 220;
  var dpr = window.devicePixelRatio || 1;
  canvasRosca.width = tamanho * dpr;
  canvasRosca.height = tamanho * dpr;
  canvasRosca.style.width = tamanho + 'px';
  canvasRosca.style.height = tamanho + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, tamanho, tamanho);

  var centroX = tamanho / 2;
  var centroY = tamanho / 2;
  var raioExterno = 90;
  var raioInterno = 55;

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centroX, centroY, raioExterno, 0, Math.PI * 2);
    ctx.arc(centroX, centroY, raioInterno, 0, Math.PI * 2, true);
    ctx.fillStyle = cores.borda;
    ctx.fill();

    ctx.fillStyle = cores.textoSecundario;
    ctx.font = '500 14px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sem dados', centroX, centroY);

    legendaRosca.innerHTML = '';
    return;
  }

  var fatias = [
    { valor: resumo.totalEntradas, cor: cores.entrada, label: 'Entradas' },
    { valor: resumo.totalSaidas, cor: cores.saida, label: 'Saídas' }
  ];

  var anguloInicial = -Math.PI / 2;

  for (var i = 0; i < fatias.length; i++) {
    if (fatias[i].valor === 0) continue;

    var angulo = (fatias[i].valor / total) * Math.PI * 2;
    var anguloFinal = anguloInicial + angulo;

    ctx.beginPath();
    ctx.arc(centroX, centroY, raioExterno, anguloInicial, anguloFinal);
    ctx.arc(centroX, centroY, raioInterno, anguloFinal, anguloInicial, true);
    ctx.closePath();
    ctx.fillStyle = fatias[i].cor;
    ctx.fill();

    anguloInicial = anguloFinal;
  }

  var pctEntrada = Math.round((resumo.totalEntradas / total) * 100);
  ctx.fillStyle = cores.texto;
  ctx.font = 'bold 22px Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pctEntrada + '%', centroX, centroY - 8);

  ctx.fillStyle = cores.textoSecundario;
  ctx.font = '500 11px Segoe UI, system-ui, sans-serif';
  ctx.fillText('entradas', centroX, centroY + 12);

  legendaRosca.innerHTML =
    '<div class="legenda-item">' +
      '<span class="legenda-cor" style="background:' + cores.entrada + '"></span>' +
      'Entradas (' + formatarMoeda(resumo.totalEntradas) + ')' +
    '</div>' +
    '<div class="legenda-item">' +
      '<span class="legenda-cor" style="background:' + cores.saida + '"></span>' +
      'Saídas (' + formatarMoeda(resumo.totalSaidas) + ')' +
    '</div>';
}

/**
 * Atualiza os gráficos e controla visibilidade.
 */
function atualizarGraficos() {
  if (transacoes.length === 0) {
    graficosContainer.classList.add('oculto');
    graficosVazio.classList.remove('oculto');
  } else {
    graficosContainer.classList.remove('oculto');
    graficosVazio.classList.add('oculto');
  }

  desenharGraficoRosca();
}

// ==================== EVENT LISTENERS ====================

// Formulário: ao enviar, adiciona uma nova transação
formTransacao.addEventListener('submit', adicionarTransacao);

// Botão "Limpar Tudo": apaga todas as transações
btnLimpar.addEventListener('click', limparTudo);

// Botões de filtro
for (var i = 0; i < btnsFiltro.length; i++) {
  btnsFiltro[i].addEventListener('click', aplicarFiltro);
}

// Lista de transações: delegação de eventos para remover
listaTransacoes.addEventListener('click', function(evento) {
  var botaoRemover = evento.target.closest('.btn--remover');
  if (botaoRemover) {
    var id = botaoRemover.getAttribute('data-id');
    removerTransacao(id);
  }
});

// Select de tipo: mostra/esconde select de funcionário
selectTipo.addEventListener('change', toggleSelectFuncionario);

// Select de funcionário: preenche descrição ao selecionar
selectFuncionario.addEventListener('change', aoSelecionarFuncionario);

// Redesenha gráficos quando o tema muda (evento do shared.js)
window.addEventListener('tema-alterado', function() {
  atualizarGraficos();
});

// ==================== INICIALIZAÇÃO ====================

/**
 * Inicializa a página financeira:
 * 1. Executa inicialização compartilhada (saudação, empresa, tema)
 * 2. Carrega transações do LocalStorage
 * 3. Atualiza toda a interface
 */
function inicializarFinanceiro() {
  // Funções compartilhadas (shared.js)
  inicializarCompartilhado();

  // Carrega as transações salvas
  transacoes = carregarDoLocalStorage();

  // Popula o select de funcionários (apenas PJ)
  popularSelectFuncionarios();
  toggleSelectFuncionario();

  // Renderiza a lista, resumo e gráficos
  atualizarInterface();
}

// Executa a inicialização
inicializarFinanceiro();
