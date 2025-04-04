// ronin.js - Sistema principal para o RPG RONIN baseado em MÖRK BORG

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
});

// Hooks adicionais podem ser adicionados aqui no futuro

/**
 * Estende a classe base de Actor para implementar funcionalidades específicas do sistema.
 */
class RoninActor extends Actor {
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    
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
    return mergeObject(super.defaultOptions, {
      classes: ["ronin", "sheet", "actor"],
      template: "systems/ronin/templates/actor-sheet.html",
      width: 700,
      height: 600,
      tabs: [
        {navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "background"}
      ]
    });
  }
  
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    
    return data;
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Listeners irão aqui no futuro
    
    // Funcionalidade condicional para as ações do proprietário
    if (this.actor.isOwner) {
      // Futuros listeners específicos para o proprietário
    }
  }
}

/**
 * Estende a classe base ItemSheet para personalizar a ficha de itens.
 */
class RoninItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ronin", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }
  
  get template() {
    const path = "systems/ronin/templates/item";
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }
  
  getData() {
    const data = super.getData();
    return data;
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Futuros listeners para itens
  }
}
