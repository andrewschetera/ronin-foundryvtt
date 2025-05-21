// long-rest-roll.js - Sistema de rolagem para descanso longo para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Descanso Longo para o sistema RONIN
 */
class LongRestRoll {
  /**
   * Função principal para rolagem de descanso longo
   * @param {Object} actor - Ator que está realizando o descanso longo
   * @param {boolean} noFoodAndWater - Se o personagem está sem comida e água
   * @param {boolean} deductConsumables - Se deve descontar consumíveis automaticamente
   * @param {boolean} isInfectedOrPoisoned - Se o personagem está infectado ou envenenado
   */
  static async roll(actor, noFoodAndWater, deductConsumables, isInfectedOrPoisoned) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Objeto para armazenar os resultados das rolagens e atualizações
    const results = {
      canRecoverHP: true,
      waterUsed: null,
      foodUsed: null,
      hpRoll: null,
      hpRecovered: 0,
      virtuesRoll: null,
      virtuesRecovered: 0,
      textsRoll: null,
      textsRecovered: 0,
      damageRoll: null,
      damageSuffered: 0,
      meditationBonusesRemoved: false,
      meditationAttributes: []
    };
    
    // Verificar e processar consumíveis se necessário
    if (deductConsumables) {
      const consumableResult = await this._deductConsumables(actor);
      results.canRecoverHP = consumableResult.canRecoverHP;
      results.waterUsed = consumableResult.waterUsed;
      results.foodUsed = consumableResult.foodUsed;
    } else if (noFoodAndWater) {
      // Se não estiver descontando automaticamente, mas o usuário indicou que não tem comida e água
      results.canRecoverHP = false;
    }
    
    // Verificar se está infectado ou envenenado
    if (isInfectedOrPoisoned) {
      results.canRecoverHP = false;
      
      // Rolar 1d6 para dano
      results.damageRoll = new Roll("1d6");
      await results.damageRoll.evaluate();
      
      // Verificar se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(results.damageRoll);
      }
      
      results.damageSuffered = results.damageRoll.total;
      
      // Não aplicar dano automaticamente, apenas informar
    } else if (!results.canRecoverHP) {
      // Se não pode recuperar HP por falta de comida e água, rolar para dano potencial
      // Note que este dano só seria aplicado a partir do terceiro dia, mas vamos rolar de qualquer forma
      results.damageRoll = new Roll("1d4");
      await results.damageRoll.evaluate();
      
      // Verificar se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(results.damageRoll);
      }
      
      results.damageSuffered = results.damageRoll.total;
    }
    
    // Recuperar HP se puder
    if (results.canRecoverHP && !isInfectedOrPoisoned) {
      // Rolar 1d6 para recuperação de HP
      results.hpRoll = new Roll("1d6");
      await results.hpRoll.evaluate();
      
      // Verificar se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(results.hpRoll);
      }
      
      results.hpRecovered = results.hpRoll.total;
      
      // Atualizar HP do personagem sem exceder o máximo
      const currentHP = actor.system.resources.hp.value;
      const maxHP = actor.system.resources.hp.max;
      const newHP = Math.min(currentHP + results.hpRecovered, maxHP);
      
      // Atualizar o HP do ator
      await actor.update({"system.resources.hp.value": newHP});
    }
    
    // Buscar o item de classe do personagem para determinar a fórmula de Virtudes
    const classItem = actor.items.find(i => i.type === "class");
    let virtuesFormula = "1"; // Valor padrão se não encontrar
    
    if (classItem && classItem.system.baseStats?.virtues) {
      // Verificar se há uma fórmula de dados em virtues
      const virtuesDiceMatch = classItem.system.baseStats.virtues.match(/\d*d\d+/);
      if (virtuesDiceMatch) {
        virtuesFormula = virtuesDiceMatch[0];
      } else {
        // Se não há fórmula de dados, tentar usar como número direto
        const virtuesValue = parseInt(classItem.system.baseStats.virtues);
        if (!isNaN(virtuesValue)) {
          virtuesFormula = virtuesValue.toString();
        }
      }
    }
    
    // Rolar para recuperação de Virtudes
    results.virtuesRoll = new Roll(virtuesFormula);
    await results.virtuesRoll.evaluate();
    
    // Verificar se o módulo Dice So Nice está ativo
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(results.virtuesRoll);
    }
    
    // Atualizar Virtudes apenas se o valor rolado for maior que o atual
    const currentVirtues = actor.system.resources.virtues.value;
    const rolledVirtues = results.virtuesRoll.total;
    
    if (rolledVirtues > currentVirtues) {
      results.virtuesRecovered = rolledVirtues - currentVirtues;
      await actor.update({"system.resources.virtues.value": rolledVirtues});
    }
    
    // Rolar para recuperação de Textos (1d4 + Espírito)
    const spiritValue = actor.system.abilities.spirit.value;
    results.textsRoll = new Roll(`1d4 + ${spiritValue}`);
    await results.textsRoll.evaluate();
    
    // Verificar se o módulo Dice So Nice está ativo
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(results.textsRoll);
    }
    
    // Atualizar o valor de Textos
    const currentTexts = actor.system.resources.texts.value;
    const newTexts = results.textsRoll.total;
    results.textsRecovered = newTexts;
    
    await actor.update({"system.resources.texts.value": newTexts});
    
// Verificar e remover bônus temporários de atributos da meditação (flags no ator)
if (actor.getFlag("ronin", "meditationBonuses")) {
  const meditationBonuses = actor.getFlag("ronin", "meditationBonuses");
  
  // Lista para rastrear os atributos que tinham bônus
  const modifiedAttributes = [];
  
  // Processar bônus de atributos
  for (const [key, value] of Object.entries(meditationBonuses.attributes || {})) {
    if (value !== 0) {
      // Registrar o atributo que teve bônus removido
      modifiedAttributes.push(key);
      
      // Preparar caminho de atualização
      const updatePath = `system.abilities.${key}.value`;
      const currentValue = actor.system.abilities[key].value;
      
      // Remover o bônus
      await actor.update({[updatePath]: currentValue - value});
    }
  }
  
  // Se houve alguma alteração, registre que os bônus foram removidos
  if (modifiedAttributes.length > 0) {
    results.meditationBonusesRemoved = true;
    results.meditationAttributes = modifiedAttributes;
  }
  
  // Remover a flag completamente após processar os bônus
  await actor.unsetFlag("ronin", "meditationBonuses");
}
    
    // Preparar os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      results: results,
      isInfectedOrPoisoned: isInfectedOrPoisoned,
      noFoodAndWater: noFoodAndWater
    };
    
    // Renderizar o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/long-rest-roll-card.html", chatTemplateData);
    
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
window.RONIN.LongRestRoll = LongRestRoll;

// Exportar a classe para uso via importação
export default LongRestRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de descanso longo carregado");
