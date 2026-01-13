// Navegação
const btnConfFiscal = document.getElementById('btn-conf-fiscal');

if (btnConfFiscal) {
    btnConfFiscal.addEventListener('click', () => {
        // Redireciona para a tela do módulo fiscal
        window.location.href = '../fiscal/conf_fiscal.html';
    });
}

// Botão limpar console (apenas visual por enquanto)
const btnClear = document.querySelector('.btn-clear');
const consoleWindow = document.querySelector('.console-window');

if (btnClear && consoleWindow) {
    btnClear.addEventListener('click', () => {
        consoleWindow.innerHTML = '<div class="log-line"><span class="time">[' + new Date().toLocaleTimeString() + ']</span><span class="msg info">Console limpo.</span></div>';
    });
}