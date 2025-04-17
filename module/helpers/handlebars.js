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
  
  /**
   * Helper para somar dois valores
   * @param {any} a Primeiro valor
   * @param {any} b Segundo valor
   * @returns {number} Resultado da soma
   */
  Handlebars.registerHelper('sum', function (a, b) {
    return (Number(a) || 0) + (Number(b) || 0);
  });
  
  /**
   * Helper para multiplicar dois valores
   * @param {any} a Primeiro valor
   * @param {any} b Segundo valor
   * @returns {number} Resultado da multiplicação
   */
  Handlebars.registerHelper('multiply', function (a, b) {
    return (Number(a) || 0) * (Number(b) || 0);
  });
  
  /**
   * Helper para capitalizar a primeira letra de uma string
   * @param {string} str String a ser capitalizada
   * @returns {string} String com a primeira letra maiúscula
   */
  Handlebars.registerHelper('capitalize', function (str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  
  /**
   * Helper para concatenar strings
   * @returns {string} Strings concatenadas
   */
  Handlebars.registerHelper('concat', function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.join('');
  });
  
  // Adicionar outros helpers conforme necessário
};

// Exportar o módulo
export default RONIN.registerHandlebarsHelpers;

// Adicionar ao arquivo module/helpers/handlebars.js

/**
 * Helper 'some' para verificar se algum item de uma coleção atende a um critério
 * @param {Array} collection A coleção a ser verificada
 * @param {string} property O nome da propriedade a ser verificada
 * @returns {boolean} Verdadeiro se algum item atender ao critério
 */
Handlebars.registerHelper('some', function (collection, property) {
  if (!collection || collection.length === 0) return false;
  
  // Se collection for um array do Foundry, use a função some dele
  if (collection instanceof Array) {
    return collection.some(item => {
      // Navegar pela propriedade usando notação de ponto
      if (property.includes('.')) {
        const parts = property.split('.');
        let value = item;
        for (const part of parts) {
          if (!value) return false;
          value = value[part];
        }
        return Boolean(value);
      }
      // Propriedade simples
      return Boolean(item[property]);
    });
  }
  
  // Se for uma coleção do Foundry (como um items Collection)
  if (collection.contents) {
    return collection.contents.some(item => {
      // Navegar pela propriedade usando notação de ponto
      if (property.includes('.')) {
        const parts = property.split('.');
        let value = item;
        for (const part of parts) {
          if (!value) return false;
          value = value[part];
        }
        return Boolean(value);
      }
      // Propriedade simples
      return Boolean(item[property]);
    });
  }
  
  return false;
});
