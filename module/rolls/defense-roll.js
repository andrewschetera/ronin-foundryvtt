// defense-roll.js - Sistema de rolagem de defesa para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Defesa para o sistema RONIN
 */
window.RONIN.DefenseRoll = {
  /**
   * Função principal para rolagem de defesa
   * @param {Object} actor - Ator que está realizando a defesa
   */
  roll: async function(actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Obter dados de Rapidez
    const swiftnessData = actor.system.abilities.swiftness;
    
    // Obter nome localizado e abreviação de Rapidez
    let swiftnessName = game.i18n.localize("RONIN.Abilities.Swiftness");
    let swiftnessAbbrev = game.i18n.localize("RONIN.Abilities.AbbrevSwiftness");
    
    // Obter dados da armadura equipada
    let armorProtection = "0";
    let armorDefensePenalty = 0;
    let equippedArmor = null;
    
    // Procurar por armadura equipada
    const armors = actor.items.filter(i => i.type === "armor" && i.system.equipped);
    if (armors.length > 0) {
      equippedArmor = armors[0];
      armorProtection = equippedArmor.system.protection;
      // Obter a penalidade de defesa da armadura
      armorDefensePenalty = equippedArmor.system.defensePenalty || 0;
    }
    
    // Calcular a DR base (sem a penalidade, ela será adicionada no momento da rolagem)
    const baseDR = 12;
    
    // Criar o título do diálogo
    const dialogTitle = game.i18n.localize("RONIN.Actions.Defend");
    
    // Configura os dados para o template
    const templateData = {
      swiftnessName: swiftnessName,
      swiftnessAbbrev: swiftnessAbbrev,
      swiftnessValue: swiftnessData.value,
      armorProtection: armorProtection,
      baseDR: baseDR,
      armorDefensePenalty: armorDefensePenalty,
      actorName: actor.name
    };
    
    // Renderiza o template do diálogo
    const content = await renderTemplate("systems/ronin/templates/dialogs/defense-roll-dialog.html", templateData);
    
    // Cria e exibe o diálogo
    const dialog = new Dialog({
      title: dialogTitle,
      content: content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: game.i18n.localize("RONIN.Rolls.Roll"),
          callback: html => this._onRollDefense(html, actor, equippedArmor, armorDefensePenalty)
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
   * Processa a rolagem de defesa após o diálogo
   * @param {jQuery} html - Conteúdo HTML do diálogo
   * @param {Object} actor - Ator que está realizando a defesa
   * @param {Object} equippedArmor - Armadura equipada pelo ator
   * @param {number} armorDefensePenalty - Penalidade de defesa da armadura
   * @private
   */
  _onRollDefense: async function(html, actor, equippedArmor, armorDefensePenalty) {
    try {
      // Obtém os valores do diálogo
      const form = html[0].querySelector("form");
      const swiftnessValue = parseInt(actor.system.abilities.swiftness.value);
      const modifier = parseInt(form.modifier.value) || 0;
      
      // Obtém o DR base do campo e ADICIONA a penalidade de defesa da armadura
      const baseDR = parseInt(form.difficultyRating.value) || 12;
      const difficultyRating = baseDR + armorDefensePenalty;
      
      const enemyWeaponDamage = form.enemyWeaponDamage.value;
      const armorProtection = form.armorProtection.value;
      
      // Construir a fórmula da rolagem
      const formula = "1d20";
      
      // Cria a rolagem
      let roll = new Roll(formula);
      
      // Avalia a rolagem
      await roll.evaluate();
      
      // Obtém o resultado do d20
      const d20Result = roll.terms[0].results[0].result;
      
      // Calcula o resultado total
      const totalResult = d20Result + swiftnessValue + modifier;
      
      // Determina o sucesso ou falha
      const isSuccess = totalResult >= difficultyRating;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Inicializa as variáveis de dano e proteção
      let enemyDamageRoll = null;
      let enemyDamageRoll2 = null; // Para falha crítica (dano dobrado)
      let armorRoll = null;
      let totalDamage = 0;
      let finalDamage = 0;
      
      // Se for uma falha ou falha crítica, rolar o dano
      if (!isSuccess || isFumble) {
        // Rolar o dano da arma inimiga
        enemyDamageRoll = new Roll(enemyWeaponDamage);
        await enemyDamageRoll.evaluate();
        
        let damageTotal = enemyDamageRoll.total;
        
        // Se foi falha crítica, rolar um segundo dano (dano dobrado)
        if (isFumble) {
          enemyDamageRoll2 = new Roll(enemyWeaponDamage);
          await enemyDamageRoll2.evaluate();
          damageTotal += enemyDamageRoll2.total;
        }
        
        // Rolar a proteção da armadura
        armorRoll = new Roll(armorProtection);
        await armorRoll.evaluate();
        
        // Calcular o dano final (mínimo 0)
        totalDamage = damageTotal;
        finalDamage = Math.max(0, damageTotal - armorRoll.total);
        
        // Se foi falha crítica e existe uma armadura equipada, reduzir sua categoria
        if (isFumble && equippedArmor) {
          const currentCategory = equippedArmor.system.currentCategory;
          // Só reduzir se a categoria atual for maior que 0
          if (currentCategory > 0) {
            await equippedArmor.update({"system.currentCategory": currentCategory - 1});
          }
        }
      }
      
      // Define o resultado da rolagem
      let rollResult = "";
      if (isCrit) rollResult = "crit";
      else if (isFumble) rollResult = "fumble";
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
        equippedArmor: equippedArmor,
        swiftnessValue: swiftnessValue,
        swiftnessName: game.i18n.localize("RONIN.Abilities.Swiftness"),
        swiftnessAbbrev: game.i18n.localize("RONIN.Abilities.AbbrevSwiftness"),
        d20Result: d20Result,
        modifier: modifier,
        modifierText: modifierText,
        totalResult: totalResult,
        difficultyRating: difficultyRating,
        baseDR: baseDR,
        armorDefensePenalty: armorDefensePenalty,
        isSuccess: isSuccess,
        isCrit: isCrit,
        isFumble: isFumble,
        rollResult: rollResult,
        enemyDamageRoll: enemyDamageRoll,
        enemyDamageRoll2: enemyDamageRoll2,
        armorRoll: armorRoll,
        totalDamage: totalDamage,
        finalDamage: finalDamage,
        showDefensePenalty: armorDefensePenalty > 0
      };
      
      // Renderiza o template do chat-card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/defense-roll-card.html", chatTemplateData);
      
      // Configura as opções de chat
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: chatContent,
        sound: CONFIG.sounds.dice
      };
      
      // Verifica se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        // Exibe a animação do Dice So Nice para a defesa
        await game.dice3d.showForRoll(roll);
        
        // Se houve dano, exibe as animações do dano e armadura
        if (enemyDamageRoll) {
          await game.dice3d.showForRoll(enemyDamageRoll);
          if (enemyDamageRoll2) await game.dice3d.showForRoll(enemyDamageRoll2);
          if (armorRoll) await game.dice3d.showForRoll(armorRoll);
        }
      }
      
      // Cria a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao realizar a rolagem de defesa:", error);
      ui.notifications.error(`Erro ao realizar a rolagem de defesa: ${error.message}`);
    }
  }
};

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de defesa carregado");
