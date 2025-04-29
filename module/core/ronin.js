// ronin.js - Arquivo principal do sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

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
  
  // Garantir que os módulos de rolagem estão disponíveis
  console.log('ronin | Verificando módulos de rolagem');
  if (RONIN.AbilityRoll) console.log('ronin | Módulo de rolagem de habilidades está disponível');
  else console.warn('ronin | Módulo de rolagem de habilidades NÃO está disponível');
  
  if (RONIN.AttackRoll) console.log('ronin | Módulo de rolagem de ataques está disponível');
  else console.warn('ronin | Módulo de rolagem de ataques NÃO está disponível');
});

// Hook para ajustar rolagem depois que o Foundry terminar de carregar
Hooks.once('ready', function() {
  console.log('ronin | Sistema RONIN carregado com sucesso');
  document.body.classList.add('ronin-system-loaded');
  
  // Verificação final dos módulos de rolagem
  if (!RONIN.AbilityRoll) console.error('ronin | ERRO: Módulo de rolagem de habilidades não foi carregado!');
  if (!RONIN.AttackRoll) console.error('ronin | ERRO: Módulo de rolagem de ataques não foi carregado!');
});