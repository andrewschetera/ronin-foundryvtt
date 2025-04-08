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
  // Define estilos inline pois o posicionamento absoluto no CSS pode não funcionar corretamente
  display.style.position = 'absolute';
  display.style.width = `${input.offsetWidth}px`;
  display.style.height = `${input.offsetHeight}px`;
  display.style.display = 'flex';
  display.style.alignItems = 'center';
  display.style.justifyContent = 'center';
  display.style.pointerEvents = 'none';
  display.style.fontSize = `${Math.floor(input.offsetHeight * 0.6)}px`;
  display.style.fontWeight = 'bold';
  display.style.top = '0';
  display.style.left = '0';
  
  // Ajuste para manter o display posicionado corretamente quando houver rolagem
  const inputRect = input.getBoundingClientRect();
  const parentRect = input.offsetParent.getBoundingClientRect();
  
  display.style.top = `${input.offsetTop}px`;
  display.style.left = `${input.offsetLeft}px`;
}

// Evento a ser executado quando uma folha de ator é renderizada
Hooks.on('renderActorSheet', (app, html, data) => {
  // Cria os displays para os inputs de atributos
  setTimeout(() => {
    setupAttributeDisplays();
  }, 100); // Pequeno delay para garantir que os elementos estejam carregados
  
  // Adiciona listener para reposicionar quando a janela for redimensionada
  window.addEventListener('resize', () => {
    setupAttributeDisplays();
  });
});
