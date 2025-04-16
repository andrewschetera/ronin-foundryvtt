// listeners.js - Funções de eventos compartilhadas para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Container para funções de eventos compartilhadas
 */
RONIN.listeners = {
  /**
   * Manipulador para clicar no botão "Broken"
   * @param {Object} actor O ator que está usando a ação
   */
  onBrokenButtonClick: function(actor) {
    console.log(`${actor.name} está utilizando a ação Broken`);
    // Implementar efeito da ação broken
    // Por exemplo, aplicar algum estado ou efeito temporário
  },
  
  /**
   * Manipulador para clicar no botão "Rest"
   * @param {Object} actor O ator que está usando a ação
   */
  onRestButtonClick: function(actor) {
    console.log(`${actor.name} está descansando`);
    // Implementar efeito do descanso
    // Por exemplo, recuperar parte do HP
    const hp = actor.system.resources.hp;
    const newHP = Math.min(hp.value + 2, hp.max); // Recupera 2 pontos de HP, até o máximo
    
    // Atualizar o HP do ator
    actor.update({'system.resources.hp.value': newHP});
    
    // Notificar a recuperação
    ui.notifications.info(`${actor.name} recuperou 2 pontos de vida descansando.`);
  },
  
  /**
   * Manipulador para clicar no botão "Seppuku"
   * @param {Object} actor O ator que está usando a ação
   */
  onSeppukuButtonClick: function(actor) {
    console.log(`${actor.name} está realizando seppuku`);
    // Implementar efeito do seppuku
    // Por exemplo, causar dano massivo mas recuperar honor
    
    // Confirmar a ação com um diálogo
    const d = new Dialog({
      title: "Confirmar Seppuku",
      content: "<p>Tem certeza que deseja realizar seppuku? Esta ação causará dano severo ao seu personagem.</p>",
      buttons: {
        confirm: {
          icon: '<i class="fas fa-skull"></i>',
          label: "Confirmar",
          callback: () => {
            // Reduzir HP para 0
            actor.update({'system.resources.hp.value': 0});
            
            // Aumentar honor (exemplo)
            const currentHonor = actor.system.resources.honor.value;
            if (currentHonor < 20) {
              actor.update({'system.resources.honor.value': currentHonor + 1});
            }
            
            // Notificar o efeito
            ui.notifications.warn(`${actor.name} realizou seppuku, caindo a 0 HP mas recuperando honor.`);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "cancel"
    });
    d.render(true);
  },
  
  /**
   * Manipulador para clicar no botão "Get Better"
   * @param {Object} actor O ator que está usando a ação
   */
  onGetBetterButtonClick: function(actor) {
    console.log(`${actor.name} está tentando melhorar`);
    // Implementar efeito de melhoria
    // Por exemplo, permitir gasto de pontos de experiência
    
    // Esta é uma implementação básica, pode ser expandida para um sistema mais complexo
    ui.notifications.info(`Funcionalidade "Get Better" será implementada em uma atualização futura.`);
  },
  
  /**
   * Manipulador para ações de combate - Defesa
   * @param {Object} actor O ator que está usando a ação
   */
  onDefendButtonClick: function(actor) {
    console.log(`${actor.name} está se defendendo`);
    // Implementar mecânica de defesa
    
    // Exemplo de criação de efeito temporário
    // Aqui poderíamos criar um efeito no ator que aumenta sua defesa temporariamente
    ui.notifications.info(`${actor.name} está em postura defensiva até seu próximo turno.`);
  },
  
  /**
   * Manipulador para ações de combate - Aparar
   * @param {Object} actor O ator que está usando a ação
   */
  onParryButtonClick: function(actor) {
    console.log(`${actor.name} está preparado para aparar um ataque`);
    // Implementar mecânica de aparar
    
    // Exemplo de criação de efeito temporário
    // Aqui poderíamos criar um efeito no ator que permite aparar o próximo ataque
    ui.notifications.info(`${actor.name} está preparado para aparar o próximo ataque.`);
  }
};

// Exportar o módulo de listeners
export default RONIN.listeners;
