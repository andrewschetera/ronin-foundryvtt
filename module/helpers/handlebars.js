// handlebars.js - Helpers do Handlebars para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Registra os helpers do Handlebars para o sistema RONIN
 */
RONIN.registerHandlebarsHelpers = function() {
  /**
   * Helper 'times' para criar loops no Handlebars
   * @param {number} n Número de iterações
   * @param {object} block Bloco de conteúdo
   * @returns {string} HTML gerado
   */
  Handlebars.registerHelper('times', function(n, block) {
    let accum = '';
    for(let i = 1; i <= n; ++i)
      accum += block.fn(i);
    return accum;
  });

  /**
   * Helper para converter valores em inteiros para comparação
   * @param {any} value Valor a ser convertido
   * @returns {number} Valor como inteiro
   */
  Handlebars.registerHelper('int', function (value) {
    return parseInt(value) || 0;
  });

  /**
   * Helper 'eq' para comparações de igualdade
   * @param {any} a Primeiro valor
   * @param {any} b Segundo valor
   * @returns {boolean} Resultado da comparação
   */
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  /**
   * Helper 'lte' para comparações de menor ou igual
   * @param {any} a Primeiro valor
   * @param {any} b Segundo valor
   * @returns {boolean} Resultado da comparação
   */
  Handlebars.registerHelper('lte', function (a, b) {
    return a <= b;
  });
  
  /**
   * Helper 'and' para condições múltiplas
   * @returns {boolean} Resultado da operação lógica
   */
  Handlebars.registerHelper('and', function () {
    return Array.prototype.every.call(arguments, Boolean);
  });
  
  /**
   * Helper para formatar números com sinal
   * @param {any} value Valor a ser formatado
   * @returns {string} Valor formatado com sinal
   */
  Handlebars.registerHelper('formatSign', function (value) {
    const num = Number(value);
    if (isNaN(num)) return value;
    return num >= 0 ? `+${num}` : `${num}`;
  });
  
  // Adicionar outros helpers conforme necessário
};

// Exportar o módulo
export default RONIN.registerHandlebarsHelpers;
