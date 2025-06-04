# ronin-foundryvtt

Sistema não-oficial do jogo RONIN para o Foundry VTT

Esta implementação foi inspirada no sistema MorkBorg para o foundry.

Este sistema contém as funcionalidades das fichas de personagens, inimigos, itens consumíveis, equipamentos, armas, munições, armadura, classes e características.
As fichas de personagens são 100% funcionais, com testes de atributos, ataques com armas equipadas, defesa com armadura equipada, parry, ativação de características e textos, além das funcionalidades de quebrado, seppuku, descanso, meditação e evolução de personagem.

O sistema está programado para localizar tabelas de rolagem específicas em alguns testes, como ferimentos de seppuku ou em caso de falha crítica no uso de textos. Nesses casos, ele procurará por tabelas com nomes específicos de acordo com o idioma utilizado. Por exemplo, se estiver em português ele procurará por uma tabela chamada "A Vingança de Kami", enquanto se estiver em inglês procurará por uma tabela chamada "Kami's Revenge". Caso não encontre uma tabela com o nome correto, simplesmente será exibida uma mensagem genérica informando que será necessário rolar na tabela.

O sistema também conta com um gerador de personagens.

Funções opcionais de gerenciamento de consumíveis e rolagem de atributos no modo solo.

## Como usar o gerador de personagem 
O gerador de personagem procurará automaticamente todas as classes disponíveis no seu mundo e as listará na janela do gerador, onde você pode escolher a classe manualmente ou permitir que seja escolhida aleatoriamente. Você também pode definir se o personagem criado será Honrado, Normal ou Desonrado.
Você pode configurar equipamentos iniciais, características e habilidades da classe listando em sua ficha estes equipamentos, simplesmente colocando-os separados por vírgulas com o nome exato do item ou habilidade desejado (também é possível no caso de itens do tipo equipamento, misc ou munição colocar uma quantidade como valor numérico antes do nome do item). Caso deseje que seja rolado um item ou característica, você pode referenciar uma rolltable colocando o nome exato da rolltable entre colchetes.

## Próximos passos:
- Reformulação dos estilos css para melhor manutenção

# ronin-foundryvtt
Unofficial system for the RONIN RPG, made for Foundry VTT

This implementation was inspired by the Mörk Borg system for Foundry.

The system includes character sheets, enemies, consumable items, equipment, weapons, ammunition, armor, classes, and features.
Character sheets are fully functional, supporting attribute tests, attacks with equipped weapons, defense with equipped armor, parry, activation of features and texts, as well as mechanics like broken, seppuku, resting, meditation, and character advancement.

The system is programmed to look for specific roll tables in certain tests, such as seppuku injuries or critical failures when using texts. In these cases, it searches for tables with specific names depending on the selected language. For example, if the language is set to Portuguese, it will look for a table named "A Vingança de Kami", while in English it will look for "Kami's Revenge". If the correctly named table is not found, a generic message will appear informing the user that a roll on the table is needed.

The system also includes a character generator.

Optional functions include consumable management and attribute rolling for solo play.

## How to use the character generator
The character generator will automatically search for all available classes in your world and list them in the generator window, where you can either manually select a class or allow it to be chosen at random. You can also set whether the character will be Honored, Neutral, or Dishonored.
You can configure starting equipment, features, and class abilities by listing them on the class sheet, separating them with commas using the exact name of the desired item or ability. For equipment, misc items, or ammunition, you may also include a quantity as a numeric value before the item name. If you want to roll for a random item or feature, you can reference a rolltable by placing its exact name in square brackets.

## Next steps:
Refactor CSS styles for easier maintenance
