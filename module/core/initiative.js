// module/core/initiative.js - Implementação da mecânica de iniciativa para o RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Módulo para gerenciar a iniciativa no sistema RONIN
 */
RONIN.initiative = {
  /**
   * Inicializa os hooks de iniciativa
   */
  init() {
    // Hooks para substituir o botão de rolagem de iniciativa
    Hooks.on("renderCombatTracker", this._onRenderCombatTracker.bind(this));
    
    console.log("RONIN | Sistema de iniciativa personalizado inicializado");
  },
  
  /**
   * Implementa a rolagem de iniciativa em grupo
   * @param {Combat} combat O objeto de combate
   */
  async rollGroupInitiative(combat) {
    if (!combat) return;

    // Rolar 1d6 uma única vez para determinar quem vai primeiro
    const roll = new Roll("1d6");
    await roll.evaluate({async: true});
    
    // Determinar os valores de iniciativa com base no resultado
    const result = roll.total;
    let characterInitiative, enemyInitiative;
    let enemiesFirst = false;
    
    if (result <= 3) {
      // Resultado 1-3: Inimigos vão primeiro (2), personagens depois (1)
      enemyInitiative = 2;
      characterInitiative = 1;
      enemiesFirst = true;
    } else {
      // Resultado 4-6: Personagens vão primeiro (2), inimigos depois (1)
      characterInitiative = 2;
      enemyInitiative = 1;
      enemiesFirst = false;
    }
    
    // Preparar dados para o template do chat card
    const templateData = {
      rollValue: result,
      enemiesFirst: enemiesFirst
    };
    
    // Renderizar o template para o chat card
    const chatContent = await renderTemplate("systems/ronin/templates/chat/initiative-roll-card.html", templateData);
    
    // Criar mensagem de chat com a rolagem e o card
    await roll.toMessage({
      flavor: game.i18n.localize("RONIN.Initiative.GroupRoll"),
      speaker: ChatMessage.getSpeaker({alias: game.i18n.localize("RONIN.Initiative.System")}),
      content: chatContent
    });
    
    // Aplicar os valores de iniciativa a todos os combatentes
    const updates = [];
    for (const combatant of combat.combatants) {
      // Se o combatant não tem o ator associado, pular
      if (!combatant.actor) continue;
      
      // Definir a iniciativa com base no tipo do ator
      if (combatant.actor.type === "character") {
        updates.push({_id: combatant.id, initiative: characterInitiative});
      } else if (combatant.actor.type === "enemy") {
        updates.push({_id: combatant.id, initiative: enemyInitiative});
      }
    }
    
    // Atualizar todas as iniciativas de uma só vez
    if (updates.length > 0) {
      await combat.updateEmbeddedDocuments("Combatant", updates);
    }
    
    // Re-renderizar o combat tracker para mostrar as mudanças
    ui.combat.render();
  },
  
  /**
   * Hook para substituir o botão de rolagem de iniciativa no Combat Tracker
   * @param {Application} app O Combat Tracker
   * @param {jQuery} html O HTML do Combat Tracker
   */
  _onRenderCombatTracker(app, html) {
    // Encontrar o botão "Roll All" de iniciativa
    const rollAllButton = html.find(".combat-control[data-control='rollAll']");
    
    // Se o botão existir, substituir seu comportamento
    if (rollAllButton.length) {
      // Atualizar o texto do botão para ser mais descritivo
      rollAllButton.attr("title", game.i18n.localize("RONIN.Initiative.RollAll"));
      
      // Substituir o comportamento do clique
      rollAllButton.off("click").on("click", event => {
        event.preventDefault();
        
        // Chamar nossa função personalizada de rolagem de iniciativa
        const combat = game.combat;
        if (combat) {
          this.rollGroupInitiative(combat);
        }
      });
    }
    
    // Encontrar os botões individuais de rolagem de iniciativa
    const rollNPCButton = html.find(".combat-control[data-control='rollNPC']");
    const rollInitiativeButtons = html.find(".combatant-control[data-control='rollInitiative']");
    
    // Desativar o botão "Roll NPC"
    if (rollNPCButton.length) {
      rollNPCButton.prop("disabled", true).attr("title", game.i18n.localize("RONIN.Initiative.DisabledIndividual"));
    }
    
    // Desativar os botões individuais de rolagem de iniciativa
    if (rollInitiativeButtons.length) {
      rollInitiativeButtons.prop("disabled", true).attr("title", game.i18n.localize("RONIN.Initiative.NoIndividual"));
    }
  }
};

// Exportar o módulo
export default RONIN.initiative;
