// sheet.js - Implementação da ficha de item para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Estende a classe base ItemSheet para personalizar a ficha de itens.
 * @extends {ItemSheet}
 */
class RoninItemSheet extends foundry.appv1.sheets.ItemSheet {
  /**
   * Define as opções padrão para a ficha
   * @override
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ronin", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }
  
  /**
   * Retorna o template apropriado com base no tipo do item
   * @override
   */
  get template() {
    const path = "systems/ronin/templates/items";
    
    // Tentar usar um template específico baseado no tipo do item
    const templateFile = `item-${this.item.type}-sheet.html`;
    
    // Verificar se o arquivo template existe
    // No ambiente de produção, isto seria determinado através de um verificador de existência
    // ou de uma lista de templates registrados
    // Aqui vamos usar uma abordagem simplificada
    
    // Fallback para um template genérico se o específico não existir
    return `${path}/${templateFile}`;
  }
  
  /**
   * Prepara os dados para renderização da ficha
   * @override
   */
  getData() {
    const context = super.getData();
    
    // Adicionar os dados do sistema ao contexto
    context.system = context.item.system;
    
    // Se for uma arma, preparar opções específicas
    if (context.item.type === 'weapon') {
      context.weaponTypes = RONIN.config.equipment.weaponTypes;
      
      // Se for arma ranged com munição, buscar munições disponíveis
      if (context.item.system.weaponType === 'ranged' && context.item.system.useAmmo) {
        context.availableAmmo = this._getAvailableAmmo();
      }
    }
    
    // Se for uma armadura, preparar opções específicas
    if (context.item.type === 'armor') {
      context.armorTiers = RONIN.config.equipment.armorTiers;
    }
    
    return context;
  }
  
/**
 * Obtém a lista de munições disponíveis no inventário do ator
 * @returns {Array} Lista de munições disponíveis
 * @private
 */
_getAvailableAmmo() {
  const actor = this.item.actor;
  
  // Se o item não estiver associado a um ator, retornar lista vazia
  if (!actor) return [];
  
  // Buscar todos os itens do tipo 'ammo' que tenham quantidade maior que 0
  return actor.items.filter(i => 
    i.type === 'ammo' && 
    i.system.quantity > 0
  ).map(i => ({
    id: i.id,
    name: i.name,
    system: i.system
  }));
}
  
  /**
   * Ativa os event listeners da ficha
   * @param {jQuery} html O conteúdo HTML da ficha
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Se o item pertencer ao usuário atual
    if (this.isEditable) {
      // Botão de uso do item
      html.find('.item-use').click(this._onItemUse.bind(this));
      
      // Adicionar listener para validação de quantidade
if (['gear', 'ammo', 'consumable'].includes(this.item.type)) {
  html.find('input[name="system.quantity"]').change(this._onQuantityChange.bind(this));
}
      
      // Adicionar listener para tipo de arma mudar (melee/ranged)
      if (this.item.type === 'weapon') {
        html.find('select[name="system.weaponType"]').change(this._onWeaponTypeChange.bind(this));
        html.find('input[name="system.useAmmo"]').change(this._onUseAmmoChange.bind(this));
        html.find('select[name="system.ammoId"]').change(this._onAmmoIdChange.bind(this));
      }
    }
  }
  
/**
 * Manipulador para quando o tipo de arma muda
 * @param {Event} event O evento de mudança
 * @private
 */
_onWeaponTypeChange(event) {
  const select = event.currentTarget;
  const value = select.value;
  
  // Criar objeto de atualização com o tipo da arma
  const updateData = {
    'system.weaponType': value
  };
  
  // Se mudou para 'melee', desativar o uso de munição
  if (value === 'melee') {
    updateData['system.useAmmo'] = false;
    updateData['system.ammoId'] = null;
  }
  
  // Aplicar as atualizações ao item
  this.item.update(updateData);
  
  // Recarregar a ficha para atualizar a UI
  this.render(true);
}
  
/**
 * Manipulador para quando a opção de usar munição muda
 * @param {Event} event O evento de mudança
 * @private
 */
_onUseAmmoChange(event) {
  const checkbox = event.currentTarget;
  const checked = checkbox.checked;
  
  // Criar objeto de atualização com o estado atual do checkbox
  const updateData = {
    'system.useAmmo': checked
  };
  
  // Se desmarcou, limpar a seleção de munição
  if (!checked) {
    updateData['system.ammoId'] = null;
  }
  
  // Aplicar as atualizações ao item
  this.item.update(updateData);
  
  // Recarregar a ficha para atualizar a UI
  this.render(true);
}
  
  /**
   * Manipulador para quando a seleção de munição muda
   * @param {Event} event O evento de mudança
   * @private
   */
  _onAmmoIdChange(event) {
    const select = event.currentTarget;
    const value = select.value;
    
    // Atualizar o ID da munição selecionada
    this.item.update({'system.ammoId': value});
  }
  
  /**
   * Manipula alterações na quantidade do item
   * @param {Event} event O evento de mudança
   * @private
   */
  _onQuantityChange(event) {
    const input = event.currentTarget;
    const newValue = parseInt(input.value);
    
    // Garantir que a quantidade nunca seja menor que 0
    if (isNaN(newValue) || newValue < 0) {
      input.value = 0;
    }
  }
  
  /**
   * Manipula o clique no botão de uso do item
   * @param {Event} event O evento de clique
   * @private
   */
  _onItemUse(event) {
    event.preventDefault();
    
    // Chamar o método de uso do item
    this.item.use();
  }
}

// Adicionar a classe ao namespace RONIN
RONIN.ItemSheet = RoninItemSheet;

// Exportar a classe
export default RoninItemSheet;
