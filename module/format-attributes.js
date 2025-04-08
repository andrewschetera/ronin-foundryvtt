/**
 * Script para formatar visualmente os valores dos atributos com sinais + ou -
 * sem alterar o valor real do input
 */

// Adiciona displays formatados para todos os inputs de atributos
function setupAttributeDisplays() {
  const abilityInputs = document.querySelectorAll('.ability input[type="number"]');
  
  abilityInputs.forEach(input => {
    // Obtém o valor atual
    const currentValue = input.value;
    
    // Verifica se já existe um display
    let signDisplay = input.nextElementSibling;
    if (!signDisplay || !signDisplay.classList.contains('attribute-sign')) {
      // Cria o elemento de display se não existir
      signDisplay = document.createElement('span');
      signDisplay.classList.add('attribute-sign');
      input.parentNode.insertBefore(signDisplay, input.nextSibling);
    }
    
    // Atualiza o texto do display
    updateSignDisplay(input, signDisplay);
    
    // Adiciona evento para atualizar o display quando o valor mudar
    input.addEventListener('change', () => {
      updateSignDisplay(input, signDisplay);
    });
    
    input.addEventListener('input', () => {
      updateSignDisplay(input, signDisplay);
    });
  });
}

// Atualiza o display de sinal para um input
function updateSignDisplay(input, display) {
  // Obtém o valor atual como número
  const value = parseInt(input.value) || 0;
  
  // Formata com o sinal apropriado
  const formattedValue = value >= 0 ? `+${value}` : `${value}`;
  
  // Atualiza o texto do display
  display.textContent = formattedValue;
  
  // Ajusta a posição para sobrepor o input
  positionSignDisplay(input, display);
}

// Posiciona o display sobre o input
function positionSignDisplay(input, display) {
  // Obtém a posição e dimensões do input
  const rect = input.getBoundingClientRect();
  
  // Aplica estilos para posicionar o display sobre o input
  display.style.position = 'absolute';
  display.style.left = `${rect.left}px`;
  display.style.top = `${rect.top}px`;
  display.style.width = `${rect.width}px`;
  display.style.height = `${rect.height}px`;
  display.style.display = 'flex';
  display.style.alignItems = 'center';
  display.style.justifyContent = 'center';
  display.style.pointerEvents = 'none'; // Permite clicar "através" do display
  display.style.fontSize = `${Math.floor(rect.height * 0.6)}px`;
}

// Evento a ser executado quando uma folha de ator é renderizada
Hooks.on('renderActorSheet', (app, html, data) => {
  // Cria os displays para os inputs de atributos
  setupAttributeDisplays();
  
  // Re-posiciona os displays quando a janela for redimensionada
  window.addEventListener('resize', () => {
    const abilityInputs = document.querySelectorAll('.ability input[type="number"]');
    abilityInputs.forEach(input => {
      const signDisplay = input.nextElementSibling;
      if (signDisplay && signDisplay.classList.contains('attribute-sign')) {
        positionSignDisplay(input, signDisplay);
      }
    });
  });
});
