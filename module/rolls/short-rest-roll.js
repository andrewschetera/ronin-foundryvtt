// short-rest-roll.js - Sistema de rolagem para descanso curto para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Descanso Curto para o sistema RONIN
 */
class ShortRestRoll {
  /**
   * Função principal para rolagem de descanso curto
   * @param {Object} actor - Ator que está realizando o descanso curto
   * @param {boolean} noFoodAndWater - Se o personagem está sem comida e água
   * @param {boolean} deductConsumables - Se deve descontar consumíveis automaticamente
   */
  static async roll(actor, noFoodAndWater, deductConsumables) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Verificar se pode recuperar HP baseado em comida e água
    let canRecoverHP = true;
    let waterUsed = null;
    let foodUsed = null;
    
    if (deductConsumables) {
      // Verificar e descontar consumíveis
      const result = await this._deductConsumables(actor);
      canRecoverHP = result.canRecoverHP;
      waterUsed = result.waterUsed;
      foodUsed = result.foodUsed;
    } else if (noFoodAndWater) {
      // Se não estiver descontando automaticamente, mas o usuário indicou que não tem comida e água
      canRecoverHP = false;
    }
    
    // Realizar a rolagem de recuperação de HP se puder recuperar
    let hpRoll = null;
    let hpRecovered = 0;
    
    if (canRecoverHP) {
      // Rolar 1d4 para recuperação de HP
      hpRoll = new Roll("1d4");
      await hpRoll.evaluate();
      
      // Verificar se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(hpRoll);
      }
      
      hpRecovered = hpRoll.total;
      
      // Atualizar HP do personagem sem exceder o máximo
      const currentHP = actor.system.resources.hp.value;
      const maxHP = actor.system.resources.hp.max;
      const newHP = Math.min(currentHP + hpRecovered, maxHP);
      
      // Atualizar o HP do ator
      await actor.update({"system.resources.hp.value": newHP});
    }
    
    // Preparar os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      canRecoverHP: canRecoverHP,
      hpRoll: hpRoll,
      hpRecovered: hpRecovered,
      noFoodAndWater: noFoodAndWater,
      deductConsumables: deductConsumables,
      waterUsed: waterUsed,
      foodUsed: foodUsed
    };
    
    // Renderizar o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/short-rest-roll-card.html", chatTemplateData);
    
    // Configurar as opções de chat
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor: actor}),
      content: chatContent,
      sound: CONFIG.sounds.dice
    };
    
    // Criar a mensagem de chat
    await ChatMessage.create(chatData);
  }
  
  /**
   * Verifica e desconta consumíveis de água e comida
   * @param {Object} actor - Ator que está descansando
   * @returns {Object} Objeto com a flag canRecoverHP e os itens usados
   * @private
   */
  static async _deductConsumables(actor) {
    // Procurar consumíveis de água
    const waterItems = actor.items.filter(
      i => i.type === "consumable" && i.system.consumableType === "water" && i.system.uses.value > 0
    );
    
    // Procurar consumíveis de comida
    const foodItems = actor.items.filter(
      i => i.type === "consumable" && i.system.consumableType === "food" && i.system.uses.value > 0
    );
    
    // Verificar se tem água e comida disponíveis
    if (waterItems.length === 0 || foodItems.length === 0) {
      return { canRecoverHP: false, waterUsed: null, foodUsed: null };
    }
    
    // Selecionar o item de água com menor quantidade de usos
    let waterItem = waterItems.reduce((prev, current) => 
      (prev.system.uses.value < current.system.uses.value) ? prev : current
    );
    
    // Selecionar o item de comida com menor quantidade de usos
    let foodItem = foodItems.reduce((prev, current) => 
      (prev.system.uses.value < current.system.uses.value) ? prev : current
    );
    
    // Descontar 1 uso de água
    await waterItem.update({"system.uses.value": Math.max(0, waterItem.system.uses.value - 1)});
    
    // Descontar 1 uso de comida
    await foodItem.update({"system.uses.value": Math.max(0, foodItem.system.uses.value - 1)});
    
    return { canRecoverHP: true, waterUsed: waterItem, foodUsed: foodItem };
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.ShortRestRoll = ShortRestRoll;

// Exportar a classe para uso via importação
export default ShortRestRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de descanso curto carregado");
