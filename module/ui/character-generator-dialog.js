// module/ui/character-generator-dialog.js - Janela de diálogo para o gerador de personagens

// Função para exibir a janela de diálogo do gerador de personagens
export async function showCharacterGeneratorDialog() {
  // Buscar todas as classes disponíveis no sistema
  const availableClasses = await getAvailableClasses();
  
  // Preparar os dados para o template
  const templateData = {
    alignmentOptions: [
      { value: "honorable", label: game.i18n.localize("RONIN.CharacterGenerator.Honorable"), checked: false },
      { value: "normal", label: game.i18n.localize("RONIN.CharacterGenerator.Normal"), checked: true },
      { value: "dishonorable", label: game.i18n.localize("RONIN.CharacterGenerator.Dishonorable"), checked: false }
    ],
    availableClasses: availableClasses,
    hasClasses: availableClasses.length > 0
  };
  
  // Renderizar o template HTML do diálogo
  const content = await renderTemplate("systems/ronin/templates/dialogs/character-generator-dialog.html", templateData);
  
  // Configurar os botões do diálogo
  const buttons = {
    ok: {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("OK"),
      callback: (html) => {
        // Obter valores do formulário
        const form = html.find('form')[0];
        const alignment = form.alignment.value;
        
        // Obter classes selecionadas
        const selectedClasses = [];
        html.find('input[name="selectedClass"]:checked').each(function() {
          selectedClasses.push($(this).val());
        });
        
        // Lógica para gerar o personagem com as opções selecionadas
        console.log("Gerando personagem:", {
          alignment: alignment,
          selectedClasses: selectedClasses
        });
        
        // Notificar o usuário (temporário até implementação completa)
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
    width: 550, // Aumentar a largura para comportar as duas colunas
    classes: ["ronin-character-generator"], // Adiciona uma classe específica ao diálogo
    // Configurar event listeners após a renderização
    render: (html) => {
      // Adicionar listeners para os botões de seleção de classes
      html.find('.select-all-button').click(event => {
        event.preventDefault();
        html.find('input[name="selectedClass"]').prop('checked', true);
      });
      
      html.find('.select-none-button').click(event => {
        event.preventDefault();
        html.find('input[name="selectedClass"]').prop('checked', false);
      });
    }
  });
  
  dialog.render(true);
}

/**
 * Obter todas as classes disponíveis no sistema
 * @returns {Array} Array contendo informações de todas as classes
 */
async function getAvailableClasses() {
  // Buscar todos os itens de tipo "class" no compêndio ou como itens do mundo
  let classes = [];
  
  // Buscar classes de itens do mundo
  const worldItems = game.items.filter(i => i.type === "class");
  if (worldItems.length > 0) {
    classes = classes.concat(worldItems.map(c => ({
      id: c.id,
      name: c.name,
      img: c.img,
      description: c.system.description
    })));
  }
  
  // Buscar classes de compêndios (se existirem)
  for (let pack of game.packs) {
    if (pack.metadata.type === "Item") {
      const packIndex = await pack.getIndex();
      const classItems = packIndex.filter(i => i.type === "class");
      
      if (classItems.length > 0) {
        for (let idx of classItems) {
          const item = await pack.getDocument(idx._id);
          classes.push({
            id: item.id,
            name: item.name,
            img: item.img,
            description: item.system.description,
            pack: pack.collection
          });
        }
      }
    }
  }
  
  return classes;
}
