// moral-roll.js - Sistema de rolagem de Moral para inimigos do RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Moral para o sistema RONIN
 */
class MoralRoll {
  /**
   * Função principal para rolagem de Moral
   * @param {Object} actor - Inimigo que está sendo testado
   */
  static async roll(actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Verifica se o actor é um inimigo
    if (actor.type !== "enemy") {
      ui.notifications.warn("Apenas inimigos podem fazer testes de Moral.");
      return;
    }
    
    try {
      // Obtém o valor de Moral do inimigo
      const moralValue = actor.system.moral.value;
      
      // Realiza a rolagem de 2d6
      const roll = new Roll("2d6");
      await roll.evaluate();
      
      // Obtém o resultado da rolagem
      const rollResult = roll.total;
      
      // Compara o resultado com o valor de Moral
      const isDemoralized = rollResult > moralValue;
      
      // Resultados adicionais da tabela (se houver)
      let tableResult = null;
      let foundTable = false;
      
      // Se estiver desmoralizado, tenta rolar na tabela Moral
      if (isDemoralized) {
        // Obter o nome localizado da tabela
        const tableName = game.i18n.localize("RONIN.Enemy.Moral");
        
        // Procurar a tabela pelo nome
        const moralTable = game.tables.find(t => t.name === tableName);
        
        if (moralTable) {
          foundTable = true;
          try {
            // Rolar na tabela
            const result = await moralTable.draw({ displayChat: false });
            
            if (result.results && result.results.length > 0) {
              tableResult = result.results[0].text;
            }
          } catch (error) {
            console.error("Erro ao rolar na tabela de Moral:", error);
          }
        }
      }
      
      // Preparar os dados para o chat-card
      const chatTemplateData = {
        actor: actor,
        roll: roll,
        moralValue: moralValue,
        rollResult: rollResult,
        isDemoralized: isDemoralized,
        foundTable: foundTable,
        tableResult: tableResult,
        demoralizedText: game.i18n.localize("RONIN.Enemy.Demoralized")
      };
      
      // Renderizar o template do chat-card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/moral-roll-card.html", chatTemplateData);
      
      // Configurar as opções de chat
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: chatContent,
        sound: CONFIG.sounds.dice
      };
      
      // Verificar se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        await game.dice3d.showForRoll(roll);
      }
      
      // Criar a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao realizar o teste de Moral:", error);
      ui.notifications.error(`Erro ao realizar o teste de Moral: ${error.message}`);
    }
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.MoralRoll = MoralRoll;

// Exportar a classe
export default MoralRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de Moral carregado");
