// ronin.js - Arquivo principal do sistema RONIN

window.RONIN = window.RONIN || {};

import RONIN_initiative from "./initiative.js";

Hooks.once("init", async function () {
  console.log("ronin | Inicializando sistema RONIN");

  // Registrar configurações do sistema
  RONIN.Settings.registerSettings();

  CONFIG.RONIN = CONFIG.RONIN || {};

  // Define tipos de atores personalizados
  CONFIG.Actor.documentClass = RONIN.Actor;
  CONFIG.Item.documentClass = RONIN.Item;

  // Registrar folhas (V13+)
  const { DocumentSheetConfig } = foundry.applications.apps;

  DocumentSheetConfig.unregisterSheet(
    Actor,
    "core",
    foundry.appv1.sheets.ActorSheet
  );
  DocumentSheetConfig.registerSheet(Actor, "ronin", RONIN.ActorSheet, {
    types: ["character", "enemy"],
    makeDefault: true,
  });

  DocumentSheetConfig.unregisterSheet(
    Item,
    "core",
    foundry.appv1.sheets.ItemSheet
  );
  DocumentSheetConfig.registerSheet(Item, "ronin", RONIN.ItemSheet, {
    makeDefault: true,
  });

  // Registrar helpers do Handlebars
  RONIN.registerHandlebarsHelpers();

  // Inicializar o sistema de iniciativa personalizado
  RONIN.initiative = RONIN_initiative;
  RONIN.initiative.init();

  // Garantir que os módulos de rolagem estão disponíveis
  console.log("ronin | Verificando módulos de rolagem");
  if (RONIN.AbilityRoll)
    console.log("ronin | Módulo de rolagem de habilidades está disponível");
  else console.warn("ronin | Módulo de rolagem de habilidades NÃO está disponível");

  if (RONIN.AttackRoll)
    console.log("ronin | Módulo de rolagem de ataques está disponível");
  else console.warn("ronin | Módulo de rolagem de ataques NÃO está disponível");
});

Hooks.once("ready", function () {
  console.log("ronin | Sistema RONIN carregado com sucesso");
  document.body.classList.add("ronin-system-loaded");

  if (!RONIN.AbilityRoll)
    console.error("ronin | ERRO: Módulo de rolagem de habilidades não foi carregado!");
  if (!RONIN.AttackRoll)
    console.error("ronin | ERRO: Módulo de rolagem de ataques não foi carregado!");
});
