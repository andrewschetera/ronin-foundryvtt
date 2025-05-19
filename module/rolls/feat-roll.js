// feat-roll.js - Sistema para ativação de características (feats) para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Ativação de Feats para o sistema RONIN
 */
class FeatRoll {
  /**
   * Função principal para ativação de feat
   * @param {Object} item - Item do tipo feat sendo ativado
   * @param {Object} actor - Ator que está ativando o feat
   */
  static async roll(item, actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Verifica se o item é válido
    if (!item) {
      console.error("Item não encontrado");
      return;
    }
    
    // Prepara os dados para o chat-card
    const chatTemplateData = {
      actor: actor,
      item: item
    };
    
    // Renderiza o template do chat-card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/feat-use-card.html", chatTemplateData);
    
    // Configura as opções de chat
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor: actor}),
      content: chatContent
    };
    
    // Cria a mensagem de chat
    await ChatMessage.create(chatData);
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.FeatRoll = FeatRoll;

// Exportar a classe para uso via importação
export default FeatRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de ativação de feats carregado");
