// broken-roll.js - Sistema de rolagem para a condição "Quebrado" (Broken) para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de condição Quebrado para o sistema RONIN
 */
class BrokenRoll {
  /**
   * Função principal para rolagem de condição Quebrado
   * @param {Object} actor - Ator que está na condição Quebrado
   */
  static async roll(actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Realiza a rolagem inicial de 1d4 para determinar o efeito
    let mainRoll = new Roll("1d4");
    await mainRoll.evaluate();
    const mainResult = mainRoll.total;
    
    // Variáveis para armazenar rolagens adicionais se necessário
    let secondaryRoll = null;
    let tertiaryRoll = null;
    let quaternaryRoll = null;
    
    // Texto do resultado baseado na rolagem
    let resultText = "";
    
    // Determinar o texto com base no resultado da rolagem
    switch (mainResult) {
      case 1:
        // Rolagem para determinar rodadas inconsciente
        secondaryRoll = new Roll("1d4");
        await secondaryRoll.evaluate();
        
        // Rolagem para determinar PV ao despertar
        tertiaryRoll = new Roll("1d4");
        await tertiaryRoll.evaluate();
        
        // Usar format para substituir variáveis no texto
        resultText = game.i18n.format("RONIN.Broken.Result1", {
          rounds: secondaryRoll.total,
          hp: tertiaryRoll.total
        });
        break;
      
      case 2:
        // Rolagem para determinar tipo de ferimento
        secondaryRoll = new Roll("1d6");
        await secondaryRoll.evaluate();
        
        if (secondaryRoll.total <= 5) {
          resultText = game.i18n.localize("RONIN.Broken.Result2a");
        } else {
          // Rolagem para determinar rodadas sem poder agir
          tertiaryRoll = new Roll("1d4");
          await tertiaryRoll.evaluate();
          
          // Rolagem para determinar PV após poder agir
          quaternaryRoll = new Roll("1d4");
          await quaternaryRoll.evaluate();
          
          // Usar format para substituir variáveis no texto
          resultText = game.i18n.format("RONIN.Broken.Result2b", {
            rounds: tertiaryRoll.total,
            hp: quaternaryRoll.total
          });
        }
        break;
      
      case 3:
        // Rolagem para determinar horas até a morte
        secondaryRoll = new Roll("1d2");
        await secondaryRoll.evaluate();
        
        // Usar format para substituir variáveis no texto
        resultText = game.i18n.format("RONIN.Broken.Result3", {
          hours: secondaryRoll.total
        });
        break;
      
      case 4:
        resultText = game.i18n.localize("RONIN.Broken.Result4");
        break;
    }
    
    // Prepara os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      mainRoll: mainRoll,
      resultText: resultText
    };
    
    // Renderiza o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/broken-roll-card.html", chatTemplateData);
    
    // Configura as opções de chat
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor: actor}),
      content: chatContent,
      sound: CONFIG.sounds.dice
    };
    
    // Verifica se o módulo Dice So Nice está ativo
    if (game.modules.get("dice-so-nice")?.active) {
      // Exibe a animação do Dice So Nice para a rolagem principal
      await game.dice3d.showForRoll(mainRoll);
      
      // Exibe as animações para rolagens secundárias se existirem
      if (secondaryRoll) await game.dice3d.showForRoll(secondaryRoll);
      if (tertiaryRoll) await game.dice3d.showForRoll(tertiaryRoll);
      if (quaternaryRoll) await game.dice3d.showForRoll(quaternaryRoll);
    }
    
    // Cria a mensagem de chat
    await ChatMessage.create(chatData);
    
    // Atualiza o HP do personagem baseado no resultado, se aplicável
    if (mainResult === 1) {
      // Se o resultado for 1, atualiza o HP para o valor determinado pelo tertiaryRoll
      if (tertiaryRoll) {
        await actor.update({"system.resources.hp.value": tertiaryRoll.total});
      }
    } else if (mainResult === 2 && secondaryRoll && secondaryRoll.total === 6) {
      // Se o resultado for 2 e o resultado secundário for 6, atualiza o HP para o valor determinado pelo quaternaryRoll
      if (quaternaryRoll) {
        await actor.update({"system.resources.hp.value": quaternaryRoll.total});
      }
    } else if (mainResult === 4) {
      // Se o resultado for 4 (Morto), atualiza o HP para 0
      await actor.update({"system.resources.hp.value": 0});
    }
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.BrokenRoll = BrokenRoll;

// Exportar a classe para uso via importação
export default BrokenRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de condição Quebrado carregado");
