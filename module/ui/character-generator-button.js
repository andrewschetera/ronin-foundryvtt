// module/ui/character-generator-button.js - Adiciona botão de gerador de personagens na interface

import { showCharacterGeneratorDialog } from "./character-generator-dialog.js";

/**
 * Em V13 muitos hooks passaram a fornecer HTMLElement ao invés de jQuery.
 * Esta função normaliza o argumento "html" para um HTMLElement.
 * - V13: html já é HTMLElement
 * - V12: html é jQuery, então usamos html[0]
 */
function getRootElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

Hooks.on("renderActorDirectory", (app, html) => {
  // Verificar se o usuário tem permissão para criar personagens
  if (!game.user?.can?.("ACTOR_CREATE")) return;

  const root = getRootElement(html);
  if (!root) return;

  // Encontrar o header da janela para inserir o botão
  const header = root.querySelector(".directory-header");
  if (!header) return;

  // Inserir o botão dentro do container de action-buttons
  const actionButtons = header.querySelector(".action-buttons") ?? header;
  if (!actionButtons) return;

  // Evitar duplicar o botão se o diretório re-renderizar
  if (actionButtons.querySelector(".character-generator-button")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("character-generator-button");
  button.innerHTML = `<i class="fas fa-magic"></i> ${game.i18n.localize("RONIN.CharacterGenerator.GenerateButton")}`;

  button.addEventListener("click", (ev) => {
    ev.preventDefault();
    showCharacterGeneratorDialog();
  });

  // Prepend: colocar antes dos outros botões (similar ao prepend do jQuery)
  actionButtons.prepend(button);
});

console.log("RONIN | Botão de gerador de personagens carregado.");
