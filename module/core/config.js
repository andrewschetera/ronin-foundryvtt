// config.js - Configurações do sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Configurações do sistema RONIN
 */
RONIN.config = {
  // Configurações de rolagens
  rolls: {
    abilityCheck: {
      formula: "1d20",
      defaultDR: 10,
      critSuccess: 20,
      critFailure: 1
    }
  },
  
  // Configurações de recursos
  resources: {
    honorMin: 1,
    honorMax: 20,
    honorDishonorThreshold: 9 // Valores iguais ou menores são desonra
  },
  
  // Configurações de equipamento
  equipment: {
    weaponTypes: ["melee", "ranged"],
    weaponHands: ["one", "two"],
    armorTiers: [1, 2, 3],
    consumableTypes: ["potion", "scroll", "food", "other"]
  },
  
  // Mapeamento de tipos de item para localização
  itemTypes: {
    weapon: "RONIN.ItemTypes.Weapon",
    armor: "RONIN.ItemTypes.Armor",
    gear: "RONIN.ItemTypes.Gear",
    ammo: "RONIN.ItemTypes.Ammo",
    consumable: "RONIN.ItemTypes.Consumable",
    feat: "RONIN.ItemTypes.Feat",
    text: "RONIN.ItemTypes.Text",
    class: "RONIN.ItemTypes.Class"
  }
};

// Exportar as configurações
export default RONIN.config;
