// settings.js - Gerencia as configurações do sistema RONIN

// Garantir que o namespace RONIN existe
window.RONIN = window.RONIN || {};

/**
 * Registra e gerencia as configurações do sistema
 */
class RoninSettings {
  
  /**
   * Registra as configurações do sistema no Foundry
   */
  static registerSettings() {
    console.log('RONIN | Registrando configurações do sistema');
    
    // Registrar a configuração para Regras Solo
    game.settings.register("ronin", "useSoloRules", {
      name: "RONIN.Settings.UseSoloRules",
      hint: "RONIN.Settings.UseSoloRulesHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      restricted: true
    });
    
    // Registrar a configuração para descontar água e comida
    game.settings.register("ronin", "deductConsumables", {
      name: "RONIN.Settings.DeductConsumables",
      hint: "RONIN.Settings.DeductConsumablesHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      restricted: true
    });
  }
}

// Adicionar a classe ao namespace RONIN
RONIN.Settings = RoninSettings;

// Exportar a classe
export default RoninSettings;
