// module/ui/character-generator-dialog.js - Janela de diálogo para o gerador de personagens

/**
 * Verifica a existência das tabelas de nome e rola nelas para gerar o nome do personagem
 * @returns {Object} Objeto contendo os resultados das rolagens ou null se as tabelas não forem encontradas
 */
async function rollForCharacterName() {
  // Obter os nomes localizados das tabelas
  const nameTableName = game.i18n.has("RONIN.CharacterGenerator.NameTable") ? 
    game.i18n.localize("RONIN.CharacterGenerator.NameTable") : "Name";
  
  const lastNameTableName = game.i18n.has("RONIN.CharacterGenerator.LastNameTable") ? 
    game.i18n.localize("RONIN.CharacterGenerator.LastNameTable") : "Last Name";
  
  const nicknameTableName = game.i18n.has("RONIN.CharacterGenerator.NicknameTable") ? 
    game.i18n.localize("RONIN.CharacterGenerator.NicknameTable") : "Nickname";
  
  // Procurar as tabelas pelo nome localizado
  const nameTable = game.tables.find(t => t.name === nameTableName);
  const lastNameTable = game.tables.find(t => t.name === lastNameTableName);
  const nicknameTable = game.tables.find(t => t.name === nicknameTableName);
  
  // Verificar se todas as tabelas necessárias foram encontradas
  const hasNameTables = nameTable && lastNameTable;
  
  if (!hasNameTables) {
    return null;
  }
  
  // Criar objeto para armazenar os resultados
  const nameResults = {
    firstName: "",
    lastName: "",
    nickname: ""
  };
  
  try {
    // Rolar na tabela de nomes
    const nameResult = await nameTable.draw({ displayChat: false });
    if (nameResult.results && nameResult.results.length > 0) {
      nameResults.firstName = nameResult.results[0].text;
    }
    
    // Rolar na tabela de sobrenomes
    const lastNameResult = await lastNameTable.draw({ displayChat: false });
    if (lastNameResult.results && lastNameResult.results.length > 0) {
      nameResults.lastName = lastNameResult.results[0].text;
    }
    
    // Rolar na tabela de apelidos (se existir)
    if (nicknameTable) {
      const nicknameResult = await nicknameTable.draw({ displayChat: false });
      if (nicknameResult.results && nicknameResult.results.length > 0) {
        nameResults.nickname = nicknameResult.results[0].text;
      }
    }
    
    return nameResults;
  } catch (error) {
    console.error("Erro ao rolar nas tabelas de nome:", error);
    return null;
  }
}

/**
 * Obter todas as classes disponíveis no sistema
 * @returns {Array} Array contendo informações de todas as classes
 */
async function getAvailableClasses() {
  // Buscar todos os itens de tipo "class" no compêndio ou como itens do mundo
  let classes = [];
  
  // Buscar classes de itens do mundo
  const worldItems = game.items.filter(i => i.type === "class");
  if (worldItems.length > 0) {
    classes = classes.concat(worldItems.map(c => ({
      id: c.id,
      name: c.name,
      img: c.img,
      description: c.system.description
    })));
  }
  
  // Buscar classes de compêndios (se existirem)
  for (let pack of game.packs) {
    if (pack.metadata.type === "Item") {
      const packIndex = await pack.getIndex();
      const classItems = packIndex.filter(i => i.type === "class");
      
      if (classItems.length > 0) {
        for (let idx of classItems) {
          const item = await pack.getDocument(idx._id);
          classes.push({
            id: item.id,
            name: item.name,
            img: item.img,
            description: item.system.description,
            pack: pack.collection
          });
        }
      }
    }
  }
  
  return classes;
}

/**
 * Extrai nomes de feats e rolltables do texto da tabela de feats
 * @param {string} featsTableText - Texto da tabela de feats
 * @returns {Object} Objeto com arrays de feats e tabelas
 */
function extractFeatsAndTables(featsTableText) {
  if (!featsTableText) return { feats: [], tables: [] };
  
  const parts = featsTableText.split(',').map(part => part.trim());
  const feats = [];
  const tables = [];
  
  for (const part of parts) {
    // Verificar se é uma rolltable (entre colchetes)
    const tableMatch = part.match(/\[(.*?)\]/);
    if (tableMatch) {
      tables.push(tableMatch[1]);
    } else if (part) {
      // Se não é uma rolltable e não está vazio, é um feat
      feats.push(part);
    }
  }
  
  return { feats, tables };
}

