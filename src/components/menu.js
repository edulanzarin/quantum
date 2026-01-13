// components/menu.js

// 1. O HTML do Menu
const sidebarHTML = `
<div class="sidebar-content">
    <div class="sidebar-header">
        <span class="material-icons-round" style="color: #0d6efd;">account_balance</span>
        <span>Jorlan Contábil</span>
    </div>

    <nav>
        <a href="../home/index.html" class="menu-item" id="link-home">
            <span class="material-icons-round">dashboard</span>
            <span>Home</span>
        </a>

        <div class="menu-group">
            <button class="menu-item menu-toggle" id="toggle-fiscal">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <span class="material-icons-round">receipt_long</span>
                    <span>Conferência Fiscal</span>
                </div>
                <span class="material-icons-round arrow-icon">expand_more</span>
            </button>
            
            <div class="submenu" id="submenu-fiscal">
                <a href="../conf_fiscal/conf_fiscal.html" class="submenu-item" id="link-fiscal">
                    <span class="material-icons-round">play_arrow</span>
                    <span>Executar Conferência</span>
                </a>
                <a href="../config_planos/config_planos.html" class="submenu-item" id="link-config-planos">
                    <span class="material-icons-round">tune</span>
                    <span>Configurar Planos</span>
                </a>
            </div>
        </div>
    </nav>
</div>
`;

// 2. Injeta no elemento <aside id="sidebar-container">
document.getElementById('sidebar-container').innerHTML = sidebarHTML;

// 3. Lógica para expansão do submenu
const toggleFiscal = document.getElementById('toggle-fiscal');
const submenuFiscal = document.getElementById('submenu-fiscal');

// Verifica se estamos em alguma página do grupo Conferência Fiscal
const currentPath = window.location.pathname;
const isFiscalPage = currentPath.includes('conf_fiscal') || currentPath.includes('config_planos') || currentPath.includes('config_plano');

// Se estiver em uma página fiscal, expande o menu automaticamente
if (isFiscalPage) {
    submenuFiscal.classList.add('expanded');
    toggleFiscal.classList.add('active');
}

// Toggle ao clicar no menu principal
toggleFiscal.addEventListener('click', (e) => {
    e.preventDefault();
    submenuFiscal.classList.toggle('expanded');
    toggleFiscal.classList.toggle('active');
});

// 4. Marca a página atual como ativa
if (currentPath.includes('index.html')) {
    document.getElementById('link-home').classList.add('active');
} else if (currentPath.includes('conf_fiscal.html')) {
    document.getElementById('link-fiscal').classList.add('active');
} else if (currentPath.includes('config_planos.html')) {
    document.getElementById('link-config-planos').classList.add('active');
}