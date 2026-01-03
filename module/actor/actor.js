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
    } else if (actorData.type === 'enemy') {
      this._prepareEnemyData(actorData);
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
 * Prepara os dados específicos do inimigo.
 * @param {Object} actorData Os dados do ator
 * @private
 */
_prepareEnemyData(actorData) {
  // Referência ao sistema de dados do ator
  const systemData = actorData.system;
  
  // Garantir que os campos básicos existam
  if (!systemData.moral) {
    systemData.moral = { value: 12 };
  }
  
  if (!systemData.hp) {
    systemData.hp = { value: 10, max: 10 };
  }
  
  if (!systemData.attacks) {
    systemData.attacks = "";
  }
  
  if (!systemData.defenses) {
    systemData.defenses = "";
  }
  
  if (!systemData.special) {
    systemData.special = "";
  }
  
  if (!systemData.description) {
    systemData.description = "";
  }
  
  // Garantir que HP não seja negativo
  if (systemData.hp.value < 0) {
    systemData.hp.value = 0;
  }
  
  // Garantir que HP máximo seja pelo menos 1
  if (systemData.hp.max < 1) {
    systemData.hp.max = 1;
  }
  
  // Garantir que HP atual não seja maior que o máximo
  if (systemData.hp.value > systemData.hp.max) {
    systemData.hp.value = systemData.hp.max;
  }
  
  // Garantir que Moral não seja negativo
  if (systemData.moral.value < 0) {
    systemData.moral.value = 0;
  }
}

  /**
   * Método para realizar uma rolagem de habilidade (apenas para personagens)
   * @param {string} abilityKey A chave da habilidade a ser rolada
   */
  rollAbility(abilityKey) {
    // Apenas personagens podem fazer rolagens de habilidade
    if (this.type !== 'character') {
      ui.notifications.warn("Apenas personagens podem fazer rolagens de habilidade.");
      return;
    }
    
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
