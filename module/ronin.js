// ronin.js - Sistema principal para o RPG RONIN baseado em MÖRK BORG

// Carregamos o script de formatação de atributos após o init
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
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });
  
  // Helper para formatar números com sinal
  Handlebars.registerHelper('formatSign', function (value) {
    const num = Number(value);
    if (isNaN(num)) return value;
    return num >= 0 ? `+${num}` : `${num}`;
  });
  
  // Carrega script de formatação após init
  fetch('systems/ronin/module/format-attributes.js')
    .then(response => response.text())
    .then(script => {
      // Executa o script que foi carregado
      eval(script);
    })
    .catch(error => console.error('Error loading format-attributes.js:', error));
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
      scrollY: [".sheet-body"]
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
      
      // Toggle para itens equipados
      html.find('input[data-equipped]').click(this._onToggleEquipped.bind(this));
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
  
  _onToggleEquipped(event) {
    event.preventDefault();
    const checkbox = event.currentTarget;
    const itemId = checkbox.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (item) {
      return item.update({
        "system.equipped": checkbox.checked
      });
    }
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