/**
 * Extrai os itens iniciais do texto
 * @param {string} startingItemsText - Texto do campo startingItems
 * @returns {Object} Objeto com arrays de itens com suas quantidades e tabelas com suas quantidades
 */
function extractStartingItems(startingItemsText) {
  if (!startingItemsText) return { items: [], tables: [] };
  
  const parts = startingItemsText.split(',').map(part => part.trim());
  const items = [];
  const tables = [];
  
  // Expressão regular para capturar quantidades
  // Captura: 
  // - um número simples "10 shurikens" 
  // - uma expressão de dado "1d4 bandagens"
  // - uma expressão de dados com multiplicador "2d6*10 ryo"
  const quantityRegex = /^((\d+)|((\d+)d(\d+))(\*(\d+))?)?\s+(.+)$/;
  
  for (let part of parts) {
    if (!part) continue;
    
    // Verificar se é uma rolltable (entre colchetes)
    const tableMatch = part.match(/(\d+d\d+)?\s*\[(.*?)\]/);
    if (tableMatch) {
      // Se for uma rolltable com quantidade
      const rollQuantity = tableMatch[1]; // pode ser undefined se não houver quantidade
      const tableName = tableMatch[2];
      
      // Se tiver uma expressão de dado para quantidade
      if (rollQuantity) {
        tables.push({
          name: tableName,
          quantity: rollQuantity  // Ex: "1d4"
        });
      } else {
        tables.push({
          name: tableName,
          quantity: "1"  // Valor padrão
        });
      }
    } else {
      // Se for um item normal
      const quantityMatch = part.match(quantityRegex);
      
      if (quantityMatch) {
        // Se houver padrão de quantidade no início
        let quantity;
        
        // Captura simples número (grupo 2) ou expressão de dado (grupos 4 e 5)
        if (quantityMatch[2]) {
          // Número simples
          quantity = quantityMatch[2];
        } else if (quantityMatch[4] && quantityMatch[5]) {
          // Expressão de dado
          if (quantityMatch[7]) {
            // Com multiplicador
            quantity = `${quantityMatch[4]}d${quantityMatch[5]}*${quantityMatch[7]}`;
          } else {
            // Sem multiplicador
            quantity = `${quantityMatch[4]}d${quantityMatch[5]}`;
          }
        } else {
          quantity = "1"; // Padrão se não houver correspondência
        }
        
        const itemName = quantityMatch[8];
        items.push({
          name: itemName,
          quantity: quantity
        });
      } else {
        // Se não tiver padrão de quantidade, assume 1
        items.push({
          name: part,
          quantity: "1"
        });
      }
    }
  }
  
  return { items, tables };
}

/**
 * Encontra um feat pelo nome
 * @param {string} featName - Nome do feat
 * @returns {Object} O item feat encontrado ou null
 */
async function findFeatByName(featName) {
  // Procurar nos itens do mundo
  let feat = game.items.find(i => i.type === "feat" && i.name === featName);
  
  // Se não encontrou nos itens do mundo, procurar nos compêndios
  if (!feat) {
    for (let pack of game.packs) {
      if (pack.metadata.type === "Item") {
        const packIndex = await pack.getIndex();
        const featIndex = packIndex.find(i => i.type === "feat" && i.name === featName);
        
        if (featIndex) {
          feat = await pack.getDocument(featIndex._id);
          break;
        }
      }
    }
  }
  
  return feat;
}

/**
 * Encontra um item pelo nome no mundo ou compêndios
 * @param {string} itemName - Nome do item a ser encontrado
 * @param {string} itemType - (Opcional) Tipo do item a ser encontrado
 * @returns {Object} O item encontrado ou null
 */
