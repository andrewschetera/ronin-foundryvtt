// ability-roll.js - Sistema de rolagem de habilidades para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

// Adiciona o módulo de rolagem de habilidades ao namespace
window.RONIN.AbilityRoll = {
  /**
   * Função principal para rolagem de habilidades
   * @param {string} abilityKey - Chave da habilidade (vigor, swiftness, spirit, resilience)
   * @param {Object} actor - Ator que está fazendo a rolagem
   */
  roll: async function(abilityKey, actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Obtém os dados da habilidade
    const abilityData = actor.system.abilities[abilityKey];
    if (!abilityData) {
      console.error(`Habilidade ${abilityKey} não encontrada no actor`);
      return;
    }
    
    // Obtém o nome localizado da habilidade
    let abilityName = game.i18n.localize(`RONIN.Abilities.${abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1)}`);
    
    // Obtém a abreviação localizada da habilidade
    let abilityAbbrev = game.i18n.localize(`RONIN.Abilities.Abbrev${abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1)}`);
    
    // Verificar se há penalidade por sobrecarga
    const maxCapacity = actor.system.abilities.vigor.value + 8;
    const isOverencumbered = actor.system.carryingCapacity.value >= maxCapacity;
    const showOverencumberedWarning = isOverencumbered && (abilityKey === 'vigor' || abilityKey === 'swiftness');
    
    // Verificar se estamos testando Rapidez e se há penalidade de armadura
    let armorSwiftnessPenalty = 0;
    let equippedArmor = null;
    
    if (abilityKey === 'swiftness') {
      // Procurar por armadura equipada
      const armors = actor.items.filter(i => i.type === "armor" && i.system.equipped);
      if (armors.length > 0) {
        equippedArmor = armors[0];
        // Obter a penalidade de rapidez da armadura
        armorSwiftnessPenalty = equippedArmor.system.swiftnessPenalty || 0;
      }
    }
    
    // Calcular a DR base para o teste
    const baseDR = 10;
    
    // Cria o título do diálogo
    const dialogTitle = game.i18n.format("RONIN.Rolls.AbilityCheck", {ability: abilityName});
    
    // Configura os dados para o template
    const templateData = {
      abilityName: abilityName,
      abilityValue: abilityData.value,
      isOverencumbered: showOverencumberedWarning,
      isSwiftness: abilityKey === 'swiftness',
      armorSwiftnessPenalty: armorSwiftnessPenalty,
      baseDR: baseDR
    };
    
    // Renderiza o template do diálogo
    const content = await renderTemplate("systems/ronin/templates/dialogs/ability-roll-dialog.html", templateData);
    
    // Cria e exibe o diálogo
    const dialog = new Dialog({
      title: dialogTitle,
      content: content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: game.i18n.localize("RONIN.Rolls.Roll"),
          callback: html => this._onRollAbility(html, abilityKey, abilityName, abilityAbbrev, actor, armorSwiftnessPenalty)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("RONIN.Rolls.Cancel")
        }
      },
      default: "roll"
    });
    
    dialog.render(true);
  },
  
  /**
   * Processa a rolagem de habilidade após o diálogo
   * @param {jQuery} html - Conteúdo HTML do diálogo
   * @param {string} abilityKey - Chave da habilidade
   * @param {string} abilityName - Nome localizado da habilidade
   * @param {string} abilityAbbrev - Abreviação localizada da habilidade
   * @param {Object} actor - Ator que está fazendo a rolagem
   * @param {number} armorSwiftnessPenalty - Penalidade de rapidez da armadura (para testes de rapidez)
   * @private
   */
  _onRollAbility: async function(html, abilityKey, abilityName, abilityAbbrev, actor, armorSwiftnessPenalty) {
    try {
      // Obtém os valores do diálogo
      const form = html[0].querySelector("form");
      const abilityValue = parseInt(actor.system.abilities[abilityKey].value);
      const modifier = parseInt(form.modifier.value) || 0;
      let baseDR = parseInt(form.difficultyRating.value) || 10;
      
      // Verificar se o personagem está com sobrecarga
      const maxCapacity = actor.system.abilities.vigor.value + 8;
      const isOverencumbered = actor.system.carryingCapacity.value >= maxCapacity;
      
      // Aplicar penalidade de DR +2 para Vigor e Swiftness quando sobrecarregado
      let overencumberedPenalty = 0;
      if (isOverencumbered && (abilityKey === 'vigor' || abilityKey === 'swiftness')) {
        overencumberedPenalty = 2;
        baseDR += overencumberedPenalty;
      }
      
      // Aplicar penalidade de Rapidez da armadura se for um teste de Rapidez
      let finalDR = baseDR;
      if (abilityKey === 'swiftness' && armorSwiftnessPenalty > 0) {
        finalDR += armorSwiftnessPenalty;
      }
      
      // Construir a fórmula da rolagem
      const formula = "1d20";
      
      // Cria a rolagem
      let roll = new Roll(formula);
      
      // Avalia a rolagem - Correção para API v12 do Foundry
      await roll.evaluate(); // Removida a opção {async: true} que está obsoleta
      
      // Obtém o resultado do d20
      const d20Result = roll.terms[0].results[0].result;
      
      // Calcula o resultado total
      const totalResult = d20Result + abilityValue + modifier;
      
      // Determina o sucesso ou falha
      const isSuccess = totalResult >= finalDR;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Define o resultado da rolagem
      let rollResult = "";
      if (isCrit) rollResult = "success";
      else if (isFumble) rollResult = "failure";
      else if (isSuccess) rollResult = "success";
      else rollResult = "failure";
      
      // Formata o modificador como texto
      let modifierText = "";
      if (modifier !== 0) {
        modifierText = modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
      }
      
      // Prepara os dados para o chat-card
      const chatTemplateData = {
        actor: actor,
        abilityName: abilityName,
        abilityAbbrev: abilityAbbrev,
        abilityValue: abilityValue,
        d20Result: d20Result,
        modifier: modifier,
        modifierText: modifierText,
        totalResult: totalResult,
        baseDR: baseDR,
        difficultyRating: finalDR,
        isSuccess: isSuccess,
        isCrit: isCrit,
        isFumble: isFumble,
        rollResult: rollResult,
        isOverencumbered: isOverencumbered,
        overencumberedPenalty: overencumberedPenalty,
        isSwiftness: abilityKey === 'swiftness',
        armorSwiftnessPenalty: armorSwiftnessPenalty,
        showSwiftnessPenalty: abilityKey === 'swiftness' && armorSwiftnessPenalty > 0
      };
      
      // Renderiza o template do chat-card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/ability-roll-card.html", chatTemplateData);
      
      // Configura as opções de chat
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: chatContent,
        sound: CONFIG.sounds.dice
      };
      
      // Verifica se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        // Exibe a animação do Dice So Nice
        console.log("Mostrando animação do Dice So Nice");
        await game.dice3d.showForRoll(roll);
      }
      
      // Cria a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao realizar a rolagem:", error);
      ui.notifications.error(`Erro ao realizar a rolagem: ${error.message}`);
    }
  }
};

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de habilidades carregado");
