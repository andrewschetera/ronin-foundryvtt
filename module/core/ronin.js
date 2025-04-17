// ronin.js - Arquivo principal do sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

// Importação dos módulos (deve ser feita através do esmodules no system.json)
// As importações abaixo são apenas ilustrativas da estrutura

/**
 * Inicialização do sistema
 */
Hooks.once('init', async function() {
  console.log('ronin | Inicializando sistema RONIN');
  
  // Registrar configurações do sistema (cores, fonte, etc)
  CONFIG.RONIN = CONFIG.RONIN || {};
  
  // Define tipos de atores personalizados
  CONFIG.Actor.documentClass = RONIN.Actor;
  CONFIG.Item.documentClass = RONIN.Item;
  
  // Registrar folhas de personagem
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ronin", RONIN.ActorSheet, { makeDefault: true });
  
  // Registrar folhas de item
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ronin", RONIN.ItemSheet, { makeDefault: true });

  // Registrar helpers do Handlebars
  RONIN.registerHandlebarsHelpers();
  
});

// Hook para ajustar rolagem depois que o Foundry terminar de carregar
Hooks.once('ready', function() {
  console.log('ronin | Sistema RONIN carregado com sucesso');
  document.body.classList.add('ronin-system-loaded');
});

// Exportar o namespace RONIN
export default RONIN;
