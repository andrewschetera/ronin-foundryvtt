/**
 * Script para formatar automaticamente os valores dos atributos com sinais + ou -
 */

// Função para formatar números com sinal
function formatWithSign(value) {
  // Se já for string e começar com - ou +, retorna como está
  if (typeof value === 'string' && (value.startsWith('-') || value.startsWith('+'))) {
    return value;
  }
  
  // Converte para número
  const numValue = Number(value);
  
  // Verifica se é um número válido
  if (isNaN(numValue)) {
    return value;
  }
  
  // Adiciona o sinal apropriado
  return numValue >= 0 ? `+${numValue}` : `${numValue}`;
}

// Função para atualizar todos os inputs de atributos
function updateAllAttributeInputs() {
  const abilityInputs = document.querySelectorAll('.ability input[type="number"]');
  
  abilityInputs.forEach(input => {
    // Obtém o valor atual
    const currentValue = input.value;
    
    // Formata o valor
    const formattedValue = formatWithSign(currentValue);
    
    // Atualiza o valor apenas se necessário
    if (formattedValue !== currentValue) {
      input.value = formattedValue;
    }
  });
}

// Evento a ser executado quando o documento estiver pronto
Hooks.on('renderActorSheet', (app, html, data) => {
  // Formata inicialmente todos os inputs de atributos
  updateAllAttributeInputs();
  
  // Adiciona listeners para eventos de alteração nos inputs de atributos
  const abilityInputs = html.find('.ability input[type="number"]');
  
  abilityInputs.on('change', (event) => {
    const input = event.currentTarget;
    input.value = formatWithSign(input.value);
  });
  
  // Adiciona listeners para eventos de blur nos inputs de atributos
  abilityInputs.on('blur', (event) => {
    const input = event.currentTarget;
    input.value = formatWithSign(input.value);
  });
});
