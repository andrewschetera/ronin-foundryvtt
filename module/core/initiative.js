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

    // Verificar se o módulo Dice So Nice está ativo
    const dsn = game.modules.get("dice-so-nice")?.active;

    // 1. Rolagem Principal, com animação
    const roll = new Roll("1d6");
    await roll.evaluate();
    
    if (dsn) {
      await game.dice3d.showForRoll(roll);
    }
    
    // Determinar os valores de iniciativa com base no resultado
    const result = roll.total;
    let baseCharacterInitiative, baseEnemyInitiative;
    let enemiesFirst = false;
    
    if (result <= 3) {
      // Resultado 1-3: Inimigos vão primeiro (2), personagens depois (1)
      baseEnemyInitiative = 2;
      baseCharacterInitiative = 1;
      enemiesFirst = true;
    } else {
      // Resultado 4-6: Personagens vão primeiro (2), inimigos depois (1)
      baseCharacterInitiative = 2;
      baseEnemyInitiative = 1;
      enemiesFirst = false;
    }
    
    // 2. Exibição do chat-card da rolagem principal
    const templateData = {
      rollValue: result,
      enemiesFirst: enemiesFirst
    };
    
    const chatContent = await renderTemplate("systems/ronin/templates/chat/initiative-roll-card.html", templateData);
    
    await ChatMessage.create({
      flavor: game.i18n.localize("RONIN.Initiative.GroupRoll"),
      speaker: ChatMessage.getSpeaker({alias: game.i18n.localize("RONIN.Initiative.System")}),
      content: chatContent,
      sound: null // Evitar som duplicado
    });
    
    // Aplicar os valores de iniciativa a todos os combatentes
    const updates = [];
    const characterRolls = []; // Para armazenar as rolagens de personagens
    
    // 3. Rolagens individuais com animação
    for (const combatant of combat.combatants) {
      // Se o combatant não tem o ator associado, pular
      if (!combatant.actor) continue;
      
      if (combatant.actor.type === "character") {
        // Obter o valor de Swiftness do personagem
        const swiftnessValue = combatant.actor.system.abilities.swiftness.value || 0;
        
        // Rolar 1d6 para o modificador individual de iniciativa
        const individualRoll = new Roll("1d6");
        await individualRoll.evaluate();
        
        // Exibir a animação do Dice So Nice para essa rolagem individual
        if (dsn) {
          await game.dice3d.showForRoll(individualRoll);
        }
        
        // Calcular o valor decimal (de 0 a 99) para adicionar ao valor base
        const rollTotal = individualRoll.total + swiftnessValue;
        const decimalPart = Math.min(99, Math.max(0, rollTotal)); // Limitar entre 0 e 99
        
        // Formatar o valor decimal para sempre ter dois dígitos
        const decimalFormatted = decimalPart.toString().padStart(2, '0');
        
        // Combinar o valor base com o decimal para formar a iniciativa final
        // Exemplo: Se base=2 e decimal=45, iniciativa = 2.45
        const initiativeValue = parseFloat(`${baseCharacterInitiative}.${decimalFormatted}`);
        
        // Adicionar à lista de atualizações
        updates.push({_id: combatant.id, initiative: initiativeValue});
        
        // Armazenar os dados da rolagem para exibição
        characterRolls.push({
          name: combatant.name,
          roll: individualRoll,
          swiftness: swiftnessValue,
          total: rollTotal,
          initiative: initiativeValue
        });
      } else if (combatant.actor.type === "enemy") {
        // Para inimigos, usar apenas o valor base
        updates.push({_id: combatant.id, initiative: baseEnemyInitiative});
      }
    }
    
    // Atualizar todas as iniciativas de uma só vez
    if (updates.length > 0) {
      await combat.updateEmbeddedDocuments("Combatant", updates);
    }
    
    // 4. Exibição do chat-card das rolagens individuais
    if (characterRolls.length > 0) {
      // Preparar os dados para o template
      const rollsTemplateData = {
        characterRolls: characterRolls
      };
      
      // Renderizar o template de rolagens individuais
      const rollsContent = await renderTemplate("systems/ronin/templates/chat/initiative-character-rolls.html", rollsTemplateData);
      
      // Criar a mensagem de chat com as rolagens individuais
      await ChatMessage.create({
        content: rollsContent,
        speaker: ChatMessage.getSpeaker({alias: game.i18n.localize("RONIN.Initiative.System")}),
        whisper: ChatMessage.getWhisperRecipients("gm"),
        sound: null // Evitar som duplicado
      });
    }
    
    // Re-renderizar o combat tracker para mostrar as mudanças
    ui.combat.render();
  },
  
  /**
   * Implementa uma rolagem simples para decidir quem vai primeiro
   * @param {Combat} combat O objeto de combate
   */
  async rollMainInitiative(combat) {
    if (!combat) return;

    // Verificar se o módulo Dice So Nice está ativo
    const dsn = game.modules.get("dice-so-nice")?.active;

    // 1. Rolagem Principal, com animação
    const roll = new Roll("1d6");
    await roll.evaluate();
    
    if (dsn) {
      await game.dice3d.showForRoll(roll);
    }
    
    // Determinar os valores de iniciativa com base no resultado
    const result = roll.total;
    let baseCharacterInitiative, baseEnemyInitiative;
    let enemiesFirst = false;
    
    if (result <= 3) {
      // Resultado 1-3: Inimigos vão primeiro (2), personagens depois (1)
      baseEnemyInitiative = 2;
      baseCharacterInitiative = 1;
      enemiesFirst = true;
    } else {
      // Resultado 4-6: Personagens vão primeiro (2), inimigos depois (1)
      baseCharacterInitiative = 2;
      baseEnemyInitiative = 1;
      enemiesFirst = false;
    }
    
    // 2. Exibição do chat-card da rolagem principal
    const templateData = {
      rollValue: result,
      enemiesFirst: enemiesFirst
    };
    
    const chatContent = await renderTemplate("systems/ronin/templates/chat/initiative-roll-card.html", templateData);
    
    await ChatMessage.create({
      flavor: game.i18n.localize("RONIN.Initiative.GroupRoll"),
      speaker: ChatMessage.getSpeaker({alias: game.i18n.localize("RONIN.Initiative.System")}),
      content: chatContent,
      sound: null // Evitar som duplicado
    });
    
    // Aplicar os valores de iniciativa básicos a todos os combatentes (sem rolagens individuais)
    const updates = [];
    
    for (const combatant of combat.combatants) {
      if (!combatant.actor) continue;
      
      if (combatant.actor.type === "character") {
        updates.push({_id: combatant.id, initiative: baseCharacterInitiative});
      } else if (combatant.actor.type === "enemy") {
        updates.push({_id: combatant.id, initiative: baseEnemyInitiative});
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
    
    // Encontrar o botão "Roll NPC" e configurá-lo para fazer apenas a rolagem principal
    const rollNPCButton = html.find(".combat-control[data-control='rollNPC']");
    
    if (rollNPCButton.length) {
      // Atualizar o texto do botão
      rollNPCButton.attr("title", "Rolagem Principal (Apenas 1d6)");
      
      // Substituir o comportamento do clique para usar a nova função
      rollNPCButton.off("click").on("click", event => {
        event.preventDefault();
        
        // Chamar a função de rolagem principal
        const combat = game.combat;
        if (combat) {
          this.rollMainInitiative(combat);
        }
      });
      
      // Reativar o botão
      rollNPCButton.prop("disabled", false);
    }
    
    // Desativar os botões individuais de rolagem de iniciativa
    const rollInitiativeButtons = html.find(".combatant-control[data-control='rollInitiative']");
    
    if (rollInitiativeButtons.length) {
      rollInitiativeButtons.prop("disabled", true).attr("title", game.i18n.localize("RONIN.Initiative.NoIndividual"));
    }
  }
};

// Exportar o módulo
export default RONIN.initiative;
