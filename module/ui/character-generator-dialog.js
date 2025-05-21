// module/ui/character-generator-dialog.js - Janela de diálogo para o gerador de personagens

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
            
            // Criar o novo personagem com os atributos calculados
            const newCharacter = await Actor.create({
              name: `Novo ${chosenClass.name}`,
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
                class: classItem.name
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
              rollResults += `Características adicionadas: ${featNames.join(", ")}`;
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