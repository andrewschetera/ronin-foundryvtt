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
      case 'misc':
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
    
    // Verificar se o campo weaponType existe
    if (!itemData.weaponType) {
      itemData.weaponType = "melee"; // Tipo padrão
    }
    
    // Verificar se o campo hand existe
    if (!itemData.hand) {
      itemData.hand = "one"; // Padrão uma mão
    }
    
    // Verificar se o campo weight existe ou é válido
    if (!itemData.weight || (itemData.weight !== "small" && itemData.weight !== "normal" && itemData.weight !== "heavy")) {
      itemData.weight = "normal"; // Peso padrão
    }
    
    // Verificar se o campo useAmmo existe (para armas ranged)
    if (itemData.weaponType === "ranged" && itemData.useAmmo === undefined) {
      itemData.useAmmo = false; // Padrão não usar munição
    }
  }
  
/**
 * Preparação específica para armaduras
 * @param {Object} itemData Os dados do item
 * @private
 */
_prepareArmorData(itemData) {
  // Verificar se os campos das categorias existem
  // Convertendo explicitamente para números para evitar problemas com tipos
  if (itemData.maxCategory === undefined) {
    itemData.maxCategory = 1; // Categoria máxima padrão
  } else {
    // Garantir que maxCategory é um número
    itemData.maxCategory = Number(itemData.maxCategory);
  }
  
  if (itemData.currentCategory === undefined) {
    itemData.currentCategory = 1; // Categoria atual padrão 
  } else {
    // Garantir que currentCategory é um número
    itemData.currentCategory = Number(itemData.currentCategory);
  }
  
  // Garantir que a categoria atual não seja maior que a máxima
  if (itemData.currentCategory > itemData.maxCategory) {
    itemData.currentCategory = itemData.maxCategory;
  }
  
  // Atualizar o valor de proteção com base na categoria atual
  switch (itemData.currentCategory) {
    case 0:
      itemData.protection = "0";
      break;
    case 1:
      itemData.protection = "1d2";
      break;
    case 2:
      itemData.protection = "1d4";
      break;
    case 3:
      itemData.protection = "1d6";
      break;
    default:
      itemData.protection = "0";
  }
  
  // Inicializar as penalidades se não existirem
  if (itemData.swiftnessPenalty === undefined) {
    itemData.swiftnessPenalty = 0;
  }
  
  if (itemData.defensePenalty === undefined) {
    itemData.defensePenalty = 0;
  }
  
  // Verificar se o campo weight existe ou é válido
  if (!itemData.weight || !["small", "normal", "heavy"].includes(itemData.weight)) {
    itemData.weight = "normal"; // Peso padrão
  }
  
  // Garantir que o campo de descrição exista
  if (!itemData.description) {
    itemData.description = "";
  }
}
  
/**
 * Preparação específica para itens diversos (misc)
 * @param {Object} itemData Os dados do item
 * @private
 */
_prepareGearData(itemData) {
  // Verificar se o campo quantity existe
  if (itemData.quantity === undefined) {
    itemData.quantity = 0; // Agora o padrão é 0 em vez de 1
  }
  
  // Garantir que quantity seja um número, mas permitindo zero
  itemData.quantity = isNaN(Number(itemData.quantity)) ? 0 : Number(itemData.quantity);
  
  // Verificar se o campo isAmmo existe
  if (itemData.isAmmo === undefined) {
    itemData.isAmmo = false;
  }
  
  // Verificar se o campo weight existe ou é válido
  if (!itemData.weight || !["none", "small", "normal", "heavy"].includes(itemData.weight)) {
    itemData.weight = "normal"; // Peso padrão
  }
  
  // Garantir que o preço esteja inicializado
  if (itemData.price === undefined) {
    itemData.price = 0;
  }
  
  // Garantir que o campo de descrição exista
  if (!itemData.description) {
    itemData.description = "";
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
      case 'misc':
        // Lógica para usar equipamentos diversos
        // Por exemplo, decrementar os usos
        if (this.system.quantity > 0) {
          await this.update({'system.quantity': Math.max(0, this.system.quantity - 1)});
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
