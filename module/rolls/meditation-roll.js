// meditation-roll.js - Sistema de rolagem para meditação para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Meditação para o sistema RONIN
 */
class MeditationRoll {
  /**
   * Função principal para rolagem de meditação
   * @param {Object} actor - Ator que está realizando a meditação
   * @param {boolean} withHaiku - Se a meditação inclui um haiku
   */
  static async roll(actor, withHaiku) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Exibir diálogo para seleção de atributo
    this._showAttributeSelectionDialog(actor, withHaiku);
  }
  
  /**
   * Exibe o diálogo para seleção de atributo
   * @param {Object} actor - Ator que está meditando
   * @param {boolean} withHaiku - Se a meditação inclui um haiku
   * @private
   */
  static async _showAttributeSelectionDialog(actor, withHaiku) {
    // Preparar os dados do template
    const templateData = {
      actor: actor,
      withHaiku: withHaiku
    };
    
    // Renderizar o template do diálogo
    const content = await renderTemplate("systems/ronin/templates/dialogs/meditation-attribute-dialog.html", templateData);
    
    // Criar e exibir o diálogo
    const dialog = new Dialog({
      title: game.i18n.localize("RONIN.Meditation.AttributeSelection"),
      content: content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("RONIN.Meditation.Confirm"),
          callback: html => this._processMeditation(actor, html[0].querySelector("form"), withHaiku)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("RONIN.Meditation.Cancel")
        }
      },
      default: "confirm"
    });
    
    dialog.render(true);
  }
  
/**
 * Processa o resultado da meditação após a seleção do atributo
 * @param {Object} actor - Ator que está meditando
 * @param {HTMLFormElement} form - Formulário com a seleção de atributo
 * @param {boolean} withHaiku - Se a meditação inclui um haiku
 * @private
 */
static async _processMeditation(actor, form, withHaiku) {
  // Objeto para armazenar resultados
  const results = {
    selectedAttribute: "",
    attributeBonus: 1,
    honorIncrease: 1,
    withHaiku: withHaiku,  // Garantir que esta flag está correta
    haikuRoll: null,
    haikuSuccess: false,
    virtueGained: false,
    spiritPenalty: false
  };
  
  // Obter o atributo selecionado
  results.selectedAttribute = form.attribute.value;
  
  // Verificar se o atributo selecionado é válido
  if (!["vigor", "swiftness", "spirit", "resilience"].includes(results.selectedAttribute)) {
    ui.notifications.error(game.i18n.localize("RONIN.Meditation.InvalidAttribute"));
    return;
  }
  
  // Aplicar bônus ao atributo selecionado
  const currentValue = actor.system.abilities[results.selectedAttribute].value;
  await actor.update({[`system.abilities.${results.selectedAttribute}.value`]: currentValue + results.attributeBonus});
  
  // Aplicar aumento permanente de Honra
  const currentHonor = actor.system.resources.honor.value;
  await actor.update({"system.resources.honor.value": currentHonor + results.honorIncrease});
  
  // Inicializar ou atualizar a flag para os bônus de atributos
  const currentBonuses = actor.getFlag("ronin", "meditationBonuses") || { attributes: {} };
  
  // Atualizar os bônus de atributos
  const attributeBonuses = currentBonuses.attributes || {};
  attributeBonuses[results.selectedAttribute] = (attributeBonuses[results.selectedAttribute] || 0) + results.attributeBonus;
  
  // Salvar as flags atualizadas
  await actor.setFlag("ronin", "meditationBonuses", {
    attributes: attributeBonuses
  });
  
  // Processar o Haiku, se aplicável
  if (withHaiku) {
    console.log("Processando Haiku...");  // Adicionado para depuração
    
    // Criar e avaliar a rolagem
    results.haikuRoll = new Roll(`1d20 + ${actor.system.abilities.spirit.value}`);
    await results.haikuRoll.evaluate();
    
    // Verificar se o módulo Dice So Nice está ativo
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(results.haikuRoll);
    }
    
    // Determinar sucesso (CD 12)
    results.haikuSuccess = results.haikuRoll.total >= 12;
    console.log(`Resultado Haiku: ${results.haikuRoll.total}, Sucesso: ${results.haikuSuccess}`);  // Adicionado para depuração
    
    if (results.haikuSuccess) {
      // Obter o item de classe para determinar o máximo de virtudes
      const classItem = actor.items.find(i => i.type === "class");
      let maxVirtues = 1; // Valor padrão
      
      if (classItem && classItem.system.baseStats?.virtues) {
        // Verificar se há uma fórmula de dados em virtues
        const virtuesDiceMatch = classItem.system.baseStats.virtues.match(/(\d*)d(\d+)/);
        if (virtuesDiceMatch) {
          const diceCount = parseInt(virtuesDiceMatch[1]) || 1;
          const diceSides = parseInt(virtuesDiceMatch[2]);
          maxVirtues = diceCount * diceSides;
        } else {
          // Se não há fórmula de dados, tentar usar como número direto
          const virtuesValue = parseInt(classItem.system.baseStats.virtues);
          if (!isNaN(virtuesValue)) {
            maxVirtues = virtuesValue;
          }
        }
      }
      
      // Verificar se o personagem já tem o máximo de virtudes
      const currentVirtues = actor.system.resources.virtues.value;
      
      if (currentVirtues < maxVirtues) {
        // Adicionar 1 Virtude
        await actor.update({"system.resources.virtues.value": currentVirtues + 1});
        results.virtueGained = true;
      }
    } else {
      // Aplicar penalidade de -1 em Espírito
      const currentSpirit = actor.system.abilities.spirit.value;
      await actor.update({"system.abilities.spirit.value": currentSpirit - 1});
      results.spiritPenalty = true;
      
      // Adicionar a penalidade à flag para rastreamento
      const meditationBonuses = actor.getFlag("ronin", "meditationBonuses") || { attributes: {} };
      const attributeBonuses = meditationBonuses.attributes || {};
      attributeBonuses.spirit = (attributeBonuses.spirit || 0) - 1;
      
      await actor.setFlag("ronin", "meditationBonuses", {
        attributes: attributeBonuses
      });
    }
  }
  
  // Preparar os dados para o chat-card
  const chatTemplateData = {
    actor: actor,
    results: results
  };
  
  console.log("Dados para o chat-card:", chatTemplateData);  // Adicionado para depuração
  
  // Renderizar o template do chat-card
  const chatContent = await renderTemplate("systems/ronin/templates/chat/meditation-roll-card.html", chatTemplateData);
  
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
}

// Adicionar a classe ao namespace RONIN
window.RONIN.MeditationRoll = MeditationRoll;

// Exportar a classe para uso via importação
export default MeditationRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de meditação carregado");
