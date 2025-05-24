// ability-roll.js - Sistema de rolagem de habilidades para RONIN (modificado para suporte ao modo solo)

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
      
      // Verificar se o modo Solo está ativado
      const useSoloRules = game.settings.get("ronin", "useSoloRules");
      
      // Se estiver usando regras solo, faz duas rolagens
      if (useSoloRules) {
        // Realizar a primeira rolagem
        let roll1 = new Roll(formula);
        await roll1.evaluate();
        
        // Realizar a segunda rolagem
        let roll2 = new Roll(formula);
        await roll2.evaluate();
        
        // Obter os resultados dos d20
        const d20Result1 = roll1.terms[0].results[0].result;
        const d20Result2 = roll2.terms[0].results[0].result;
        
        // Calcular os resultados totais
        const totalResult1 = d20Result1 + abilityValue + modifier;
        const totalResult2 = d20Result2 + abilityValue + modifier;
        
        // Determinar o sucesso ou falha de cada rolagem
        const isSuccess1 = totalResult1 >= finalDR;
        const isSuccess2 = totalResult2 >= finalDR;
        const isCrit1 = d20Result1 === 20;
        const isCrit2 = d20Result2 === 20;
        const isFumble1 = d20Result1 === 1;
        const isFumble2 = d20Result2 === 1;
        
        // Determinar o resultado final (sucesso completo, parcial ou falha)
        let soloResult = "";
        if (isSuccess1 && isSuccess2) {
          soloResult = "complete-success";
        } else if (isSuccess1 || isSuccess2) {
          soloResult = "partial-success";
        } else {
          soloResult = "failure";
        }
        
        // Define o resultado da rolagem para o chat-card (compatibilidade com o sistema existente)
        let rollResult = "";
        if ((isCrit1 && isCrit2) || (isCrit1 && isSuccess2) || (isSuccess1 && isCrit2)) {
          rollResult = "crit";
        } else if ((isFumble1 && isFumble2) || (isFumble1 && !isSuccess2) || (!isSuccess1 && isFumble2)) {
          rollResult = "fumble";
        } else if (soloResult === "complete-success") {
          rollResult = "success";
        } else if (soloResult === "partial-success") {
          rollResult = "partial"; // Novo tipo de resultado para sucesso parcial
        } else {
          rollResult = "failure";
        }
        
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
          d20Result1: d20Result1,
          d20Result2: d20Result2,
          modifier: modifier,
          modifierText: modifierText,
          totalResult1: totalResult1,
          totalResult2: totalResult2,
          baseDR: baseDR,
          difficultyRating: finalDR,
          isSuccess1: isSuccess1,
          isSuccess2: isSuccess2,
          isCrit1: isCrit1,
          isCrit2: isCrit2,
          isFumble1: isFumble1,
          isFumble2: isFumble2,
          rollResult: rollResult,
          soloResult: soloResult,
          useSoloRules: true,
          isOverencumbered: isOverencumbered,
          overencumberedPenalty: overencumberedPenalty,
          isSwiftness: abilityKey === 'swiftness',
          armorSwiftnessPenalty: armorSwiftnessPenalty,
          showSwiftnessPenalty: abilityKey === 'swiftness' && armorSwiftnessPenalty > 0
        };
        
        // Renderiza o template do chat-card para o modo solo
        const chatContent = await renderTemplate("systems/ronin/templates/chat/ability-roll-solo-card.html", chatTemplateData);
        
        // Configura as opções de chat
        const chatData = {
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({actor: actor}),
          content: chatContent,
          sound: CONFIG.sounds.dice
        };
        
        // Verifica se o módulo Dice So Nice está ativo
        if (game.modules.get("dice-so-nice")?.active) {
          // Exibe a animação do Dice So Nice para as duas rolagens
          await game.dice3d.showForRoll(roll1);
          await game.dice3d.showForRoll(roll2);
        }
        
        // Cria a mensagem de chat
        await ChatMessage.create(chatData);
      } else {
        // Modo normal (não-solo) - Usa o código original
        
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
          showSwiftnessPenalty: abilityKey === 'swiftness' && armorSwiftnessPenalty > 0,
          useSoloRules: false
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
      }
      
    } catch (error) {
      console.error("Erro ao realizar a rolagem:", error);
      ui.notifications.error(`Erro ao realizar a rolagem: ${error.message}`);
    }
  }
};

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de habilidades carregado");
