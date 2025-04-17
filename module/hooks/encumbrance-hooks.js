// encumbrance-hooks.js - Hooks para gerenciar limite de carga do personagem

// Registrar o hook diretamente
Hooks.once('init', function() {
  console.log("RONIN | Inicializando hooks de capacidade de carga");
  
  // Hook para verificar limite de carga ao adicionar itens
  Hooks.on("preCreateItem", onPreCreateItem);
});

/**
 * Manipulador para o hook preCreateItem
 */
function onPreCreateItem(item, data, options, userId) {
  // Verificar apenas para itens que estão sendo adicionados a um ator
  if (!item.parent || item.parent.documentName !== "Actor") return true;

  const actor = item.parent;
  
  // Ignorar itens que não têm peso
  if (!data.system?.weight) return true;
  
  // Calcular o peso adicional que seria adicionado
  let additionalWeight = 0;
  if (data.system.weight === "normal") additionalWeight = 1;
  else if (data.system.weight === "heavy") additionalWeight = 2;
  
  // Obter a capacidade de carga atual e máxima
  const currentLoad = actor.system.carryingCapacity.value;
  const maxCapacity = actor.system.abilities.vigor.value + 8;
  const absoluteMaxLoad = maxCapacity * 2;
  
  // Verificar se a adição ultrapassaria o limite máximo
  if (currentLoad + additionalWeight > absoluteMaxLoad) {
    // Mostrar notificação de erro traduzível
    ui.notifications.error(game.i18n.format("RONIN.Encumbrance.MaxLoadExceeded", {max: absoluteMaxLoad}));
    
    // Cancelar a criação do item
    return false;
  }
  
  // Permitir a criação do item
  return true;
}