async function findItemByName(itemName, itemType = null) {
  // Procurar nos itens do mundo
  let itemQuery = game.items.filter(i => i.name.toLowerCase() === itemName.toLowerCase());
  
  // Se especificou um tipo, filtrar pelo tipo
  if (itemType) {
    itemQuery = itemQuery.filter(i => i.type === itemType);
  }
  
  // Se encontrou algum item
  if (itemQuery.length > 0) {
    return itemQuery[0];
  }
  
  // Se não encontrou nos itens do mundo, procurar nos compêndios
  for (let pack of game.packs) {
    if (pack.metadata.type === "Item") {
      const packIndex = await pack.getIndex();
      
      // Filtrar pelo nome (case insensitive)
      let indexEntryQuery = packIndex.filter(i => 
        i.name.toLowerCase() === itemName.toLowerCase()
      );
      
      // Se especificou um tipo, filtrar pelo tipo
      if (itemType && indexEntryQuery.length > 0) {
        // Precisamos verificar o tipo de cada item
        for (let indexEntry of indexEntryQuery) {
          const item = await pack.getDocument(indexEntry._id);
          if (item.type === itemType) {
            return item;
          }
        }
      } else if (indexEntryQuery.length > 0) {
        // Se não especificou tipo, retornar o primeiro que encontrar
        return await pack.getDocument(indexEntryQuery[0]._id);
      }
    }
  }
  
  // Se não encontrou em lugar nenhum
  return null;
}

/**
 * Rola em uma rolltable e retorna o feat resultante
 * @param {string} tableName - Nome da rolltable
 * @returns {Object} O item feat resultante ou null
 */
async function rollOnTable(tableName) {
  // Procurar a rolltable pelo nome
  const table = game.tables.find(t => t.name === tableName);
  
  if (!table) {
    console.warn(`Tabela "${tableName}" não encontrada`);
    return null;
  }
  
  // Rolar na tabela
  const result = await table.draw({ displayChat: false });
  
  if (!result.results || result.results.length === 0) {
    console.warn(`Tabela "${tableName}" não retornou resultados`);
    return null;
  }
  
  const drawnResult = result.results[0];
  
  // Se o resultado for uma referência a um documento
  if (drawnResult.documentCollection) {
    if (drawnResult.documentCollection === "Item") {
      // Se for uma referência a um Item, obter o item
      return game.items.get(drawnResult.documentId);
    } else if (drawnResult.documentCollection.startsWith("Compendium.")) {
      // Se for uma referência a um item de compêndio
      const packName = drawnResult.documentCollection.substring(11);
      const pack = game.packs.get(packName);
      if (pack) {
        return await pack.getDocument(drawnResult.documentId);
      }
    }
  } else if (drawnResult.text) {
    // Se for um texto, procurar um feat com esse nome
    return await findFeatByName(drawnResult.text);
  }
  
  return null;
}

/**
 * Rola uma expressão e retorna o resultado
 * @param {string} diceExpression - Expressão de dado (Ex: "1d4", "2d6*10")
 * @returns {number} Resultado da rolagem
 */
async function rollQuantity(diceExpression) {
  // Verificar se é um número simples
  if (/^\d+$/.test(diceExpression)) {
    return parseInt(diceExpression);
  }
  
  // Verificar se tem multiplicador
  const multMatch = diceExpression.match(/^(\d+d\d+)\*(\d+)$/);
  if (multMatch) {
    const diceFormula = multMatch[1];
    const multiplier = parseInt(multMatch[2]);
    
    // Rolar os dados
    const roll = new Roll(diceFormula);
    await roll.evaluate();
    
    // Multiplicar pelo multiplicador
    return roll.total * multiplier;
  }
  
  // Rolagem simples de dados
  const roll = new Roll(diceExpression);
  await roll.evaluate();
  return roll.total;
}

/**
 * Adiciona itens iniciais ao personagem
 * @param {Object} actor - O personagem a receber os itens
 * @param {Object} classItem - O item da classe com o campo startingItems
 */
