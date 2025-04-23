// sheet.js - Implementação da ficha de item para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Estende a classe base ItemSheet para personalizar a ficha de itens.
 * @extends {ItemSheet}
 */
class RoninItemSheet extends ItemSheet {
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
    }
    
    // Se for uma armadura, preparar opções específicas
    if (context.item.type === 'armor') {
      context.armorTiers = RONIN.config.equipment.armorTiers;
    }
    
    return context;
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
      
      // Outros listeners específicos podem ser adicionados aqui
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
