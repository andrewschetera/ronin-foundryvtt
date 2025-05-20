// module/ui/character-generator-dialog.js - Janela de diálogo para o gerador de personagens

// Função para exibir a janela de diálogo do gerador de personagens
export async function showCharacterGeneratorDialog() {
  // Preparar os dados para o template
  const templateData = {
    alignmentOptions: [
      { value: "honorable", label: game.i18n.localize("RONIN.CharacterGenerator.Honorable"), checked: false },
      { value: "normal", label: game.i18n.localize("RONIN.CharacterGenerator.Normal"), checked: true },
      { value: "dishonorable", label: game.i18n.localize("RONIN.CharacterGenerator.Dishonorable"), checked: false }
    ],
    availableClasses: [] // Pode ser preenchido no futuro com as classes disponíveis
  };
  
  // Renderizar o template HTML do diálogo
  const content = await renderTemplate("systems/ronin/templates/dialogs/character-generator-dialog.html", templateData);
  
  // Configurar os botões do diálogo
  const buttons = {
    ok: {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("OK"),
      callback: (html) => {
        // Lógica para gerar o personagem será implementada no futuro
        ui.notifications.info(game.i18n.localize("RONIN.CharacterGenerator.ComingSoon"));
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: game.i18n.localize("Cancel")
    }
  };
  
  // Criar e exibir o diálogo
  const dialog = new Dialog({
    title: game.i18n.localize("RONIN.CharacterGenerator.DialogTitle"),
    content: content,
    buttons: buttons,
    default: "cancel",
    width: 400, // Definir uma largura específica para o diálogo
    // Configurar event listeners após a renderização
    render: (html) => {
      // Adicionar listeners para os botões de seleção de classes
      html.find('.select-all-button').click(event => {
        event.preventDefault();
        // Lógica para selecionar todas as classes (será implementada no futuro)
        ui.notifications.info("Selecionar todas as classes - funcionalidade a ser implementada.");
      });
      
      html.find('.select-none-button').click(event => {
        event.preventDefault();
        // Lógica para desmarcar todas as classes (será implementada no futuro)
        ui.notifications.info("Desmarcar todas as classes - funcionalidade a ser implementada.");
      });
    }
  });
  
  dialog.render(true);
}
