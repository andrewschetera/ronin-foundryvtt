// text-roll.js - Sistema de rolagem para uso de Textos para RONIN

// Inicializa o namespace global
window.RONIN = window.RONIN || {};

/**
 * Módulo de Rolagem de Texto para o sistema RONIN
 */
class TextRoll {
/**
 * Função principal para rolagem de uso de Texto
 * @param {Object} item - Item do tipo texto sendo usado
 * @param {Object} actor - Ator que está usando o texto
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
  
  // Verificar se o ator possui usos de texto disponíveis
  const textsValue = actor.system.resources.texts.value;
  
  if (textsValue <= 0) {
    // Não há usos disponíveis, exibir aviso
    ui.notifications.warn(game.i18n.localize("RONIN.Texts.NoUsesAvailable"));
    return;
  }
  
  // Verificar se o personagem está usando armadura média ou pesada
  const equippedArmors = actor.items.filter(i => i.type === "armor" && i.system.equipped);
  
  if (equippedArmors.length > 0) {
    const armor = equippedArmors[0];
    // Se a categoria máxima for 2 (Média) ou 3 (Pesada), não permitir a rolagem
    if (armor.system.maxCategory >= 2) {
      ui.notifications.warn(game.i18n.localize("RONIN.Texts.HeavyArmorRestriction"));
      return;
    }
  }
  
  // Verificar as armas equipadas
  const equippedWeapons = actor.items.filter(i => i.type === "weapon" && i.system.equipped);
  
  // Contar armas de uma mão e duas mãos equipadas
  const oneHandedWeapons = equippedWeapons.filter(w => w.system.hand === "one");
  const twoHandedWeapons = equippedWeapons.filter(w => w.system.hand === "two");
  
  // Se tiver uma arma de duas mãos equipada, não permitir a rolagem
  if (twoHandedWeapons.length > 0) {
    ui.notifications.warn(game.i18n.localize("RONIN.Texts.TwoHandedWeaponRestriction"));
    return;
  }
  
  // Se tiver duas armas de uma mão equipadas, não permitir a rolagem
  if (oneHandedWeapons.length >= 2) {
    ui.notifications.warn(game.i18n.localize("RONIN.Texts.DualWieldRestriction"));
    return;
  }
  
  // Obter o valor de Espírito do ator
  const spiritValue = actor.system.abilities.spirit.value;
  
  // Configurar os dados para o template do diálogo
  const templateData = {
    spiritValue: spiritValue
  };
  
  // Renderizar o template do diálogo
  const content = await renderTemplate("systems/ronin/templates/dialogs/text-use-dialog.html", templateData);
  
  // Criar o diálogo
  const dialog = new Dialog({
    title: game.i18n.localize("RONIN.Texts.TextDialog"),
    content: content,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: game.i18n.localize("RONIN.Rolls.Roll"),
        callback: html => this._onRoll(html, item, actor)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("RONIN.Rolls.Cancel")
      }
    },
    default: "roll"
  });
  
  dialog.render(true);
}
  
  /**
   * Processa a rolagem de uso de texto após o diálogo
   * @param {jQuery} html - Conteúdo HTML do diálogo
   * @param {Object} item - Item do tipo texto sendo usado
   * @param {Object} actor - Ator que está usando o texto
   * @private
   */
  static async _onRoll(html, item, actor) {
    try {
      // Obter os valores do diálogo
      const form = html[0].querySelector("form");
      const spiritValue = parseInt(actor.system.abilities.spirit.value);
      const modifier = parseInt(form.modifier.value) || 0;
      const difficultyRating = parseInt(form.difficultyRating.value) || 12;
      
      // Construir a fórmula da rolagem
      const formula = "1d20";
      
      // Criar a rolagem
      let roll = new Roll(formula);
      
      // Avaliar a rolagem
      await roll.evaluate();
      
      // Obter o resultado do d20
      const d20Result = roll.terms[0].results[0].result;
      
      // Calcular o resultado total
      const totalResult = d20Result + spiritValue + modifier;
      
      // Determinar o sucesso ou falha
      const isSuccess = totalResult >= difficultyRating;
      const isCrit = d20Result === 20;
      const isFumble = d20Result === 1;
      
      // Inicializar variáveis para resultados adicionais
      let damageRoll = null;
      let hasKamiRevengeTable = false;
      let kamiTableId = null;
      
      // Se for uma falha, rolar o dano
      if (!isSuccess && !isFumble) {
        damageRoll = new Roll("1d2");
        await damageRoll.evaluate();
        
        // Aplicar o dano ao personagem
        const currentHP = actor.system.resources.hp.value;
        const newHP = Math.max(0, currentHP - damageRoll.total);
        await actor.update({"system.resources.hp.value": newHP});
      }
      
      // Se for uma falha crítica, procurar pela tabela de Vingança de Kami
      if (isFumble) {
        // Verificar nome da tabela localizado
        const localizedTableName = game.i18n.localize("RONIN.Texts.KamiRevengeTable");
        
        // Buscar a tabela
        let kamiTable = game.tables.find(t => t.name === localizedTableName);
        
        // Se não encontrou com o nome localizado, procurar alternativas
        if (!kamiTable) {
          kamiTable = game.tables.find(t => t.name === "Vingança de Kami" || t.name === "Kami's Revenge");
        }
        
        // Se encontrou a tabela, preparar para o botão
        if (kamiTable) {
          hasKamiRevengeTable = true;
          kamiTableId = kamiTable.id;
        }
      }
      
      // Diminuir o número de usos de texto disponíveis
      const newTextsValue = Math.max(0, actor.system.resources.texts.value - 1);
      await actor.update({"system.resources.texts.value": newTextsValue});
      
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
        item: item,
        rollDetails: true,
        spiritValue: spiritValue,
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
        hasKamiRevengeTable: hasKamiRevengeTable,
        kamiTableId: kamiTableId
      };
      
      // Renderizar o template do chat-card
      const chatContent = await renderTemplate("systems/ronin/templates/chat/text-use-card.html", chatTemplateData);
      
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
        
        // Se houve rolagem de dano, exibe a animação
        if (damageRoll) {
          await game.dice3d.showForRoll(damageRoll);
        }
      }
      
