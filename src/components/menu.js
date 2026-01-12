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

        <a href="../conf_fiscal/conf_fiscal.html" class="menu-item" id="link-fiscal">
            <span class="material-icons-round">receipt_long</span>
            <span>Conferência Fiscal</span>
        </a>
    </nav>
</div>
`;

// 2. Injeta no elemento <aside id="sidebar-container">
document.getElementById('sidebar-container').innerHTML = sidebarHTML;

// 3. Lógica para saber em qual página estamos e pintar o botão de azul
const currentPath = window.location.pathname;

if (currentPath.includes('index.html')) {
    document.getElementById('link-home').classList.add('active');
} else if (currentPath.includes('conf_fiscal.html')) {
    document.getElementById('link-fiscal').classList.add('active');
}