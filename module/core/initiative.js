// module/core/initiative.js - Implementação da mecânica de iniciativa para o RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Normaliza o HTML recebido em hooks para um HTMLElement.
 */
function getRootElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

/**
 * Módulo para gerenciar a iniciativa no sistema RONIN
 */
RONIN.initiative = {
  /**
   * Inicializa os hooks de iniciativa
   */
  init() {
    Hooks.on("renderCombatTracker", this._onRenderCombatTracker.bind(this));
    console.log("RONIN | Sistema de iniciativa personalizado inicializado");
  },

  /**
   * Implementa a rolagem de iniciativa em grupo
   * @param {Combat} combat O objeto de combate
   */
  async rollGroupInitiative(combat) {
    if (!combat) return;

    const dsn = game.modules.get("dice-so-nice")?.active;

    const roll = new Roll("1d6");
    await roll.evaluate();

    if (dsn) await game.dice3d.showForRoll(roll);

    const result = roll.total;
    let baseCharacterInitiative, baseEnemyInitiative;
    let enemiesFirst = false;

    if (result <= 3) {
      baseEnemyInitiative = 2;
      baseCharacterInitiative = 1;
      enemiesFirst = true;
    } else {
      baseCharacterInitiative = 2;
      baseEnemyInitiative = 1;
      enemiesFirst = false;
    }

    const templateData = { rollValue: result, enemiesFirst };
    const chatContent = await renderTemplate(
      "systems/ronin/templates/chat/initiative-roll-card.html",
      templateData
    );

    await ChatMessage.create({
      flavor: game.i18n.localize("RONIN.Initiative.GroupRoll"),
      speaker: ChatMessage.getSpeaker({
        alias: game.i18n.localize("RONIN.Initiative.System"),
      }),
      content: chatContent,
      sound: null,
    });

    const updates = [];
    const characterRolls = [];

    for (const combatant of combat.combatants) {
      if (!combatant.actor) continue;

      if (combatant.actor.type === "character") {
        const swiftnessValue =
          combatant.actor.system?.abilities?.swiftness?.value ?? 0;

        const individualRoll = new Roll("1d6");
        await individualRoll.evaluate();

        if (dsn) await game.dice3d.showForRoll(individualRoll);

        const rollTotal = individualRoll.total + swiftnessValue;
        const decimalPart = Math.min(99, Math.max(0, rollTotal));
        const decimalFormatted = decimalPart.toString().padStart(2, "0");
        const initiativeValue = Number(
          `${baseCharacterInitiative}.${decimalFormatted}`
        );

        updates.push({ _id: combatant.id, initiative: initiativeValue });

        characterRolls.push({
          name: combatant.name,
          roll: individualRoll,
          swiftness: swiftnessValue,
          total: rollTotal,
          initiative: initiativeValue,
        });
      } else if (combatant.actor.type === "enemy") {
        updates.push({ _id: combatant.id, initiative: baseEnemyInitiative });
      }
    }

    if (updates.length > 0) {
      await combat.updateEmbeddedDocuments("Combatant", updates);
    }

    if (characterRolls.length > 0) {
      const rollsTemplateData = { characterRolls };
      const rollsContent = await renderTemplate(
        "systems/ronin/templates/chat/initiative-character-rolls.html",
        rollsTemplateData
      );

      await ChatMessage.create({
        content: rollsContent,
        speaker: ChatMessage.getSpeaker({
          alias: game.i18n.localize("RONIN.Initiative.System"),
        }),
        whisper: ChatMessage.getWhisperRecipients("gm"),
        sound: null,
      });
    }

    ui.combat.render();
  },

  /**
   * Implementa uma rolagem simples para decidir quem vai primeiro
   * @param {Combat} combat O objeto de combate
   */
  async rollMainInitiative(combat) {
    if (!combat) return;

    const dsn = game.modules.get("dice-so-nice")?.active;

    const roll = new Roll("1d6");
    await roll.evaluate();

    if (dsn) await game.dice3d.showForRoll(roll);

    const result = roll.total;
    let baseCharacterInitiative, baseEnemyInitiative;
    let enemiesFirst = false;

    if (result <= 3) {
      baseEnemyInitiative = 2;
      baseCharacterInitiative = 1;
      enemiesFirst = true;
    } else {
      baseCharacterInitiative = 2;
      baseEnemyInitiative = 1;
      enemiesFirst = false;
    }

    const templateData = { rollValue: result, enemiesFirst };
    const chatContent = await renderTemplate(
      "systems/ronin/templates/chat/initiative-roll-card.html",
      templateData
    );

    await ChatMessage.create({
      flavor: game.i18n.localize("RONIN.Initiative.GroupRoll"),
      speaker: ChatMessage.getSpeaker({
        alias: game.i18n.localize("RONIN.Initiative.System"),
      }),
      content: chatContent,
      sound: null,
    });

    const updates = [];

    for (const combatant of combat.combatants) {
      if (!combatant.actor) continue;

      if (combatant.actor.type === "character") {
        updates.push({ _id: combatant.id, initiative: baseCharacterInitiative });
      } else if (combatant.actor.type === "enemy") {
        updates.push({ _id: combatant.id, initiative: baseEnemyInitiative });
      }
    }

    if (updates.length > 0) {
      await combat.updateEmbeddedDocuments("Combatant", updates);
    }

    ui.combat.render();
  },

  /**
   * Hook para substituir o botão de rolagem de iniciativa no Combat Tracker
   * @param {Application} app O Combat Tracker
   * @param {HTMLElement|jQuery} html O HTML do Combat Tracker (V13: HTMLElement)
   */
  _onRenderCombatTracker(app, html) {
    const root = getRootElement(html);
    if (!root) return;

    // Botão "Roll All"
    const rollAllButton = root.querySelector(
      ".combat-control[data-control='rollAll']"
    );

    if (rollAllButton) {
      rollAllButton.setAttribute(
        "title",
        game.i18n.localize("RONIN.Initiative.RollAll")
      );

      // Clona para remover listeners anteriores (equivalente ao off/on)
      const newBtn = rollAllButton.cloneNode(true);
      rollAllButton.replaceWith(newBtn);

      newBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const combat = game.combat;
        if (combat) this.rollGroupInitiative(combat);
      });
    }

    // Botão "Roll NPC" (você está reutilizando ele como "rolagem principal")
    const rollNPCButton = root.querySelector(
      ".combat-control[data-control='rollNPC']"
    );

    if (rollNPCButton) {
      rollNPCButton.setAttribute("title", "Rolagem Principal (Apenas 1d6)");

      const newBtn = rollNPCButton.cloneNode(true);
      rollNPCButton.replaceWith(newBtn);

      newBtn.disabled = false;

      newBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const combat = game.combat;
        if (combat) this.rollMainInitiative(combat);
      });
    }

    // Desativar botões individuais
    const rollInitiativeButtons = root.querySelectorAll(
      ".combatant-control[data-control='rollInitiative']"
    );

    for (const btn of rollInitiativeButtons) {
      btn.disabled = true;
      btn.setAttribute(
        "title",
        game.i18n.localize("RONIN.Initiative.NoIndividual")
      );
    }
  },
};

// Exportar o módulo
export default RONIN.initiative;
