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
      signDisplay = document.createElement('div');  // Usando div em vez de span
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
  
  // Posiciona o display
  display.style.position = 'absolute';
  display.style.zIndex = '10';
  display.style.top = '0';
  display.style.left = '0';
  display.style.width = '100%';
  display.style.height = '100%';
  display.style.display = 'flex';
  display.style.alignItems = 'center';
  display.style.justifyContent = 'center';
  display.style.pointerEvents = 'none';
  display.style.color = '#FFFFFF';  // Texto branco
  display.style.fontSize = '1.7em';  // Tamanho igual ao input
  display.style.fontWeight = 'bold';
}

// Evento a ser executado quando uma folha de ator é renderizada
Hooks.on('renderActorSheet', (app, html, data) => {
  // Adiciona um pequeno atraso para garantir que os elementos estejam renderizados
  setTimeout(() => {
    setupAttributeDisplays();
  }, 100);
});
