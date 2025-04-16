// actor.js - Implementação da classe Actor para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Estende a classe base de Actor para implementar funcionalidades específicas do sistema.
 * @extends {Actor}
 */
class RoninActor extends Actor {
  /**
   * Prepara os dados do ator antes da renderização.
   * @override
   */
  prepareData() {
    super.prepareData();

    const actorData = this;
    
    if (actorData.type === 'character') {
      this._prepareCharacterData(actorData);
    }
  }
  
  /**
   * Prepara os dados específicos do personagem.
   * @param {Object} actorData Os dados do ator
   * @private
   */
  _prepareCharacterData(actorData) {
    // Referência ao sistema de dados do ator
    const systemData = actorData.system;
    
    // Calcular HP máximo baseado em Vigor + Resiliência (apenas exemplo)
    if (systemData.abilities) {
      const vigor = systemData.abilities.vigor?.value || 0;
      const resilience = systemData.abilities.resilience?.value || 0;
      
      // Base HP é 10 + modificadores
      const baseHP = 10 + vigor + resilience;
      systemData.resources.hp.max = baseHP;
      
      // Garantir que o HP atual não ultrapasse o máximo
      if (systemData.resources.hp.value > systemData.resources.hp.max) {
        systemData.resources.hp.value = systemData.resources.hp.max;
      }
    }
    
    // Calcular ou processar outros atributos derivados aqui
  }
  
  /**
   * Método para realizar uma rolagem de habilidade
   * @param {string} abilityKey A chave da habilidade a ser rolada
   */
  rollAbility(abilityKey) {
    // Verificar se o módulo de rolagem está disponível
    if (RONIN.AbilityRoll) {
      RONIN.AbilityRoll.roll(abilityKey, this);
    } else {
      console.error("Módulo de rolagem de habilidade não encontrado");
      ui.notifications.error("Módulo de rolagem não disponível");
    }
  }
}

// Adicionar a classe ao namespace RONIN
RONIN.Actor = RoninActor;

// Exportar a classe
export default RoninActor;