async function addStartingItems(actor, classItem) {
  if (!actor || !classItem || !classItem.system?.startingItems) return;
  
  // Extrair os itens do texto
  const startingItemsText = classItem.system.startingItems;
  const { items, tables } = extractStartingItems(startingItemsText);
  
  // Array para armazenar todos os itens a serem adicionados
  const itemsToAdd = [];
  
  // Log para o usuário
  let startingItemsLog = "Itens iniciais adicionados:\n";
  
  // Processar itens regulares
  for (const itemData of items) {
    // Buscar o item
    const item = await findItemByName(itemData.name);
    
    if (item) {
      // Verificar se tem uma expressão de dado para quantidade
      let quantity;
      if (itemData.quantity.includes("d")) {
        quantity = await rollQuantity(itemData.quantity);
      } else {
        quantity = parseInt(itemData.quantity) || 1;
      }
      
      // Criar cópia do item e definir a quantidade
      const itemCopy = item.toObject();
      
      // Definir a quantidade com base no tipo do item
      if (["gear", "ammo", "consumable"].includes(item.type)) {
        itemCopy.system.quantity = quantity;
      }
      
      // Adicionar à lista de itens
      itemsToAdd.push(itemCopy);
      
      // Adicionar ao log
      startingItemsLog += `- ${item.name} (${quantity})\n`;
    } else {
      console.warn(`Item não encontrado: ${itemData.name}`);
      startingItemsLog += `- ERRO: Item não encontrado: ${itemData.name}\n`;
    }
  }
  
  // Processar tabelas
  for (const tableData of tables) {
    // Determinar o número de rolagens na tabela
    let rollsCount;
    if (tableData.quantity.includes("d")) {
      rollsCount = await rollQuantity(tableData.quantity);
    } else {
      rollsCount = parseInt(tableData.quantity) || 1;
    }
    
    // Buscar a tabela pelo nome
    const table = game.tables.find(t => t.name.toLowerCase() === tableData.name.toLowerCase());
    
    if (table) {
      startingItemsLog += `- Rolado ${rollsCount}x na tabela [${tableData.name}]:\n`;
      
      // Rolar na tabela o número de vezes indicado
      for (let i = 0; i < rollsCount; i++) {
        const result = await table.draw({ displayChat: false });
        
        if (result.results && result.results.length > 0) {
          const drawnResult = result.results[0];
          
          // Processar o resultado da tabela
          let resultItem = null;
          
          // Se o resultado for uma referência a um documento
          if (drawnResult.documentCollection) {
            if (drawnResult.documentCollection === "Item") {
              // Se for uma referência a um Item, obter o item
              resultItem = game.items.get(drawnResult.documentId);
            } else if (drawnResult.documentCollection.startsWith("Compendium.")) {
              // Se for uma referência a um item de compêndio
              const packName = drawnResult.documentCollection.substring(11);
              const pack = game.packs.get(packName);
              if (pack) {
                resultItem = await pack.getDocument(drawnResult.documentId);
              }
            }
          } else if (drawnResult.text) {
            // Se for um texto, procurar um item com esse nome
            resultItem = await findItemByName(drawnResult.text);
          }
          
          // Se encontrou um item, adicionar à lista
          if (resultItem) {
            itemsToAdd.push(resultItem.toObject());
            startingItemsLog += `  - ${resultItem.name}\n`;
          } else {
            startingItemsLog += `  - ERRO: Resultado não encontrado: ${drawnResult.text || "Resultado desconhecido"}\n`;
          }
        }
      }
    } else {
      console.warn(`Tabela não encontrada: ${tableData.name}`);
      startingItemsLog += `- ERRO: Tabela não encontrada: ${tableData.name}\n`;
    }
  }
  
  // Adicionar os itens ao personagem
  if (itemsToAdd.length > 0) {
    await actor.createEmbeddedDocuments("Item", itemsToAdd);
  }
  
  return startingItemsLog;
}

/**
 * Rola em uma tabela especial opcional e retorna o resultado
 * @param {string} tableKey - Chave da tabela (ex: "broken-bodies", "grim-chronicles")
 * @returns {string} O texto resultante da rolagem ou null se a tabela não foi encontrada
 */
