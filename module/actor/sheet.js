// sheet.js - Implementação da ficha de ator para o sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Estende a classe base ActorSheet para personalizar a ficha de personagem.
 * @extends {ActorSheet}
 */
class RoninActorSheet extends ActorSheet {
  /**
   * Define as opções padrão para a ficha
   * @override
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ronin", "sheet", "actor"],
      template: "systems/ronin/templates/actor-sheet.html",
      width: 700,
      height: 600,
      tabs: [
        {navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "background"}
      ],
      scrollY: [".tab"], // Configurar rolagem apenas para as abas
      resizable: false // Impedir que o tamanho da ficha seja alterado
    });
  }
  
  /**
   * Prepara os dados para renderização da ficha
   * @override
   */
  getData() {
    const context = super.getData();
    
    // Adiciona o sistema ao contexto para acessar os dados
    const actorData = context.actor;
    
    // Adicionamos os dados ao objeto de contexto
    context.system = actorData.system;
    context.items = actorData.items;
    
    return context;
  }
  
  /**
   * Sobrescreve o método _render para garantir que o layout esteja correto após a renderização
   * @override
   */
  async _render(force = false, options = {}) {
    await super._render(force, options);
    
    // Adicionar um pequeno atraso para garantir que o DOM esteja pronto
    setTimeout(() => {
      this._fixScrollingLayout();
      this._fixHonorSelection();
    }, 100);
  }

  /**
   * Garante que a bolinha de honor correta esteja selecionada
   * @private
   */
  _fixHonorSelection() {
    if (!this.element) return;
    
    const honorValue = parseInt(this.actor.system.resources.honor.value);
    console.log(`Inicializando seleção de honor: ${honorValue}`);
    
    // Encontrar o input radio com o valor correspondente e marcá-lo como selecionado
    const honorInput = this.element.find(`input[name="system.resources.honor.value"][value="${honorValue}"]`);
    if (honorInput.length) {
      honorInput.prop('checked', true);
    }
  }
    
  /**
   * Método simplificado para corrigir problemas de layout
   * @private
   */
  _fixScrollingLayout() {
    if (!this.element) return;
    
    // Configurar rolagem apenas para as abas
    this.element.find('.tab').css('overflow-y', 'auto');
    
    // Calcular altura disponível de forma simples
    const windowHeight = this.element.find('.window-content').height() || 0;
    const headerHeight = this.element.find('.sheet-header').outerHeight(true) || 0;
    const tabsHeight = this.element.find('.tabs-container').outerHeight(true) || 0;
    
    // Calcular altura para o corpo (deixando margem de segurança)
    if (windowHeight > 0) {
      const bodyHeight = Math.max(150, windowHeight - headerHeight - tabsHeight - 20);
      this.element.find('.sheet-body').height(bodyHeight);
    }
  }
  
  /**
   * Aplicar correções de layout quando a janela é redimensionada
   * @param {Event} event O evento de redimensionamento
   * @private
   */
  _onResize(event) {
    super._onResize(event);
    this._fixScrollingLayout();
  }
  
  /**
   * Ativa os event listeners da ficha
   * @param {jQuery} html O conteúdo HTML da ficha
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Listener especial para os botões de honor
    html.find('input[data-select-single="true"]').click(this._onClickHonorDot.bind(this));
    
    // Adicionar listener para os rótulos das habilidades
    html.find('.ability label').click(this._onAbilityLabelClick.bind(this));
    
    // Funcionalidade condicional para as ações do proprietário
    if (this.actor.isOwner) {
      // Item creation
      html.find('.item-create').click(this._onItemCreate.bind(this));

      // Item editing
      html.find('.item-edit').click(this._onItemEdit.bind(this));

      // Item deletion
      html.find('.item-delete').click(this._onItemDelete.bind(this));
      
      // Outras interações com botões podem ser adicionadas aqui
    }
  }

  /**
   * Manipula o clique em um botão de honor
   * @param {Event} event O evento de clique
   * @private
   */
  _onClickHonorDot(event) {
    event.preventDefault();
    const dot = event.currentTarget;
    const honorValue = parseInt(dot.value);
    
    console.log(`Atualizando honor para: ${honorValue}`);
    
    // Atualiza o valor de honor diretamente
    this.actor.update({'system.resources.honor.value': honorValue});
  }
    
  /**
   * Manipula o clique em um rótulo de habilidade
   * @param {Event} event O evento de clique
   * @private
   */
  _onAbilityLabelClick(event) {
    event.preventDefault();
    
    // Obter o elemento clicado e verificar a classe para determinar qual habilidade
    const label = event.currentTarget;
    const abilityEl = label.closest('.ability');
    
    // Identificar qual habilidade foi clicada
    let abilityKey = '';
    if (abilityEl.classList.contains('vigor')) abilityKey = 'vigor';
    else if (abilityEl.classList.contains('swiftness')) abilityKey = 'swiftness';
    else if (abilityEl.classList.contains('spirit')) abilityKey = 'spirit';
    else if (abilityEl.classList.contains('resilience')) abilityKey = 'resilience';
    
    // Chamar a função de rolagem
    if (abilityKey) {
      // Usamos diretamente o método do actor
      this.actor.rollAbility(abilityKey);
    }
  }

  // Métodos para manipulação de itens
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const itemData = {
      name: `Novo ${type}`,
      type: type
    };
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const itemId = li.dataset.itemId;
    return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
}

// Adicionar a classe ao namespace RONIN
RONIN.ActorSheet = RoninActorSheet;

// Exportar a classe
export default RoninActorSheet;
