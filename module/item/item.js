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
      case 'ammo':
        this._prepareAmmoData(systemData);
        break;
      case 'consumable':
        this._prepareConsumableData(systemData);
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
    
    // Inicializar o campo ammoId se necessário
    if (itemData.ammoId === undefined) {
      itemData.ammoId = null;
    }
    
    // Se a arma não for ranged ou não usar munição, garantir que ammoId seja null
    if (itemData.weaponType !== "ranged" || !itemData.useAmmo) {
      itemData.ammoId = null;
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
   * Preparação específica para equipamentos (gear)
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareGearData(itemData) {
    // Verificar se o campo quantity existe
    if (itemData.quantity === undefined) {
      itemData.quantity = 1;
    }
    
    // Garantir que quantity seja um número, mas permitindo zero
    itemData.quantity = isNaN(Number(itemData.quantity)) ? 1 : Number(itemData.quantity);
    
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
   * Preparação específica para munições (ammo)
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareAmmoData(itemData) {
    // Verificar se o campo quantity existe
    if (itemData.quantity === undefined) {
      itemData.quantity = 10; // Valor padrão para munição
    }
    
    // Garantir que quantity seja um número
    itemData.quantity = isNaN(Number(itemData.quantity)) ? 10 : Number(itemData.quantity);
    
    // Verificar se o campo weight existe ou é válido
    if (!itemData.weight || !["none", "small", "normal", "heavy"].includes(itemData.weight)) {
      itemData.weight = "small"; // Peso padrão para munição
    }
    
    // Inicializar array de compatibilidade se não existir
    if (!itemData.compatible || !Array.isArray(itemData.compatible)) {
      itemData.compatible = [];
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
   * Preparação específica para consumíveis (consumable)
   * @param {Object} itemData Os dados do item
   * @private
   */
  _prepareConsumableData(itemData) {
    // Verificar se o campo quantity existe
    if (itemData.quantity === undefined) {
      itemData.quantity = 1;
    }
    
    // Garantir que quantity seja um número
    itemData.quantity = isNaN(Number(itemData.quantity)) ? 1 : Number(itemData.quantity);
    
    // Inicializar os usos se não existirem
    if (!itemData.uses) {
      itemData.uses = { value: 1, max: 1 };
    } else {
      // Garantir que value e max existam e sejam números
      if (itemData.uses.value === undefined) {
        itemData.uses.value = 1;
      } else {
        itemData.uses.value = Number(itemData.uses.value);
      }
      
      if (itemData.uses.max === undefined) {
        itemData.uses.max = 1;
      } else {
        itemData.uses.max = Number(itemData.uses.max);
      }
      
      // Garantir que value não seja maior que max
      if (itemData.uses.value > itemData.uses.max) {
        itemData.uses.value = itemData.uses.max;
      }
    }
    
    // Verificar se o tipo de consumível existe e é válido
    if (!itemData.consumableType || !RONIN.config.equipment.consumableTypes.includes(itemData.consumableType)) {
      itemData.consumableType = "potion"; // Tipo padrão
    }
    
    // Verificar se o campo weight existe ou é válido
    if (!itemData.weight || !["none", "small", "normal", "heavy"].includes(itemData.weight)) {
      itemData.weight = "small"; // Peso padrão para consumível
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
      case 'gear':
        // Lógica para usar equipamentos
        break;
      case 'ammo':
        // Lógica para usar munições
        // Por exemplo, decrementar a quantidade
        if (this.system.quantity > 0) {
          await this.update({'system.quantity': Math.max(0, this.system.quantity - 1)});
        }
        break;
      case 'consumable':
        // Lógica para usar consumíveis
        // Por exemplo, decrementar os usos e/ou a quantidade
        if (this.system.uses.value > 0) {
          await this.update({'system.uses.value': Math.max(0, this.system.uses.value - 1)});
        } else if (this.system.quantity > 0) {
          // Se não houver mais usos disponíveis, consumir um item
          await this.update({
            'system.quantity': Math.max(0, this.system.quantity - 1),
            'system.uses.value': this.system.uses.max // Restaurar os usos para o novo item
          });
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