      // Cria a mensagem de chat
      await ChatMessage.create(chatData);
      
    } catch (error) {
      console.error("Erro ao usar texto:", error);
      ui.notifications.error(`Erro ao usar texto: ${error.message}`);
    }
  }
  
  /**
   * Rola na tabela de Vingança de Kami
   * @param {string} tableId - ID da tabela de Vingança de Kami
   * @static
   */
  static async rollKamiRevengeTable(tableId) {
    // Obter a tabela pelo ID
    const table = game.tables.get(tableId);
    
    if (table) {
      try {
        // Rolar na tabela com animação do Dice So Nice se disponível
        const dsn = game.modules.get("dice-so-nice")?.active;
        const result = await table.draw({displayChat: true});
        
        // Mostrar a animação dos dados se o DSN estiver ativo e há uma rolagem
        if (dsn && result.roll) {
          await game.dice3d.showForRoll(result.roll);
        }
        
        return result;
      } catch (error) {
        console.error("Erro ao rolar na tabela:", error);
        ui.notifications.error(`Erro ao rolar na tabela: ${error.message}`);
      }
    } else {
      ui.notifications.error("Tabela de Vingança de Kami não encontrada.");
    }
  }
}

// Adicionar a classe ao namespace RONIN
window.RONIN.TextRoll = TextRoll;

// Exportar a classe para uso via importação
export default TextRoll;

// Notificar que o módulo foi carregado
console.log("RONIN | Módulo de rolagem de Texto carregado");

// Adicionar o listener para o botão de rolagem na tabela de Vingança de Kami
Hooks.on("renderChatMessage", (message, html, data) => {
  html.find(".roll-kami-revenge-button").click(async (event) => {
    event.preventDefault();
    
    // Obter os dados do botão
    const button = event.currentTarget;
    const tableId = button.dataset.tableId;
    
    // Rolar na tabela
    await TextRoll.rollKamiRevengeTable(tableId);
  });
});
