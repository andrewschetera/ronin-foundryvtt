// module/ui/character-generator-button.js - Adiciona botão de gerador de personagens na interface

// Registrar o hook para quando a lista de atores for renderizada
Hooks.on('renderActorDirectory', (app, html, data) => {
  // Verificar se o usuário tem permissão para criar personagens
  if (game.user.can('ACTOR_CREATE')) {
    // Criar o botão com texto localizado
    const button = $(`<button class="character-generator-button">
      <i class="fas fa-magic"></i> ${game.i18n.localize("RONIN.CharacterGenerator.GenerateButton")}
    </button>`);
    
    // Adicionar um event listener temporariamente (sem funcionalidade real)
    button.click(ev => {
      ev.preventDefault();
      // Por enquanto, apenas mostrar uma notificação localizada
      ui.notifications.info(game.i18n.localize("RONIN.CharacterGenerator.ComingSoon"));
    });
    
    // Encontrar o header da janela para inserir o botão
    const header = html.find('.directory-header');
    
    // Inserir o botão antes do botão de criar personagem padrão
    header.find('.action-buttons').prepend(button);
  }
});

console.log("RONIN | Botão de gerador de personagens carregado.");
