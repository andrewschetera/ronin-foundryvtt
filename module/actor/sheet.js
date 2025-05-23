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
      classes: ["ronin", "sheet", "actor", "enemy"],
      template: this.getTemplate(),
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
   * Retorna o template apropriado com base no tipo do ator
   * @returns {string} Caminho do template
   * @static
   */
  static getTemplate() {
    // Isso será chamado no contexto da instância, então não podemos usar this.actor aqui
    // Vamos usar o template padrão e sobrescrever no get template
    return "systems/ronin/templates/actor-sheet.html";
  }
  
  /**
   * Retorna o template apropriado com base no tipo do ator
   * @override
   */
  get template() {
    if (this.actor.type === "enemy") {
      return "systems/ronin/templates/enemy-sheet.html";
    }
    return "systems/ronin/templates/actor-sheet.html";
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
  
  // Se for um personagem, preparar dados específicos de personagem
  if (actorData.type === "character") {
    // Preparar dados de munição
    const ammoItems = context.items.filter(i => i.type === "ammo");
    context.ammoItems = ammoItems;
    
    // Criar mapa para acesso rápido às munições
    context.ammoItemsMap = {};
    ammoItems.forEach(ammo => {
      context.ammoItemsMap[ammo.id] = ammo;
    });
    
    // Verificar se o ator já tem uma classe
    const hasClass = context.items.filter(i => i.type === "class").length > 0;
    context.hasClass = hasClass;
  }
  
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
      // Só aplicar correções de layout para fichas de personagem
      if (this.actor.type === "character") {
        this._fixScrollingLayout();
        this._fixHonorSelection();
      }
    }, 100);
  }

  /**
   * Garante que a bolinha de honor correta esteja selecionada
   * @private
   */
  _fixHonorSelection() {
    if (!this.element || this.actor.type !== "character") return;
    
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
    if (!this.element || this.actor.type !== "character") return;
    
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
    if (this.actor.type === "character") {
      this._fixScrollingLayout();
    }
  }
  
 /**
 * Ativa os event listeners da ficha
 * @param {jQuery} html O conteúdo HTML da ficha
 * @override
 */
