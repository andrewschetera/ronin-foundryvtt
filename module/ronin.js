// ronin.js - Sistema principal para o RPG RONIN baseado em MÖRK BORG

// Inicialização do sistema
Hooks.once('init', async function() {
  console.log('ronin | Inicializando sistema RONIN');
  
  // Define tipos de atores personalizados
  CONFIG.Actor.documentClass = RoninActor;
  CONFIG.Item.documentClass = RoninItem;
  
  // Registrar folhas de personagem
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ronin", RoninActorSheet, { makeDefault: true });
  
  // Registrar folhas de item
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ronin", RoninItemSheet, { makeDefault: true });

  // Registrar o helper Handlebars 'times' para criar loops
  Handlebars.registerHelper('times', function(n, block) {
    let accum = '';
    for(let i = 1; i <= n; ++i)
      accum += block.fn(i);
    return accum;
  });

  // Registrar o helper Handlebars 'eq' para comparações
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  // Registrar o helper Handlebars 'lte' para comparações
  Handlebars.registerHelper('lte', function (a, b) {
    return a <= b;
  });
  
  // Registrar o helper Handlebars 'and' para condições múltiplas
  Handlebars.registerHelper('and', function () {
    return Array.prototype.every.call(arguments, Boolean);
  });
  
  // Helper para formatar números com sinal
  Handlebars.registerHelper('formatSign', function (value) {
    const num = Number(value);
    if (isNaN(num)) return value;
    return num >= 0 ? `+${num}` : `${num}`;
  });
});

// Hook para ajustar rolagem depois que o Foundry terminar de carregar
Hooks.once('ready', function() {
  console.log('ronin | Aplicando ajustes de rolagem');
  
  // Adicionar classes específicas para melhorar o comportamento de rolagem
  document.body.classList.add('ronin-system-loaded');
});

/**
 * Estende a classe base de Actor para implementar funcionalidades específicas do sistema.
 */
class RoninActor extends Actor {
  prepareData() {
    super.prepareData();

    const actorData = this;
    
    if (actorData.type === 'character') {
      this._prepareCharacterData(actorData);
    }
  }
  
  _prepareCharacterData(actorData) {
    // Implementação futura de cálculos do sistema
  }
}

/**
 * Estende a classe base de Item para implementar funcionalidades específicas do sistema.
 */
class RoninItem extends Item {
  prepareData() {
    super.prepareData();
  }
}

/**
 * Estende a classe base ActorSheet para personalizar a ficha de personagem.
 */
class RoninActorSheet extends ActorSheet {
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
   */
  async _render(force = false, options = {}) {
    await super._render(force, options);
    
    // Adicionar um pequeno atraso para garantir que o DOM esteja pronto
    setTimeout(() => {
      this._fixScrollingLayout();
    }, 100);
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
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Listener especial para os botões de honor
    html.find('input[data-select-single="true"]').click(this._onClickHonorDot.bind(this));
    
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
    const honorValue = dot.value;
    
    // Atualiza o valor de honor diretamente
    this.actor.update({'system.resources.honor.value': parseInt(honorValue)});
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

/**
 * Estende a classe base ItemSheet para personalizar a ficha de itens.
 */
class RoninItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ronin", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }
  
  get template() {
    const path = "systems/ronin/templates/items";
    // Fallback para um template genérico se o específico não existir
    return `${path}/item-${this.item.type}-sheet.html`;
  }
  
  getData() {
    const context = super.getData();
    context.system = context.item.system;
    return context;
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Futuros listeners para itens
  }
}
