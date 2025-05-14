// get-better-roll.js - Sistema de rolagem para a ação "Melhorar" (Get Better) para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Melhoria para o sistema RONIN
 */
class GetBetterRoll {
  /**
   * Função principal para rolagem de melhoria
   * @param {Object} actor - Ator que está usando a ação Melhorar
   */
  static async roll(actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Apresentar a caixa de diálogo de confirmação
    const content = await renderTemplate("systems/ronin/templates/dialogs/get-better-dialog.html", {});
    
    const dialog = new Dialog({
      title: game.i18n.localize("RONIN.Actions.GetBetter"),
      content: content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("RONIN.Rolls.Roll"),
          callback: () => this._onGetBetter(actor)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("RONIN.Rolls.Cancel")
        }
      },
      default: "cancel"
    });
    
    dialog.render(true);
  }
  
  /**
   * Processa a rolagem de melhoria após a confirmação
   * @param {Object} actor - Ator que está usando a ação Melhorar
   * @private
   */
  static async _onGetBetter(actor) {
    try {
      // Preparar os resultados e as alterações
      const results = {
        hpRoll: null,
        hpIncrease: 0,
        attributes: {}
      };
      
      // Buscar o valor máximo de HP atual
      const currentMaxHP = actor.system.resources.hp.max;
      
      // Rolar 6d10 para o HP
      const hpThresholdRoll = new Roll("6d10");
      await hpThresholdRoll.evaluate();
      const hpThresholdTotal = hpThresholdRoll.total;
      
      // Verificar se o resultado é maior ou igual ao HP máximo
      let hpIncreaseRoll = null;
      if (hpThresholdTotal >= currentMaxHP) {
        // Rolar 1d6 para o aumento de HP
        hpIncreaseRoll = new Roll("1d6");
        await hpIncreaseRoll.evaluate();
        results.hpIncrease = hpIncreaseRoll.total;
      }
      
      // Salvar os resultados da rolagem de HP
      results.hpRoll = {
        formula: hpThresholdRoll.formula,
        total: hpThresholdTotal,
        threshold: currentMaxHP,
        increaseRoll: hpIncreaseRoll
      };
      
      // Lista de atributos para processar
      const attributes = ["vigor", "swiftness", "spirit", "resilience"];
      
      // Processar cada atributo
      for (const attr of attributes) {
        // Buscar o valor atual do atributo
        const currentValue = actor.system.abilities[attr].value;
        
        // Rolar 1d6 para o atributo
        const attrRoll = new Roll("1d6");
        await attrRoll.evaluate();
        const attrRollTotal = attrRoll.total;
        
        // Definir se vai aumentar ou diminuir
        let change = 0;
        
        // Atributos de -3 a +1 sempre aumentam, exceto com resultado 1
        if (currentValue <= 1) {
          if (attrRollTotal === 1) {
            // Com resultado 1, diminui, mas não pode ser menor que -3
            change = (currentValue > -3) ? -1 : 0;
          } else {
            // Com outros resultados, sempre aumenta
            change = 1;
          }
        } else {
          // Para atributos +2 ou maiores, compara com o resultado da rolagem
          if (attrRollTotal >= currentValue) {
            // Se o resultado é maior ou igual, aumenta (até o máximo de +6)
            change = (currentValue < 6) ? 1 : 0;
          } else {
            // Se o resultado é menor, diminui
            change = -1;
          }
        }
        
        // Salvar os resultados do atributo
        results.attributes[attr] = {
          roll: attrRoll,
          oldValue: currentValue,
          change: change,
          newValue: currentValue + change
        };
      }
      
      // Preparar as atualizações no actor
      const updates = {};
      
      // Atualizar o HP máximo
      if (results.hpIncrease > 0) {
        updates["system.resources.hp.max"] = currentMaxHP + results.hpIncrease;
      }
      
      // Atualizar os atributos
      for (const [attr, data] of Object.entries(results.attributes)) {
        if (data.change !== 0) {
          updates[`system.abilities.${attr}.value`] = data.newValue;
        }
      }
      
      // Aplicar as atualizações ao actor
      if (Object.keys(updates).length > 0) {
        await actor.update(updates);
      }
      
      // Preparar os dados para o template do chat card
      const templateData = {
        actor: actor,
        hpRoll: results.hpRoll,
        hpIncrease: results.hpIncrease > 0,
        hpIncreaseValue: results.hpIncrease,
        attributes: results.attributes
      };
      
      // Renderizar o template do chat card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/get-better-roll-card.html", templateData);
      
      // Configurar as opções de chat
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: chatContent,
        sound: CONFIG.sounds.dice
      };
      
      // Verificar se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        // Exibir a animação do Dice So Nice para a rolagem de HP
        await game.dice3d.showForRoll(hpThresholdRoll);
        
        // Se houver aumento de HP, exibir a animação do aumento
        if (hpIncreaseRoll) {
          await game.dice3d.showForRoll(hpIncreaseRoll);
        }
        
        // Exibir as animações das rolagens de atributos
        for (const attr of attributes) {
          await game.dice3d.showForRoll(results.attributes[attr].roll);
        }
      }
      
      // Criar a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao realizar a rolagem de melhoria:", error);
      ui.notifications.error(`Erro ao realizar a rolagem de melhoria: ${error.message}`);
    }
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.GetBetterRoll = GetBetterRoll;

// Exportar a classe para uso via importação
export default GetBetterRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de melhoria carregado");
