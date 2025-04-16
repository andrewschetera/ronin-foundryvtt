// item.js - Implementação da classe Item para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Estende a classe base de Item para implementar funcionalidades específicas do sistema.
 * @extends {Item}
 */
class RoninItem extends Item {
  /**
   * Prepara os dados do item antes da renderização.
   * @override
   */
  prepareData() {
    super.prepareData();
    
    // Processar dados específicos com base no tipo do item
    const itemData = this;
    const systemData = itemData.system;
    
    // Processar dados com base no tipo
    switch (itemData.type) {
      case 'weapon':
        this._prepareWeaponData(systemData);
        break;
      case 'armor':
        this._prepareArmorData(systemData);
        break;
      case 'gear':
        this._prepareGearData(systemData);
        break;
      case 'text':
        this._prepareTextData(systemData);
        break;
    }
  }
  
  /**
   * Preparação específica para armas
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareWeaponData(itemData) {
    // Verificar se o campo damage existe
    if (!itemData.damage) {
      itemData.damage = "d6"; // Dano padrão
    }
  }
  
  /**
   * Preparação específica para armaduras
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareArmorData(itemData) {
    // Verificar se o campo protection existe
    if (!itemData.protection) {
      itemData.protection = "d2"; // Proteção padrão
    }
    
    // Verificar se o campo tier existe
    if (!itemData.tier) {
      itemData.tier = 1; // Tier padrão
    }
  }
  
  /**
   * Preparação específica para equipamentos
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareGearData(itemData) {
    // Verificar se o campo uses existe
    if (!itemData.uses) {
      itemData.uses = {
        value: 1,
        max: 1
      };
    }
  }
  
  /**
   * Preparação específica para textos
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareTextData(itemData) {
    // Verificar se o campo textType existe
    if (!itemData.textType) {
      itemData.textType = "unseen"; // Tipo padrão
    }
  }
  
  /**
   * Obtém o tipo do item localizado
   * @returns {string} O tipo do item localizado
   */
  get typeLabel() {
    // Se o item não tiver tipo ou o tipo não estiver nas configurações, retornar o tipo bruto
    if (!this.type || !RONIN.config.itemTypes[this.type]) {
      return this.type;
    }
    
    // Retornar o tipo localizado
    return game.i18n.localize(RONIN.config.itemTypes[this.type]);
  }
  
  /**
   * Método para usar um item (a ser implementado com base no tipo)
   */
  async use() {
    // Implementação básica a ser expandida no futuro
    console.log(`Usando item ${this.name} do tipo ${this.type}`);
    
    // Lógica específica por tipo
    switch (this.type) {
      case 'weapon':
        // Lógica para usar armas
        // Por exemplo, poderia iniciar uma rolagem de ataque
        break;
      case 'armor':
        // Lógica para usar armaduras
        break;
      case 'gear':
        // Lógica para usar equipamentos
        // Por exemplo, decrementar os usos
        if (this.system.uses && this.system.uses.value > 0) {
          await this.update({'system.uses.value': this.system.uses.value - 1});
        }
        break;
      case 'text':
        // Lógica para usar textos
        break;
    }
  }
}

// Adicionar a classe ao namespace RONIN
RONIN.Item = RoninItem;

// Exportar a classe
export default RoninItem;
