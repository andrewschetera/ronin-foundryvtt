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
  
  // Cálculo de HP removido - agora o HP máximo será definido manualmente pelo usuário
  
  // Calcular capacidade de carga
  let totalWeight = 0;
  
  // Percorre todos os itens
  if (actorData.items && actorData.items.size > 0) {
    actorData.items.forEach(item => {
      if (item.system && item.system.weight) {
        // Ignorar armaduras equipadas
        if (item.type === "armor" && item.system.equipped) {
          return;
        }
        
        // Determinar o peso base com base no tipo de peso
        let baseWeight = 0;
        if (item.system.weight === "normal") baseWeight = 1;
        else if (item.system.weight === "heavy") baseWeight = 2;
        // Itens "small" ou "none" não adicionam peso (0)
        
        // Para itens com quantidade, multiplicar pelo quantidade
        if (["gear", "ammo", "consumable"].includes(item.type) && item.system.quantity !== undefined) {
          totalWeight += baseWeight * item.system.quantity;
        } else {
          // Para outros tipos de item (armas, etc.), usar apenas o peso base
          totalWeight += baseWeight;
        }
      }
    });
  }
  
  // Atribui o valor calculado à capacidade de carga
  if (!systemData.carryingCapacity) {
    systemData.carryingCapacity = { value: 0 };
  }
  systemData.carryingCapacity.value = totalWeight;
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