async function rollOnOptionalTable(tableKey) {
  // Mapear a chave da tabela para o nome traduzido
  const tableNameMap = {
    "broken-bodies": game.i18n.localize("RONIN.CharacterGenerator.BrokenBodies"),
    "grim-chronicles": game.i18n.localize("RONIN.CharacterGenerator.GrimChronicles"),
    "bad-habits": game.i18n.localize("RONIN.CharacterGenerator.BadHabits"),
    "awful-afflictions": game.i18n.localize("RONIN.CharacterGenerator.AwfulAfflictions")
  };
  
  const tableName = tableNameMap[tableKey];
  if (!tableName) return null;
  
  // Procurar a tabela pelo nome traduzido
  const table = game.tables.find(t => t.name === tableName);
  if (!table) {
    console.warn(`Tabela "${tableName}" não encontrada`);
    return null;
  }
  
  // Rolar na tabela
  try {
    const result = await table.draw({ displayChat: false });
    
    if (!result.results || result.results.length === 0) {
      console.warn(`Tabela "${tableName}" não retornou resultados`);
      return null;
    }
    
    // Retornar o texto do resultado
    return `[${tableName}] ${result.results[0].text}`;
  } catch (error) {
    console.error(`Erro ao rolar na tabela "${tableName}":`, error);
    return null;
  }
}

/**
 * Função para exibir a janela de diálogo do gerador de personagens
 */
