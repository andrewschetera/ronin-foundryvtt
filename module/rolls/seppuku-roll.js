// seppuku-roll.js - Sistema de rolagem para Seppuku para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Seppuku para o sistema RONIN
 */
class SeppukuRoll {
  /**
   * Função principal para rolagem de Seppuku
   * @param {Object} actor - Ator que está realizando o Seppuku
   */
  static async roll(actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Exibe o diálogo de confirmação
    await this._showConfirmationDialog(actor);
  }
  
  /**
   * Exibe o diálogo de confirmação para o Seppuku
   * @param {Object} actor - Ator realizando o Seppuku
   * @private
   */
  static async _showConfirmationDialog(actor) {
    const content = await renderTemplate("systems/ronin/templates/dialogs/seppuku-confirmation-dialog.html", {});
    
    const dialog = new Dialog({
      title: game.i18n.localize("RONIN.Seppuku.ConfirmationTitle"),
      content: content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("RONIN.Seppuku.ConfirmButton"),
          callback: () => this._showAssistantDialog(actor)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("RONIN.Seppuku.CancelButton")
        }
      },
      default: "cancel"
    });
    
    dialog.render(true);
  }
  
  /**
   * Exibe o diálogo para perguntar sobre um assistente
   * @param {Object} actor - Ator realizando o Seppuku
   * @private
   */
  static async _showAssistantDialog(actor) {
    const content = await renderTemplate("systems/ronin/templates/dialogs/seppuku-assistant-dialog.html", {});
    
    const dialog = new Dialog({
      title: game.i18n.localize("RONIN.Seppuku.AssistantTitle"),
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("RONIN.Seppuku.YesButton"),
          callback: () => this._performSpiritTest(actor, true)
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("RONIN.Seppuku.NoButton"),
          callback: () => this._performSpiritTest(actor, false)
        }
      },
      default: "no"
    });
    
    dialog.render(true);
  }
  
  /**
   * Realiza o teste de Espírito para o Seppuku
   * @param {Object} actor - Ator realizando o Seppuku
   * @param {boolean} hasAssistant - Se o personagem tem um assistente
   * @private
   */
  static async _performSpiritTest(actor, hasAssistant) {
    try {
      // Obter o valor de Espírito do ator
      const spiritValue = actor.system.abilities.spirit.value;
      
      // Criar a rolagem para o teste de Espírito
      const spiritRoll = new Roll("1d20");
      await spiritRoll.evaluate();
      
      // Obter o resultado do d20
      const d20Result = spiritRoll.terms[0].results[0].result;
      
      // Calcular o resultado total
      const totalResult = d20Result + spiritValue;
      
      // DR para o teste de Espírito
      const difficultyRating = 12;
      
      // Determinar se foi sucesso ou falha
      const isSuccess = totalResult >= difficultyRating;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Se for sucesso ou crítico, exibir o chat card com o botão para continuar
      if (isSuccess || isCrit) {
        await this._showSpiritSuccessCard(actor, hasAssistant, spiritRoll, spiritValue, totalResult, difficultyRating);
      } else {
        // Se for falha, exibir o chat card de falha
        await this._showSpiritFailureCard(actor, spiritRoll, spiritValue, totalResult, difficultyRating);
      }
      
      // Exibir a animação do Dice So Nice se o módulo estiver ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(spiritRoll);
      }
      
    } catch (error) {
      console.error("Erro ao realizar o teste de Espírito para Seppuku:", error);
      ui.notifications.error(`Erro ao realizar o teste de Espírito para Seppuku: ${error.message}`);
    }
  }
  
  /**
   * Exibe o chat card de sucesso no teste de Espírito
   * @param {Object} actor - Ator realizando o Seppuku
   * @param {boolean} hasAssistant - Se o personagem tem um assistente
   * @param {Roll} spiritRoll - A rolagem do teste de Espírito
   * @param {number} spiritValue - O valor de Espírito do ator
   * @param {number} totalResult - O resultado total do teste
   * @param {number} difficultyRating - A DR do teste
   * @private
   */
  static async _showSpiritSuccessCard(actor, hasAssistant, spiritRoll, spiritValue, totalResult, difficultyRating) {
    // Prepara os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      spiritValue: spiritValue,
      d20Result: spiritRoll.terms[0].results[0].result,
      totalResult: totalResult,
      difficultyRating: difficultyRating,
      hasAssistant: hasAssistant
    };
    
    // Renderiza o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/seppuku-spirit-card.html", chatTemplateData);
    
    // Configura as opções de chat
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor: actor}),
      content: chatContent,
      sound: CONFIG.sounds.dice
    };
    
    // Cria a mensagem de chat
    await ChatMessage.create(chatData);
  }
  
  /**
   * Exibe o chat card de falha no teste de Espírito
   * @param {Object} actor - Ator realizando o Seppuku
   * @param {Roll} spiritRoll - A rolagem do teste de Espírito
   * @param {number} spiritValue - O valor de Espírito do ator
   * @param {number} totalResult - O resultado total do teste
   * @param {number} difficultyRating - A DR do teste
   * @private
   */
  static async _showSpiritFailureCard(actor, spiritRoll, spiritValue, totalResult, difficultyRating) {
    // Prepara os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      spiritValue: spiritValue,
      d20Result: spiritRoll.terms[0].results[0].result,
      totalResult: totalResult,
      difficultyRating: difficultyRating
    };
    
    // Renderiza o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/seppuku-spirit-failure-card.html", chatTemplateData);
    
    // Configura as opções de chat
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor: actor}),
      content: chatContent,
      sound: CONFIG.sounds.dice
    };
    
    // Cria a mensagem de chat
    await ChatMessage.create(chatData);
  }
  
  /**
   * Realiza o teste de Resiliência para o Seppuku
   * @param {Object} actor - Ator realizando o Seppuku
   * @param {boolean} hasAssistant - Se o personagem tem um assistente
   * @private
   */
  static async _performResilienceTest(actor, hasAssistant) {
    try {
      // Obter o valor de Resiliência do ator
      const resilienceValue = actor.system.abilities.resilience.value;
      
      // Criar a rolagem para o teste de Resiliência
      const resilienceRoll = new Roll("1d20");
      await resilienceRoll.evaluate();
      
      // Obter o resultado do d20
      const d20Result = resilienceRoll.terms[0].results[0].result;
      
      // Calcular o resultado total
      const totalResult = d20Result + resilienceValue;
      
      // DR para o teste de Resiliência
      const difficultyRating = 14;
      
      // Determinar se foi sucesso ou falha
      const isSuccess = totalResult >= difficultyRating;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Rolagens adicionais
      let honorRoll = null;
      let damageRoll = null;
      
      if (isSuccess || isCrit) {
        // Rolar 2d6+2 para o aumento de Honra
        honorRoll = new Roll("2d6+2");
        await honorRoll.evaluate();
      } else {
        if (hasAssistant) {
          // Rolar (1d6+1) para o aumento de Honra com assistente
          honorRoll = new Roll("(1d6+1)");
          await honorRoll.evaluate();
        } else {
          // Rolar 1d8 para o dano sem assistente
          damageRoll = new Roll("1d8");
          await damageRoll.evaluate();
        }
      }
      
      // Exibir o chat card final
      await this._showFinalCard(actor, hasAssistant, resilienceRoll, resilienceValue, totalResult, difficultyRating, isSuccess, honorRoll, damageRoll);
      
      // Exibir a animação do Dice So Nice se o módulo estiver ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(resilienceRoll);
        if (honorRoll) await game.dice3d.showForRoll(honorRoll);
        if (damageRoll) await game.dice3d.showForRoll(damageRoll);
      }
      
    } catch (error) {
      console.error("Erro ao realizar o teste de Resiliência para Seppuku:", error);
      ui.notifications.error(`Erro ao realizar o teste de Resiliência para Seppuku: ${error.message}`);
    }
  }
  
  /**
   * Exibe o chat card final do Seppuku
   * @param {Object} actor - Ator realizando o Seppuku
   * @param {boolean} hasAssistant - Se o personagem tem um assistente
   * @param {Roll} resilienceRoll - A rolagem do teste de Resiliência
   * @param {number} resilienceValue - O valor de Resiliência do ator
   * @param {number} totalResult - O resultado total do teste
   * @param {number} difficultyRating - A DR do teste
   * @param {boolean} isSuccess - Se o teste foi um sucesso
   * @param {Roll} honorRoll - A rolagem para o aumento de Honra (pode ser null)
   * @param {Roll} damageRoll - A rolagem para o dano (pode ser null)
   * @private
   */
  static async _showFinalCard(actor, hasAssistant, resilienceRoll, resilienceValue, totalResult, difficultyRating, isSuccess, honorRoll, damageRoll) {
    // Prepara os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      resilienceValue: resilienceValue,
      d20Result: resilienceRoll.terms[0].results[0].result,
      totalResult: totalResult,
      difficultyRating: difficultyRating,
      isSuccess: isSuccess,
      hasAssistant: hasAssistant,
      honorRoll: honorRoll,
      damageRoll: damageRoll
    };
    
    // Renderiza o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/seppuku-final-card.html", chatTemplateData);
    
    // Configura as opções de chat
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor: actor}),
      content: chatContent,
      sound: CONFIG.sounds.dice
    };
    
    // Cria a mensagem de chat
    await ChatMessage.create(chatData);
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.SeppukuRoll = SeppukuRoll;

// Exportar a classe para uso via importação
export default SeppukuRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de Seppuku carregado");

// Adicionar o listener para o botão de continuar com o Seppuku
Hooks.on("renderChatMessage", (message, html, data) => {
  html.find(".seppuku-continue-button").click(async (event) => {
    event.preventDefault();
    
    // Obter os dados do botão
    const button = event.currentTarget;
    const actorId = button.dataset.actorId;
    const hasAssistant = button.dataset.hasAssistant === "true";
    
    // Obter o ator
    const actor = game.actors.get(actorId);
    if (!actor) return;
    
    // Continuar com o teste de Resiliência
    await SeppukuRoll._performResilienceTest(actor, hasAssistant);
  });
});
