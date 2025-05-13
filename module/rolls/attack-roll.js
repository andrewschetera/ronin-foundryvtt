// attack-roll.js - Sistema de rolagem de ataques para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Ataques para o sistema RONIN
 */
window.RONIN.AttackRoll = {
  /**
   * Função principal para rolagem de ataques
   * @param {Object} weapon - Item arma que está sendo usada
   * @param {Object} actor - Ator que está fazendo o ataque
   */
  roll: async function(weapon, actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Verifica se a arma é válida
    if (!weapon) {
      console.error("Arma não encontrada");
      return;
    }
    
    // Verificar se é uma arma à distância que usa munição
    if (weapon.system.weaponType === "ranged" && weapon.system.useAmmo) {
      // Verificar se uma munição foi selecionada
      if (!weapon.system.ammoId) {
        ui.notifications.warn(game.i18n.localize("RONIN.Equipment.NoAmmoSelected"));
        return;
      }
      
      // Obter o item de munição
      const ammoItem = actor.items.get(weapon.system.ammoId);
      
      // Verificar se a munição existe
      if (!ammoItem) {
        ui.notifications.warn(game.i18n.localize("RONIN.Equipment.NoAmmoSelected"));
        return;
      }
      
      // Verificar se há munição suficiente
      if (ammoItem.system.quantity <= 0) {
        ui.notifications.warn(game.i18n.localize("RONIN.Equipment.NoAmmoRemaining"));
        return;
      }
    }
    
    // Determina qual atributo usar com base no tipo de arma
    const isRanged = weapon.system.weaponType === "ranged";
    const abilityKey = isRanged ? "spirit" : "vigor";
    const abilityData = actor.system.abilities[abilityKey];
    
    // Obtém o nome localizado do atributo e a abreviação
    let abilityName = game.i18n.localize(`RONIN.Abilities.${abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1)}`);
    let abilityAbbrev = game.i18n.localize(`RONIN.Abilities.Abbrev${abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1)}`);
    
    // Cria o título do diálogo
    const dialogTitle = game.i18n.format("RONIN.Rolls.AttackWith", {weapon: weapon.name});
    
    // Configura os dados para o template
    const templateData = {
      weaponName: weapon.name,
      abilityName: abilityName,
      abilityAbbrev: abilityAbbrev,
      abilityValue: abilityData.value,
      weaponDamage: weapon.system.damage
    };
    
    // Renderiza o template do diálogo
    const content = await renderTemplate("systems/ronin/templates/dialogs/attack-roll-dialog.html", templateData);
    
    // Cria e exibe o diálogo
    const dialog = new Dialog({
      title: dialogTitle,
      content: content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: game.i18n.localize("RONIN.Rolls.Roll"),
          callback: html => this._onRollAttack(html, weapon, abilityKey, abilityName, abilityAbbrev, actor)
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
   * Processa a rolagem de ataque após o diálogo
   * @param {jQuery} html - Conteúdo HTML do diálogo
   * @param {Object} weapon - Item arma sendo usada
   * @param {string} abilityKey - Chave da habilidade (vigor ou spirit)
   * @param {string} abilityName - Nome localizado da habilidade
   * @param {string} abilityAbbrev - Abreviação localizada da habilidade
   * @param {Object} actor - Ator que está fazendo o ataque
   * @private
   */
  _onRollAttack: async function(html, weapon, abilityKey, abilityName, abilityAbbrev, actor) {
    try {
      // Consumir munição se for uma arma à distância que usa munição
      if (weapon.system.weaponType === "ranged" && weapon.system.useAmmo && weapon.system.ammoId) {
        const ammoItem = actor.items.get(weapon.system.ammoId);
        
        // Verificar novamente se a munição existe e tem quantidade suficiente
        if (!ammoItem || ammoItem.system.quantity <= 0) {
          ui.notifications.warn(game.i18n.localize("RONIN.Equipment.NoAmmoRemaining"));
          return;
        }
        
        // Reduzir a quantidade de munição em 1
        const newQuantity = Math.max(0, ammoItem.system.quantity - 1);
        await ammoItem.update({"system.quantity": newQuantity});
      }
      
      // Obtém os valores do diálogo
      const form = html[0].querySelector("form");
      const abilityValue = parseInt(actor.system.abilities[abilityKey].value);
      const modifier = parseInt(form.modifier.value) || 0;
      const difficultyRating = parseInt(form.difficultyRating.value) || 12;
      const damageFormula = form.damageFormula.value;
      const enemyArmor = form.enemyArmor.value;
      
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
      const isSuccess = totalResult >= difficultyRating;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Inicializa os dados de dano
      let damageRoll = null;
      let damageRoll2 = null; // Para crítico
      let armorRoll = null;
      let totalDamage = 0;
      let finalDamage = 0;
      
      // Se foi um acerto ou crítico, rola o dano
      if (isSuccess || isCrit) {
        // Rola o dano da arma
        damageRoll = new Roll(damageFormula);
        await damageRoll.evaluate(); // Correção para API v12
        
        let damageTotal = damageRoll.total;
        
        // Se foi crítico, rola um segundo dano
        if (isCrit) {
          damageRoll2 = new Roll(damageFormula);
          await damageRoll2.evaluate(); // Correção para API v12
          damageTotal += damageRoll2.total;
        }
        
        // Rola a armadura do inimigo
        armorRoll = new Roll(enemyArmor);
        await armorRoll.evaluate(); // Correção para API v12
        
        // Calcula o dano final (mínimo 0)
        totalDamage = damageTotal;
        finalDamage = Math.max(0, damageTotal - armorRoll.total);
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
        weapon: weapon,
        abilityName: abilityName,
        abilityAbbrev: abilityAbbrev,
        abilityValue: abilityValue,
        d20Result: d20Result,
        modifier: modifier,
        modifierText: modifierText,
        totalResult: totalResult,
        difficultyRating: difficultyRating,
        isSuccess: isSuccess,
        isCrit: isCrit,
        isFumble: isFumble,
        rollResult: rollResult,
        damageRoll: damageRoll,
        damageRoll2: damageRoll2,
        armorRoll: armorRoll,
        totalDamage: totalDamage,
        finalDamage: finalDamage
      };
      
      // Renderiza o template do chat-card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/attack-roll-card.html", chatTemplateData);
      
      // Configura as opções de chat
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: chatContent,
        sound: CONFIG.sounds.dice
      };
      
      // Verifica se o módulo Dice So Nice está ativo
      if (game.modules.get("dice-so-nice")?.active) {
        // Exibe a animação do Dice So Nice para o ataque
        await game.dice3d.showForRoll(roll);
        
        // Se houve dano, exibe as animações do dano e armadura
        if (damageRoll) {
          await game.dice3d.showForRoll(damageRoll);
          if (damageRoll2) await game.dice3d.showForRoll(damageRoll2);
          if (armorRoll) await game.dice3d.showForRoll(armorRoll);
        }
      }
      
      // Cria a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao realizar a rolagem de ataque:", error);
      ui.notifications.error(`Erro ao realizar a rolagem de ataque: ${error.message}`);
    }
  }
};

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de ataques carregado");
