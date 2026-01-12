// Pega a hora atual para personalizar a mensagem
const hours = new Date().getHours();
const greetingElement = document.getElementById('greeting-msg');

let greetingText = 'Olá';
if (hours >= 5 && hours < 12) greetingText = 'Bom dia';
else if (hours >= 12 && hours < 18) greetingText = 'Boa tarde';
else greetingText = 'Boa noite';

greetingElement.innerText = `${greetingText}, Jorlan!`;

// Lógica de navegação rápida (Card de Automação Fiscal)
const btnGoFiscal = document.getElementById('btn-go-fiscal');

if (btnGoFiscal) {
    btnGoFiscal.addEventListener('click', () => {
        // Como estamos usando arquivos HTML reais agora, usamos window.location
        window.location.href = '../fiscal/conf_fiscal.html';
    });
}