activateListeners(html) {
  super.activateListeners(html);
  
  // Listeners específicos para personagens
  if (this.actor.type === "character") {
    // Listener especial para os botões de honor
    html.find('input[data-select-single="true"]').click(this._onClickHonorDot.bind(this));
    
    // Adicionar listener para os rótulos das habilidades
    html.find('.ability label').click(this._onAbilityLabelClick.bind(this));
    
    // Listeners para equipar armas e armaduras
    html.find('.weapon-equip-icon').click(this._onWeaponEquipToggle.bind(this));
    html.find('.armor-equip-icon').click(this._onArmorEquipToggle.bind(this));
    
    // Novo listener para selecionar categoria atual de armadura na aba Tatakai
    html.find('.armor-current-category').change(this._onArmorCategoryChange.bind(this));
    
    // Listener para botões de ataque nas armas da aba Tatakai
    html.find('.weapon-attack-button').click(this._onWeaponAttack.bind(this));
    
    // Listener para o botão de defesa
    html.find('.defend-action').click(this._onDefendButtonClick.bind(this));
    
    // Listener para o botão de aparar
    html.find('.parry-action').click(this._onParryButtonClick.bind(this));
    
    // Listener para alteração de quantidade de itens
    html.find('.quantity-input').change(this._onItemQuantityChange.bind(this));
    
    // Listener para seleção de munição na aba Tatakai
    html.find('.ammo-select').change(this._onAmmoSelectChange.bind(this));
    
    // Listener para o botão quebrado
    html.find('.button-broken').click(this._onBrokenButtonClick.bind(this));
    
    // Listener para o botão de melhoria
    html.find('.button-get-better').click(this._onGetBetterButtonClick.bind(this));
    
    // Listener para o botão de Seppuku
    html.find('.button-seppuku').click(this._onSeppukuButtonClick.bind(this));
    
    // Listener para botão de uso de consumível
    html.find('.consumable-use').click(this._onConsumableUse.bind(this));
    
    // Listener para o botão de descanso
    html.find('.button-rest').click(this._onRestButtonClick.bind(this));
    
    // Listener para o botão de uso de texto
    html.find('.text-use').click(this._onTextUse.bind(this));
    
    // Novo listener para o botão de ativação de feat
    html.find('.feat-activate').click(this._onFeatActivate.bind(this));
    
    // Novo listener para o botão de mostrar/esconder descrição da classe
    html.find('.toggle-description').click(this._onToggleClassDescription.bind(this));
  }
  
  // Listeners específicos para inimigos
  if (this.actor.type === "enemy") {
    // Listener para o botão de Moral (sem funcionalidade por enquanto)
    html.find('.moral-button').click(this._onMoralButtonClick.bind(this));
  }
  
  // Funcionalidade condicional para as ações do proprietário
  if (this.actor.isOwner) {
    // Item creation (só para personagens)
    if (this.actor.type === "character") {
      html.find('.item-create').click(this._onItemCreate.bind(this));
      
      // Item editing
      html.find('.item-edit').click(this._onItemEdit.bind(this));

      // Item deletion
      html.find('.item-delete').click(this._onItemDelete.bind(this));
    }
    
    // Outras interações com botões podem ser adicionadas aqui
  }
}

  /**
   * Manipula o clique no botão de Moral do inimigo (sem funcionalidade por enquanto)
   * @param {Event} event O evento de clique
   * @private
   */
  _onMoralButtonClick(event) {
    event.preventDefault();
    
    // Por enquanto, apenas uma mensagem informativa
    ui.notifications.info("Funcionalidade do botão Moral será implementada em breve.");
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

/**
 * Manipula o clique no ícone de equipar/desequipar arma
 * @param {Event} event O evento de clique
 * @private
 */
async _onWeaponEquipToggle(event) {
  event.preventDefault();
  const icon = event.currentTarget;
  const itemId = icon.dataset.itemId;
  const itemHand = icon.dataset.hand;
  const item = this.actor.items.get(itemId);
  
  if (!item) return;
  
  // Verificar se a arma já está equipada
  const isEquipped = item.system.equipped;
  
  // Se estiver tentando equipar (não desequipar)
  if (!isEquipped) {
    // Obter todas as armas atualmente equipadas
    const equippedWeapons = this.actor.items.filter(i => 
      i.type === "weapon" && i.system.equipped && i._id !== itemId
    );
    
    // Contar armas de uma mão e duas mãos equipadas
    const equippedOneHanded = equippedWeapons.filter(w => w.system.hand === "one").length;
    const equippedTwoHanded = equippedWeapons.filter(w => w.system.hand === "two").length;
    
    // Verificar se atingiu o limite de armas equipadas
    let limitReached = false;
    
    // Verificar limites com base no tipo de arma sendo equipada
    if (itemHand === "two") {
      // Para armas de duas mãos, não pode haver nenhuma outra arma equipada
      limitReached = equippedOneHanded > 0 || equippedTwoHanded > 0;
    } else {
      // Para armas de uma mão, pode haver até 2 armas de uma mão, mas nenhuma de duas mãos
      limitReached = equippedTwoHanded > 0 || equippedOneHanded >= 2;
    }
    
    // Se atingiu o limite, mostrar aviso e retornar sem equipar
    if (limitReached) {
      // Mostrar mensagem de aviso
      const warningElement = this.element.find('#weapons-limit-warning');
      warningElement.addClass('show');
      
      // Esconder aviso após 3 segundos
      setTimeout(() => {
        warningElement.removeClass('show');
      }, 3000);
      
      return;
    }
  }
  
  // Se chegou aqui, pode equipar ou desequipar a arma
  await item.update({"system.equipped": !isEquipped});
  
  // Atualizar visualmente o ícone sem precisar recarregar toda a ficha
  if (!isEquipped) {
    icon.classList.add('equipped');
    icon.title = game.i18n.localize("RONIN.Equipment.UnequipWeapon");
  } else {
    icon.classList.remove('equipped');
    icon.title = game.i18n.localize("RONIN.Equipment.EquipWeapon");
  }
}

/**
 * Manipula o clique no ícone de equipar/desequipar armadura
 * @param {Event} event O evento de clique
 * @private
 */
async _onArmorEquipToggle(event) {
  event.preventDefault();
  const icon = event.currentTarget;
  const itemId = icon.dataset.itemId;
  const item = this.actor.items.get(itemId);
  
  if (!item) return;
  
  // Verificar se a armadura já está equipada
  const isEquipped = item.system.equipped;
  
  // Se estiver tentando equipar (não desequipar)
  if (!isEquipped) {
    // Obter todas as armaduras atualmente equipadas
    const equippedArmors = this.actor.items.filter(i => 
      i.type === "armor" && i.system.equipped && i._id !== itemId
    );
    
    // Se já houver uma armadura equipada, mostrar aviso e retornar
    if (equippedArmors.length > 0) {
      // Mostrar mensagem de aviso
      const warningElement = this.element.find('#armor-limit-warning');
      warningElement.addClass('show');
      
      // Esconder aviso após 3 segundos
      setTimeout(() => {
        warningElement.removeClass('show');
      }, 3000);
      
      return;
    }
    
    // Se chegou aqui, não há outras armaduras equipadas, pode equipar esta
    await item.update({"system.equipped": true});
    
    // Desequipar todas as outras armaduras (por precaução)
    for (let armor of equippedArmors) {
      await armor.update({"system.equipped": false});
    }
  } else {
    // Estamos desequipando a armadura
    await item.update({"system.equipped": false});
  }
  
  // Atualizar visualmente o ícone sem precisar recarregar toda a ficha
  if (!isEquipped) {
    icon.classList.add('equipped');
    icon.title = game.i18n.localize("RONIN.Equipment.UnequipArmor");
  } else {
    icon.classList.remove('equipped');
    icon.title = game.i18n.localize("RONIN.Equipment.EquipArmor");
  }
  
  // Recalcular a capacidade de carga após equipar/desequipar a armadura
  this._recalculateCarryingCapacity();
}

/**
 * Manipula o clique no botão de uso de consumível
 * @param {Event} event O evento de clique
 * @private
 */
_onConsumableUse(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const itemId = button.dataset.itemId;
  const item = this.actor.items.get(itemId);
  
  if (!item) return;
  
  // Chamar o método de uso do item
  item.use();
}

/**
 * Manipula o clique no botão de mostrar/esconder descrição da classe
 * @param {Event} event O evento de clique
 * @private
 */
_onToggleClassDescription(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const itemId = button.dataset.itemId;
  
  // Encontrar a descrição correspondente
  const description = this.element.find(`.item-description[data-item-id="${itemId}"]`);
  
  // Alternar a visibilidade da descrição
  if (description.is(":visible")) {
    description.slideUp(200);
    // Mudar o ícone para "livro fechado"
    button.querySelector("i").classList.remove("fa-book-open");
    button.querySelector("i").classList.add("fa-book");
    button.title = "Show Description";
  } else {
    description.slideDown(200);
    // Mudar o ícone para "livro aberto"
    button.querySelector("i").classList.remove("fa-book");
    button.querySelector("i").classList.add("fa-book-open");
    button.title = "Hide Description";
  }
}

/**
 * Manipula o clique no botão de ativação de feat
 * @param {Event} event O evento de clique
 * @private
 */
_onFeatActivate(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const itemId = button.dataset.itemId;
  const item = this.actor.items.get(itemId);
  
  if (!item) return;
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo FeatRoll existe
  if (!window.RONIN.FeatRoll) {
    console.error("Módulo de ativação de feat não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de ativação de feat não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/feat-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de ativação de feat carregado dinamicamente");
          module.default.roll(item, this.actor);
        } else {
          console.error("Falha ao importar módulo de ativação de feat");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de ativação de feat:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a ativação
  RONIN.FeatRoll.roll(item, this.actor);
}

/**
 * Manipula o clique no botão de usar texto
 * @param {Event} event O evento de clique
 * @private
 */
_onTextUse(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const itemId = button.dataset.itemId;
  const item = this.actor.items.get(itemId);
  
  if (!item) return;
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo TextRoll existe
  if (!window.RONIN.TextRoll) {
    console.error("Módulo de rolagem de Texto não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de Texto não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/text-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de Texto carregado dinamicamente");
          module.default.roll(item, this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de Texto");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de Texto:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.TextRoll.roll(item, this.actor);
}

/**
 * Manipula a mudança da categoria atual da armadura na aba Tatakai
 * @param {Event} event O evento de mudança
 * @private
 */
async _onArmorCategoryChange(event) {
  event.preventDefault();
  const select = event.currentTarget;
  const itemId = select.dataset.itemId;
  const newCategory = parseInt(select.value);
  
  // Obter a armadura pelo ID
  const armor = this.actor.items.get(itemId);
  
  if (!armor) return;
  
  // Verificar se a nova categoria é válida (não maior que a categoria máxima)
  const maxCategory = armor.system.maxCategory;
  if (newCategory > maxCategory) {
    ui.notifications.error(game.i18n.localize("RONIN.Equipment.CategoryExceedsMax"));
    // Reverter para o valor original
    select.value = armor.system.currentCategory;
    return;
  }
  
  // Atualizar a categoria atual da armadura
  await armor.update({"system.currentCategory": newCategory});
  
  // Atualizar a proteção exibida (sem recarregar a ficha completa)
  const protectionElement = select.closest('.tatakai-armor-item').querySelector('.protection-value');
  if (protectionElement) {
    // Determinar o valor de proteção com base na categoria
    let protectionValue = "0";
    switch (newCategory) {
      case 0: protectionValue = "0"; break;
      case 1: protectionValue = "1d2"; break;
      case 2: protectionValue = "1d4"; break;
      case 3: protectionValue = "1d6"; break;
    }
    protectionElement.textContent = protectionValue;
  }
}

/**
 * Manipula a alteração da quantidade de um item
 * @param {Event} event O evento de mudança
 * @private
 */
async _onItemQuantityChange(event) {
  event.preventDefault();
  const input = event.currentTarget;
  const itemId = input.dataset.itemId;
  const field = input.dataset.field;
  const newValue = Math.max(0, parseInt(input.value) || 0); // Garante valor mínimo de 0
  
  // Obter o item pelo ID
  const item = this.actor.items.get(itemId);
  
  if (!item) return;
  
  // Criar objeto de atualização
  const updateData = {};
  updateData[field] = newValue;
  
  // Atualizar o item
  await item.update(updateData);
  
  // Recalcular a capacidade de carga após a atualização da quantidade
  this._recalculateCarryingCapacity();
}

/**
 * Manipula a alteração da seleção de munição na aba Tatakai
 * @param {Event} event O evento de mudança
 * @private
 */
async _onAmmoSelectChange(event) {
  event.preventDefault();
  const select = event.currentTarget;
  const weaponId = select.dataset.weaponId;
  const ammoId = select.value || null; // Se valor vazio, usar null
  
  // Obter a arma pelo ID
  const weapon = this.actor.items.get(weaponId);
  
  if (!weapon) return;
  
  // Atualizar a arma com o novo ID de munição
  await weapon.update({"system.ammoId": ammoId});
}

/**
 * Recalcula a capacidade de carga considerando itens equipados e quantidade
 * @private
 */
_recalculateCarryingCapacity() {
  let totalWeight = 0;
  
  // Percorre todos os itens, ignorando armaduras equipadas
  this.actor.items.forEach(item => {
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
  
  // Atualizar a capacidade de carga no ator
  this.actor.update({'system.carryingCapacity.value': totalWeight});
}

/**
 * Manipula o clique no botão de ataque
 * @param {Event} event O evento de clique
 * @private
 */
_onWeaponAttack(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const weaponId = button.dataset.weaponId;
  
  // Obter a arma pelo ID
  const weapon = this.actor.items.get(weaponId);
  
  if (!weapon) {
    console.error("Arma não encontrada");
    ui.notifications.error("Arma não encontrada");
    return;
  }
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo AttackRoll existe
  if (!window.RONIN.AttackRoll) {
    console.error("Módulo de rolagem de ataque não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de ataque não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/attack-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de ataque carregado dinamicamente");
          module.default.roll(weapon, this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de ataque");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de ataque:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.AttackRoll.roll(weapon, this.actor);
}

/**
 * Manipula o clique no botão de defesa
 * @param {Event} event O evento de clique
 * @private
 */
_onDefendButtonClick(event) {
  event.preventDefault();
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo DefenseRoll existe
  if (!window.RONIN.DefenseRoll) {
    console.error("Módulo de rolagem de defesa não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de defesa não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/defense-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de defesa carregado dinamicamente");
          module.default.roll(this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de defesa");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de defesa:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.DefenseRoll.roll(this.actor);
}

/**
 * Manipula o clique no botão de aparar
 * @param {Event} event O evento de clique
 * @private
 */
_onParryButtonClick(event) {
  event.preventDefault();
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo ParryRoll existe
  if (!window.RONIN.ParryRoll) {
    console.error("Módulo de rolagem de aparar não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de aparar não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/parry-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de aparar carregado dinamicamente");
          module.default.roll(this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de aparar");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de aparar:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.ParryRoll.roll(this.actor);
}

/**
 * Manipula o clique no botão Broken
 * @param {Event} event O evento de clique
 * @private
 */
_onBrokenButtonClick(event) {
  event.preventDefault();
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo BrokenRoll existe
  if (!window.RONIN.BrokenRoll) {
    console.error("Módulo de rolagem de condição Quebrado não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de condição Quebrado não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/broken-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de condição Quebrado carregado dinamicamente");
          module.default.roll(this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de condição Quebrado");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de condição Quebrado:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.BrokenRoll.roll(this.actor);
}

/**
 * Manipula o clique no botão de Seppuku
 * @param {Event} event O evento de clique
 * @private
 */
_onSeppukuButtonClick(event) {
  event.preventDefault();
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo SeppukuRoll existe
  if (!window.RONIN.SeppukuRoll) {
    console.error("Módulo de rolagem de Seppuku não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de Seppuku não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/seppuku-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de Seppuku carregado dinamicamente");
          module.default.roll(this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de Seppuku");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de Seppuku:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.SeppukuRoll.roll(this.actor);
}

/**
 * Manipula o clique no botão de descanso
 * @param {Event} event O evento de clique
 * @private
 */
_onRestButtonClick(event) {
  event.preventDefault();
  
  // Calcular usos disponíveis de água e comida
  const waterItems = this.actor.items.filter(
    i => i.type === "consumable" && i.system.consumableType === "water"
  );
  const foodItems = this.actor.items.filter(
    i => i.type === "consumable" && i.system.consumableType === "food"
  );
  
  const waterUses = waterItems.reduce(
    (total, item) => total + (item.system.uses?.value || 0), 0
  );
  const foodUses = foodItems.reduce(
    (total, item) => total + (item.system.uses?.value || 0), 0
  );
  
  // Preparar e exibir o diálogo
  this._showRestDialog(waterUses, foodUses);
}

/**
 * Exibe o diálogo de descanso
 * @param {number} waterUses Total de usos de água disponíveis
 * @param {number} foodUses Total de usos de comida disponíveis
 * @private
 */
async _showRestDialog(waterUses, foodUses) {
  // Obter o valor da configuração de descontar água e comida
  const deductConsumables = game.settings.get("ronin", "deductConsumables");
  
  // Preparar dados para o template
  const templateData = {
    waterUses: waterUses,
    foodUses: foodUses,
    deductConsumables: deductConsumables
  };
  
  // Renderizar o template
  const content = await renderTemplate("systems/ronin/templates/dialogs/rest-dialog.html", templateData);
  
  // Criar o diálogo
  const dialog = new Dialog({
    title: game.i18n.localize("RONIN.Rest.Title"),
    content: content,
    buttons: {
      rest: {
        icon: '<i class="fas fa-bed"></i>',
        label: game.i18n.localize("RONIN.Rest.OK"),
        callback: html => this._onRestConfirmed(html[0].querySelector("form"))
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("RONIN.Rest.Cancel")
      }
    },
    default: "rest"
  });
  
  // Exibir o diálogo
  dialog.render(true);
}

/**
 * Processa o descanso após a confirmação
 * @param {HTMLFormElement} form O formulário do diálogo
 * @private
 */
_onRestConfirmed(form) {
  // Obter os valores do formulário
  const restType = form.restType.value;
  const isInfectedOrPoisoned = form.infectedOrPoisoned.checked;
  
  // Verificar se estamos deduzindo consumíveis
  const deductConsumables = game.settings.get("ronin", "deductConsumables");
  
  let waterUsed = 0;
  let foodUsed = 0;
  let noFoodAndWater = false;
  
  if (deductConsumables) {
    waterUsed = parseInt(form.water.value) || 0;
    foodUsed = parseInt(form.food.value) || 0;
  } else {
    noFoodAndWater = form.noFoodAndWater?.checked || false;
  }
  
  // Verificar se foi escolhida a meditação e se o haiku está marcado
  const haiku = restType === "meditation" ? (form.haiku?.checked || false) : false;
  
  // Processar o tipo de descanso
  if (restType === "short") {
    // Verificar se o módulo ShortRestRoll existe
    if (!window.RONIN.ShortRestRoll) {
      console.error("Módulo de rolagem de descanso curto não encontrado no namespace RONIN");
      ui.notifications.error("Módulo de rolagem de descanso curto não disponível");
      
      // Tentar importar dinamicamente (apenas como fallback)
      try {
        import('../rolls/short-rest-roll.js').then(module => {
          if (module && module.default) {
            console.log("Módulo de rolagem de descanso curto carregado dinamicamente");
            module.default.roll(this.actor, noFoodAndWater, deductConsumables);
          } else {
            console.error("Falha ao importar módulo de rolagem de descanso curto");
          }
        }).catch(err => {
          console.error("Erro ao importar módulo de rolagem de descanso curto:", err);
        });
      } catch (error) {
        console.error("Erro ao tentar importação dinâmica:", error);
      }
      return;
    }
    
    // Se chegou aqui, o módulo existe, então faz a rolagem
    RONIN.ShortRestRoll.roll(this.actor, noFoodAndWater, deductConsumables);
  } else if (restType === "long") {
    // Verificar se o módulo LongRestRoll existe
    if (!window.RONIN.LongRestRoll) {
      console.error("Módulo de rolagem de descanso longo não encontrado no namespace RONIN");
      ui.notifications.error("Módulo de rolagem de descanso longo não disponível");
      
      // Tentar importar dinamicamente (apenas como fallback)
      try {
        import('../rolls/long-rest-roll.js').then(module => {
          if (module && module.default) {
            console.log("Módulo de rolagem de descanso longo carregado dinamicamente");
            module.default.roll(this.actor, noFoodAndWater, deductConsumables, isInfectedOrPoisoned);
          } else {
            console.error("Falha ao importar módulo de rolagem de descanso longo");
          }
        }).catch(err => {
          console.error("Erro ao importar módulo de rolagem de descanso longo:", err);
        });
      } catch (error) {
        console.error("Erro ao tentar importação dinâmica:", error);
      }
      return;
    }
    
    // Se chegou aqui, o módulo existe, então faz a rolagem
    RONIN.LongRestRoll.roll(this.actor, noFoodAndWater, deductConsumables, isInfectedOrPoisoned);
  } else if (restType === "meditation") {
    // Verificar se o módulo MeditationRoll existe
    if (!window.RONIN.MeditationRoll) {
      console.error("Módulo de rolagem de meditação não encontrado no namespace RONIN");
      ui.notifications.error("Módulo de rolagem de meditação não disponível");
      
      // Tentar importar dinamicamente (apenas como fallback)
      try {
        import('../rolls/meditation-roll.js').then(module => {
          if (module && module.default) {
            console.log("Módulo de rolagem de meditação carregado dinamicamente");
            module.default.roll(this.actor, haiku);
          } else {
            console.error("Falha ao importar módulo de rolagem de meditação");
          }
        }).catch(err => {
          console.error("Erro ao importar módulo de rolagem de meditação:", err);
        });
      } catch (error) {
        console.error("Erro ao tentar importação dinâmica:", error);
      }
      return;
    }
    
    // Se chegou aqui, o módulo existe, então faz a rolagem
    RONIN.MeditationRoll.roll(this.actor, haiku);
  } else {
    // Outros tipos de descanso serão implementados posteriormente
    ui.notifications.info(`${this._getRestTypeName(restType)} completed.`);
  }
}

/**
 * Obtém o nome traduzido do tipo de descanso
 * @param {string} restType O tipo de descanso (short, long, meditation)
 * @returns {string} O nome traduzido
 * @private
 */
_getRestTypeName(restType) {
  switch (restType) {
    case "short":
      return game.i18n.localize("RONIN.Rest.Short");
    case "long":
      return game.i18n.localize("RONIN.Rest.Long");
    case "meditation":
      return game.i18n.localize("RONIN.Rest.Meditation");
    default:
      return restType;
  }
}

/**
 * Manipula o clique no botão de melhoria
 * @param {Event} event O evento de clique
 * @private
 */
_onGetBetterButtonClick(event) {
  event.preventDefault();
  
  // Verificar se o namespace RONIN existe
  if (!window.RONIN) {
    console.error("Namespace RONIN não encontrado");
    ui.notifications.error("Erro no sistema: Namespace RONIN não encontrado");
    return;
  }
  
  // Verificar se o módulo GetBetterRoll existe
  if (!window.RONIN.GetBetterRoll) {
    console.error("Módulo de rolagem de melhoria não encontrado no namespace RONIN");
    ui.notifications.error("Módulo de rolagem de melhoria não disponível");
    
    // Tentar importar dinamicamente (apenas como fallback)
    try {
      import('../rolls/get-better-roll.js').then(module => {
        if (module && module.default) {
          console.log("Módulo de rolagem de melhoria carregado dinamicamente");
          module.default.roll(this.actor);
        } else {
          console.error("Falha ao importar módulo de rolagem de melhoria");
        }
      }).catch(err => {
        console.error("Erro ao importar módulo de rolagem de melhoria:", err);
      });
    } catch (error) {
      console.error("Erro ao tentar importação dinâmica:", error);
    }
    return;
  }
  
  // Se chegou aqui, o módulo existe, então faz a rolagem
  RONIN.GetBetterRoll.roll(this.actor);
}

  // Métodos para manipulação de itens
_onItemCreate(event) {
  event.preventDefault();
  const header = event.currentTarget;
  const type = header.dataset.type;
  
  // Verificar se é uma classe e se já existe uma classe
  if (type === "class") {
    // Contar classes existentes
    const existingClasses = this.actor.items.filter(i => i.type === "class");
    if (existingClasses.length > 0) {
      // Já existe uma classe, exibir notificação e impedir a criação
      ui.notifications.warn("Um personagem só pode ter uma classe!");
      return;
    }
  }
  
  // Procede com a criação do item normalmente
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
