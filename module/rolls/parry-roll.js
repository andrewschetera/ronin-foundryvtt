// parry-roll.js - Sistema de rolagem de Aparar para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Aparar para o sistema RONIN
 */
window.RONIN.ParryRoll = {
  /**
   * Função principal para rolagem de aparar
   * @param {Object} actor - Ator que está realizando a aparada
   */
  roll: async function(actor) {
    // Verifica se o actor é válido
    if (!actor) {
      console.error("Actor não encontrado");
      return;
    }
    
    // Obter dados de Resiliência
    const resilienceData = actor.system.abilities.resilience;
    
    // Obter nome localizado e abreviação de Resiliência
    const resilienceName = game.i18n.localize("RONIN.Abilities.Resilience");
    const resilienceAbbrev = game.i18n.localize("RONIN.Abilities.AbbrevResilience");
    
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
    
    // Obter armas equipadas
    const equippedWeapons = actor.items.filter(i => i.type === "weapon" && i.system.equipped);
    let selectedWeapon = null;
    let weaponDamage = "d6"; // Valor padrão
    
    // Calcular a DR base e DR de Aparar (incluindo penalidade de defesa da armadura)
    const baseDR = 12;
    const parryDR = baseDR + 2 + armorDefensePenalty; // Adiciona a penalidade de defesa ao DR de Aparar
    
    // Criar o título do diálogo
    const dialogTitle = game.i18n.localize("RONIN.Actions.Parry");
    
    // Configura os dados para o template
    const templateData = {
      resilienceName: resilienceName,
      resilienceAbbrev: resilienceAbbrev,
      resilienceValue: resilienceData.value,
      armorProtection: armorProtection,
      baseDR: baseDR,
      parryDR: parryDR,
      armorDefensePenalty: armorDefensePenalty,
      showDefensePenalty: armorDefensePenalty > 0,
      equippedWeapons: equippedWeapons,
      actorName: actor.name
    };
    
    // Renderiza o template do diálogo
    const content = await renderTemplate("systems/ronin/templates/dialogs/parry-roll-dialog.html", templateData);
    
    // Cria e exibe o diálogo
    const dialog = new Dialog({
      title: dialogTitle,
      content: content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: game.i18n.localize("RONIN.Rolls.Roll"),
          callback: html => this._onRollParry(html, actor, equippedArmor, equippedWeapons, resilienceName, resilienceAbbrev, armorDefensePenalty)
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
   * Processa a rolagem de aparar após o diálogo
   * @param {jQuery} html - Conteúdo HTML do diálogo
   * @param {Object} actor - Ator que está realizando a aparada
   * @param {Object} equippedArmor - Armadura equipada pelo ator
   * @param {Array} equippedWeapons - Armas equipadas pelo ator
   * @param {string} resilienceName - Nome localizado da característica de Resiliência
   * @param {string} resilienceAbbrev - Abreviação localizada da característica de Resiliência
   * @param {number} armorDefensePenalty - Penalidade de defesa da armadura
   * @private
   */
  _onRollParry: async function(html, actor, equippedArmor, equippedWeapons, resilienceName, resilienceAbbrev, armorDefensePenalty) {
    try {
      // Obtém os valores do diálogo
      const form = html[0].querySelector("form");
      const resilienceValue = parseInt(actor.system.abilities.resilience.value);
      const modifier = parseInt(form.modifier.value) || 0;
      const baseDR = parseInt(form.baseDR.value) || 12;
      const parryDR = parseInt(form.parryDR.value); // Obter diretamente do campo, que já foi calculado pelo script
      const enemyWeaponDamage = form.enemyWeaponDamage.value;
      const enemyArmorProtection = form.enemyArmorProtection.value;
      const armorProtection = form.armorProtection.value;
      
      // Obter a arma selecionada
      let selectedWeaponId = form.selectedWeapon ? form.selectedWeapon.value : null;
      let selectedWeapon = null;
      let weaponDamage = "d6"; // Valor padrão
      
      if (selectedWeaponId) {
        selectedWeapon = equippedWeapons.find(w => w.id === selectedWeaponId);
        if (selectedWeapon) {
          weaponDamage = selectedWeapon.system.damage;
        }
      } else if (equippedWeapons.length === 1) {
        // Se houver apenas uma arma equipada, use-a automaticamente
        selectedWeapon = equippedWeapons[0];
        weaponDamage = selectedWeapon.system.damage;
      }
      
      // Construir a fórmula da rolagem
      const formula = "1d20";
      
      // Cria a rolagem
      let roll = new Roll(formula);
      
      // Avalia a rolagem
      await roll.evaluate();
      
      // Obtém o resultado do d20
      const d20Result = roll.terms[0].results[0].result;
      
      // Calcula o resultado total
      const totalResult = d20Result + resilienceValue + modifier;
      
      // Determina o sucesso ou falha
      const isSuccess = totalResult >= parryDR;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Inicializa as variáveis de dano e proteção
      let attackDamageRoll = null;
      let attackDamageRoll2 = null; // Para crítico (dano dobrado)
      let defenseDamageRoll = null;
      let defenseDamageRoll2 = null; // Para falha crítica (dano dobrado)
      let attackArmorRoll = null;
      let defenseArmorRoll = null;
      let attackTotalDamage = 0;
      let defenseTotalDamage = 0;
      let attackFinalDamage = 0;
      let defenseFinalDamage = 0;
      
      // Se foi um sucesso ou crítico, rolar o dano de ataque
      if (isSuccess || isCrit) {
        // Rolar o dano da arma do personagem
        attackDamageRoll = new Roll(weaponDamage);
        await attackDamageRoll.evaluate();
        
        let damageTotal = attackDamageRoll.total;
        
        // Se foi crítico, rolar um segundo dano (dano dobrado)
        if (isCrit) {
          attackDamageRoll2 = new Roll(weaponDamage);
          await attackDamageRoll2.evaluate();
          damageTotal += attackDamageRoll2.total;
        }
        
        // Rolar a proteção da armadura do oponente
        attackArmorRoll = new Roll(enemyArmorProtection);
        await attackArmorRoll.evaluate();
        
        // Calcular o dano final (mínimo 0)
        attackTotalDamage = damageTotal;
        attackFinalDamage = Math.max(0, damageTotal - attackArmorRoll.total);
      } 
      // Se foi uma falha ou falha crítica, rolar o dano defensivo
      else {
        // Rolar o dano da arma do oponente
        defenseDamageRoll = new Roll(enemyWeaponDamage);
        await defenseDamageRoll.evaluate();
        
        let damageTotal = defenseDamageRoll.total;
        
        // Se foi falha crítica, rolar um segundo dano (dano dobrado)
        if (isFumble) {
          defenseDamageRoll2 = new Roll(enemyWeaponDamage);
          await defenseDamageRoll2.evaluate();
          damageTotal += defenseDamageRoll2.total;
        }
        
        // Rolar a proteção da armadura do personagem
        defenseArmorRoll = new Roll(armorProtection);
        await defenseArmorRoll.evaluate();
        
        // Calcular o dano final (mínimo 0)
        defenseTotalDamage = damageTotal;
        defenseFinalDamage = Math.max(0, damageTotal - defenseArmorRoll.total);
        
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
        selectedWeapon: selectedWeapon,
        equippedArmor: equippedArmor,
        resilienceValue: resilienceValue,
        resilienceName: resilienceName,
        resilienceAbbrev: resilienceAbbrev,
        d20Result: d20Result,
        modifier: modifier,
        modifierText: modifierText,
        totalResult: totalResult,
        baseDR: baseDR,
        parryDR: parryDR,
        armorDefensePenalty: armorDefensePenalty,
        showDefensePenalty: armorDefensePenalty > 0,
        isSuccess: isSuccess,
        isCrit: isCrit,
        isFumble: isFumble,
        rollResult: rollResult,
        attackDamageRoll: attackDamageRoll,
        attackDamageRoll2: attackDamageRoll2,
        attackArmorRoll: attackArmorRoll,
        attackTotalDamage: attackTotalDamage,
        attackFinalDamage: attackFinalDamage,
        defenseDamageRoll: defenseDamageRoll,
        defenseDamageRoll2: defenseDamageRoll2,
        defenseArmorRoll: defenseArmorRoll,
        defenseTotalDamage: defenseTotalDamage,
        defenseFinalDamage: defenseFinalDamage
      };
      
      // Renderiza o template do chat-card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/parry-roll-card.html", chatTemplateData);
      
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
        await game.dice3d.showForRoll(roll);
        
        // Se houve dano, exibe as animações dos dados de dano e armadura
        if (isSuccess || isCrit) {
          if (attackDamageRoll) await game.dice3d.showForRoll(attackDamageRoll);
          if (attackDamageRoll2) await game.dice3d.showForRoll(attackDamageRoll2);
          if (attackArmorRoll) await game.dice3d.showForRoll(attackArmorRoll);
        } else {
          if (defenseDamageRoll) await game.dice3d.showForRoll(defenseDamageRoll);
          if (defenseDamageRoll2) await game.dice3d.showForRoll(defenseDamageRoll2);
          if (defenseArmorRoll) await game.dice3d.showForRoll(defenseArmorRoll);
        }
      }
      
      // Cria a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao realizar a rolagem de aparar:", error);
      ui.notifications.error(`Erro ao realizar a rolagem de aparar: ${error.message}`);
    }
  }
};

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de aparar carregado");
