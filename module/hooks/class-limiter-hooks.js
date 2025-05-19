// Hook para impedir múltiplas classes por personagem
Hooks.on("preCreateItem", (item, data, options, userId) => {
  // Verificar apenas para itens do tipo "class" que estão sendo adicionados a um ator
  if (item.parent && item.parent.documentName === "Actor" && data.type === "class") {
    const actor = item.parent;
    
    // Contar as classes existentes
    const existingClasses = actor.items.filter(i => i.type === "class");
    if (existingClasses.length > 0) {
      // Já existe uma classe, exibir notificação e impedir a criação
      ui.notifications.warn(game.i18n.localize("RONIN.Features.ClassLimit"));
      return false;
    }
  }
  
  // Permitir a criação do item
  return true;
});
