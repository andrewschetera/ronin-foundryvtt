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
    console.log(`${actor.name} está tentando realizar seppuku`);
    
    // Verificar se o módulo de rolagem de Seppuku existe
    if (!window.RONIN.SeppukuRoll) {
      console.error("Módulo de rolagem de Seppuku não encontrado no namespace RONIN");
      ui.notifications.error("Módulo de rolagem de Seppuku não disponível");
      
      // Tentar importar dinamicamente (apenas como fallback)
      try {
        import('../rolls/seppuku-roll.js').then(module => {
          if (module && module.default) {
            console.log("Módulo de rolagem de Seppuku carregado dinamicamente");
            module.default.roll(actor);
          } else {
            console.error("Falha ao importar módulo de rolagem de Seppuku");
          }
        }).catch(err => {
          console.error("Erro ao importar módulo de rolagem de Seppuku:", err);
        });
      } catch (error) {
        console.error("Erro ao tentar importação dinâmica:", error);
      }
      return;
    }
    
    // Se chegou aqui, o módulo existe, então realiza o Seppuku
    RONIN.SeppukuRoll.roll(actor);
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