export async function showCharacterGeneratorDialog() {
  // Buscar todas as classes disponíveis no sistema
  const availableClasses = await getAvailableClasses();
  
  // Preparar os dados para o template
  const templateData = {
    alignmentOptions: [
      { value: "honored", label: game.i18n.localize("RONIN.CharacterGenerator.Honored"), checked: false },
      { value: "normal", label: game.i18n.localize("RONIN.CharacterGenerator.Normal"), checked: true },
      { value: "dishonored", label: game.i18n.localize("RONIN.CharacterGenerator.Dishonored"), checked: false }
    ],
    availableClasses: availableClasses,
    hasClasses: availableClasses.length > 0
  };
  
  // Renderizar o template HTML do diálogo
  const content = await renderTemplate("systems/ronin/templates/dialogs/character-generator-dialog.html", templateData);
  
  // Configurar os botões do diálogo
  const buttons = {
    ok: {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("OK"),
      callback: async (html) => {
        // Obter valores do formulário
        const form = html.find('form')[0];
        const alignment = form.alignment.value;
        
        // Obter classes selecionadas
        const selectedClasses = [];
        html.find('input[name="selectedClass"]:checked').each(function() {
          selectedClasses.push({
            id: $(this).val(),
            name: $(this).next('label').text().trim(),
            pack: $(this).data('pack')
          });
        });
        
        // Obter tabelas opcionais selecionadas
        const selectedTables = [];
        html.find('input[name="optionalTable"]:checked').each(function() {
          selectedTables.push($(this).val());
        });
        
        // Verificar se alguma classe foi selecionada
        if (selectedClasses.length > 0) {
          // Escolher uma classe aleatoriamente
          const randomIndex = Math.floor(Math.random() * selectedClasses.length);
          const chosenClass = selectedClasses[randomIndex];
          
          try {
            // Obter o item da classe (pode ser do mundo ou do compêndio)
            let classItem;
            if (chosenClass.pack) {
              // A classe está em um compêndio
              const pack = game.packs.get(chosenClass.pack);
              if (pack) {
                classItem = await pack.getDocument(chosenClass.id);
              }
            } else {
              // A classe é um item do mundo
              classItem = game.items.get(chosenClass.id);
            }
            
            // Verificar se o item da classe foi encontrado
            if (!classItem) {
              ui.notifications.error(`Erro: Não foi possível encontrar a classe "${chosenClass.name}"`);
              return;
            }
            
            // Extrair valores base dos atributos da classe
            const baseStats = classItem.system.baseStats || {};
            const baseVigor = parseInt(baseStats.vigor) || 0;
            const baseSwiftness = parseInt(baseStats.swiftness) || 0;
            const baseSpirit = parseInt(baseStats.spirit) || 0;
            const baseResilience = parseInt(baseStats.resilience) || 0;
            const baseHonor = parseInt(baseStats.honor) || 0;
            
            // Definir modificador baseado no alinhamento
            let alignmentMod = 0;
            if (alignment === "honored") alignmentMod = 1;
            if (alignment === "dishonored") alignmentMod = -1;
            
            // Executar rolagens para cada atributo
            const attrRolls = {};
            const attrValues = {};
            
            // Função para converter a rolagem no valor do atributo
            const convertRollToAttrValue = (rollTotal) => {
              if (rollTotal <= 4) return -3;
              if (rollTotal <= 6) return -2;
              if (rollTotal <= 8) return -1;
              if (rollTotal <= 12) return 0;
              if (rollTotal <= 14) return 1;
              if (rollTotal <= 16) return 2;
              return 3; // 17-20
            };
            
            // Função para rolar e processar cada atributo
            const rollAttribute = async (attrName, baseValue) => {
              // Realizar a rolagem (3d6 + base + alinhamento)
              const roll = new Roll(`3d6 + ${baseValue} + ${alignmentMod}`);
              await roll.evaluate();
              
              // Armazenar o resultado da rolagem
              attrRolls[attrName] = {
                formula: roll.formula,
                total: roll.total
              };
              
              // Converter para o valor do atributo (exceto para Honra)
              if (attrName !== "honor") {
                attrValues[attrName] = convertRollToAttrValue(roll.total);
              } else {
                // Para Honra, usar o resultado bruto da rolagem
                attrValues[attrName] = roll.total;
              }
              
              return attrValues[attrName];
            };
            
            // Rolar todos os atributos
            const vigorValue = await rollAttribute("vigor", baseVigor);
            const swiftnessValue = await rollAttribute("swiftness", baseSwiftness);
            const spiritValue = await rollAttribute("spirit", baseSpirit);
            const resilienceValue = await rollAttribute("resilience", baseResilience);
            const honorValue = await rollAttribute("honor", baseHonor);
            
            // Rolar HP baseado na fórmula da classe + o valor de Resiliência
            let hpFormula = "1d6"; // Valor padrão caso não esteja especificado
            let hpRoll = null;
            
            if (baseStats.hp) {
              // Extrai apenas a parte de dados da string (por exemplo: "10 + 1d6" -> "1d6")
              const diceMatch = baseStats.hp.match(/\d*d\d+/);
              if (diceMatch) {
                hpFormula = diceMatch[0];
              }
            }
            
            // Realizar a rolagem de HP
            hpRoll = new Roll(hpFormula);
            await hpRoll.evaluate();
            
            // Calcular HP máximo (Resiliência + rolagem)
            const hp = Math.max(1, resilienceValue + hpRoll.total); // Garantir pelo menos 1 HP
            
            // Rolar Texts (Espírito + 1d4)
            const textsRoll = new Roll("1d4");
            await textsRoll.evaluate();
            const textsValue = spiritValue + textsRoll.total;
            
            // Rolar Virtudes baseado na fórmula da classe
            let virtuesFormula = "1"; // Valor padrão
            let virtuesRoll = null;
            
            if (baseStats.virtues) {
              // Verificar se há uma fórmula de dados em virtues
              const virtuesDiceMatch = baseStats.virtues.match(/\d*d\d+/);
              if (virtuesDiceMatch) {
                virtuesFormula = virtuesDiceMatch[0];
              } else {
                // Se não há fórmula de dados, tentar usar como número direto
                const virtuesValue = parseInt(baseStats.virtues);
                if (!isNaN(virtuesValue)) {
                  virtuesFormula = virtuesValue.toString();
                }
              }
            }
            
            // Realizar a rolagem de Virtudes (ou usar valor fixo)
            virtuesRoll = new Roll(virtuesFormula);
            await virtuesRoll.evaluate();
            const virtuesValue = virtuesRoll.total;
            
            // Rolar Ryo baseado na fórmula da classe, com suporte a multiplicadores
            let ryoFormula = "2d6"; // Valor padrão
            let ryoRoll = null;
            let ryoMultiplier = 1;
            let ryoValue = 0;
            
            if (baseStats.ryo) {
              // Verificar se há uma fórmula de dados com multiplicador em ryo (como "1d6*10")
              const ryoMultMatch = baseStats.ryo.match(/(\d*d\d+)\s*\*\s*(\d+)/);
              
              if (ryoMultMatch) {
                // Captura o formato "XdY*Z"
                ryoFormula = ryoMultMatch[1]; // A parte dos dados "XdY"
                ryoMultiplier = parseInt(ryoMultMatch[2]); // O multiplicador "Z"
                
                // Realizar a rolagem da parte dos dados
                ryoRoll = new Roll(ryoFormula);
                await ryoRoll.evaluate();
                
                // Aplicar o multiplicador ao resultado
                ryoValue = ryoRoll.total * ryoMultiplier;
              } else {
                // Verificar se há apenas uma fórmula de dados sem multiplicador
                const ryoDiceMatch = baseStats.ryo.match(/\d*d\d+/);
                if (ryoDiceMatch) {
                  ryoFormula = ryoDiceMatch[0];
                  
                  // Realizar a rolagem sem multiplicador
                  ryoRoll = new Roll(ryoFormula);
                  await ryoRoll.evaluate();
                  ryoValue = ryoRoll.total;
                } else {
                  // Se não há fórmula de dados, tentar usar como número direto
                  const parsedValue = parseInt(baseStats.ryo);
                  if (!isNaN(parsedValue)) {
                    ryoFormula = parsedValue.toString();
                    ryoValue = parsedValue;
                    ryoRoll = { total: parsedValue }; // Objeto fictício para manter consistência
                  } else {
                    // Usar o valor padrão
                    ryoRoll = new Roll(ryoFormula);
                    await ryoRoll.evaluate();
                    ryoValue = ryoRoll.total;
                  }
                }
              }
            } else {
              // Usar o valor padrão
              ryoRoll = new Roll(ryoFormula);
              await ryoRoll.evaluate();
              ryoValue = ryoRoll.total;
            }
            
            // Verificar se existem as tabelas de nome
            const nameResults = await rollForCharacterName();

            // Determinar o nome e nickname do personagem
            let characterName, characterNickname;

            if (nameResults) {
              // Se encontrou as tabelas, use os resultados
              characterName = `${nameResults.firstName} ${nameResults.lastName}`.trim();
              characterNickname = nameResults.nickname;
              
              // Se não conseguiu um nome válido das tabelas, use o padrão
              if (!characterName || characterName === " ") {
                characterName = `Novo ${chosenClass.name}`;
              }
            } else {
              // Se não encontrou as tabelas, use o padrão
              characterName = `Novo ${chosenClass.name}`;
              characterNickname = "";
            }

            // Criar o novo personagem com os atributos calculados
            const newCharacter = await Actor.create({
              name: characterName,
              type: "character",
              img: "icons/svg/mystery-man.svg", // Imagem padrão
              system: {
                abilities: {
                  vigor: { value: vigorValue },
                  swiftness: { value: swiftnessValue },
                  spirit: { value: spiritValue },
                  resilience: { value: resilienceValue }
                },
                resources: {
                  hp: { value: hp, max: hp },
                  honor: { value: honorValue },
                  virtues: { value: virtuesValue },
                  ryo: { value: ryoValue },
                  texts: { value: textsValue }
                },
                class: classItem.name,
                nickname: characterNickname, // Adicionar o nickname
                background: "" // Inicializa o campo de background vazio
              }
            });
            
            // Adicionar a classe ao personagem
            await newCharacter.createEmbeddedDocuments("Item", [classItem.toObject()]);
            
            // Extrair feats e tabelas da classe
            const featsTableText = classItem.system.featsTable;
            const { feats, tables } = extractFeatsAndTables(featsTableText);
            
            // Array para armazenar todos os feats a serem adicionados
            const featsToAdd = [];
            const featNames = []; // Para exibir no log
            
            // Procurar feats diretos
            for (const featName of feats) {
              const feat = await findFeatByName(featName);
              if (feat) {
                featsToAdd.push(feat.toObject());
                featNames.push(featName);
              }
            }
            
            // Rolar nas rolltables
            for (const tableName of tables) {
              const rolledFeat = await rollOnTable(tableName);
              if (rolledFeat) {
                featsToAdd.push(rolledFeat.toObject());
                featNames.push(`${rolledFeat.name} (rolado em [${tableName}])`);
              } else {
                featNames.push(`Falha ao rolar em [${tableName}]`);
              }
            }
            
            // Adicionar os feats ao personagem
            if (featsToAdd.length > 0) {
              await newCharacter.createEmbeddedDocuments("Item", featsToAdd);
            }
            
            // Adicionar os itens iniciais
            const startingItemsLog = await addStartingItems(newCharacter, classItem);
            
            // Mostrar o modificador de alinhamento no log
            let alignmentInfo = "";
            if (alignment === "honored") alignmentInfo = " (+1 por Honrado)";
            if (alignment === "dishonored") alignmentInfo = " (-1 por Desonrado)";
            
            // Exibir os resultados das rolagens na UI para verificação
            let rollResults = `Personagem criado com rolagens${alignmentInfo}:\n`;
            rollResults += `Vigor: ${attrRolls.vigor.formula} = ${attrRolls.vigor.total} → ${vigorValue}\n`;
            rollResults += `Rapidez: ${attrRolls.swiftness.formula} = ${attrRolls.swiftness.total} → ${swiftnessValue}\n`;
            rollResults += `Espírito: ${attrRolls.spirit.formula} = ${attrRolls.spirit.total} → ${spiritValue}\n`;
            rollResults += `Resiliência: ${attrRolls.resilience.formula} = ${attrRolls.resilience.total} → ${resilienceValue}\n`;
            rollResults += `Honra: ${attrRolls.honor.formula} = ${honorValue} (valor direto)\n`;
            rollResults += `HP Máximo: ${resilienceValue} + (${hpFormula} = ${hpRoll.total}) = ${hp}\n`;
            rollResults += `Textos: ${spiritValue} + (1d4 = ${textsRoll.total}) = ${textsValue}\n`;
            rollResults += `Virtudes: ${virtuesFormula} = ${virtuesValue}\n`;
            
            // No resultado exibido, mostrar o multiplicador se foi usado
            if (ryoMultiplier > 1) {
              rollResults += `Ryo: ${ryoFormula} (${ryoRoll.total}) × ${ryoMultiplier} = ${ryoValue}\n`;
            } else {
              rollResults += `Ryo: ${ryoFormula} = ${ryoValue}\n`;
            }
            
            // Adicionar informações dos feats
            if (featNames.length > 0) {
              rollResults += `\nCaracterísticas adicionadas: ${featNames.join(", ")}`;
            }
            
            // Adicionar informações dos itens iniciais
            if (startingItemsLog) {
              rollResults += `\n\n${startingItemsLog}`;
            }
            
            // Agora, processar as tabelas opcionais
            if (selectedTables.length > 0) {
              // Preparar o texto do background com os resultados das tabelas
              let backgroundText = "";
              
              // Rolar em cada tabela selecionada
              for (const tableKey of selectedTables) {
                const result = await rollOnOptionalTable(tableKey);
                if (result) {
                  // Adicionar o resultado ao texto do background com quebra de linha
                  backgroundText += result + "\n";
                }
              }
              
              // Atualizar o campo de background do personagem
              if (backgroundText) {
                await newCharacter.update({ "system.background": backgroundText });
                rollResults += `\n\nTabelas opcionais adicionadas ao Background:\n${backgroundText}`;
              }
            }
            
            // Exibir mensagem com os resultados
            ui.notifications.info(rollResults);
            
            // Abrir a ficha do personagem
            newCharacter.sheet.render(true);
            
          } catch (error) {
            console.error("Erro ao criar personagem:", error);
            ui.notifications.error("Erro ao criar personagem. Verifique o console para mais detalhes.");
          }
        } else {
          // Mensagem caso nenhuma classe tenha sido selecionada
          ui.notifications.warn("Nenhuma classe foi selecionada.");
        }
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: game.i18n.localize("Cancel")
    }
  };
  
  // Criar e exibir o diálogo
  const dialog = new Dialog({
    title: game.i18n.localize("RONIN.CharacterGenerator.DialogTitle"),
    content: content,
    buttons: buttons,
    default: "cancel",
    width: 550, // Aumentar a largura para comportar as duas colunas
    classes: ["ronin-character-generator"], // Adiciona uma classe específica ao diálogo
    // Configurar event listeners após a renderização
    render: (html) => {
      // Adicionar listeners para os botões de seleção de classes
      html.find('.select-all-button').click(event => {
        event.preventDefault();
        html.find('input[name="selectedClass"]').prop('checked', true);
      });
      
      html.find('.select-none-button').click(event => {
        event.preventDefault();
        html.find('input[name="selectedClass"]').prop('checked', false);
      });
    }
  });
  
  dialog.render(true);
}
