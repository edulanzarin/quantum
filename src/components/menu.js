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
                <a href="../conf_fiscal/conf_fiscal_bp.html" class="submenu-item" id="link-conf_fiscal_bp">
                    <span class="material-icons-round">play_arrow</span>
                    <span>Conferência BP</span>
                </a>
                <a href="../conf_fiscal/conf_auditoria.html" class="submenu-item" id="link-conf_auditoria">
                    <span class="material-icons-round">tune</span>
                    <span>Conferência AUditoria</span>
                </a>
            </div>
        </div>
    </nav>
</div>
`;

// 2. Injeta no elemento <aside id="sidebar-container">
document.getElementById("sidebar-container").innerHTML = sidebarHTML;

// 3. Lógica para expansão do submenu
const toggleFiscal = document.getElementById("toggle-fiscal");
const submenuFiscal = document.getElementById("submenu-fiscal");

// Verifica se estamos em alguma página do grupo Conferência Fiscal
const currentPath = window.location.pathname;
const isFiscalPage =
  currentPath.includes("conf_fiscal_bp") ||
  currentPath.includes("conf_auditoria");

// Se estiver em uma página fiscal, expande o menu automaticamente
if (isFiscalPage) {
  submenuFiscal.classList.add("expanded");
  toggleFiscal.classList.add("active");
}

// Toggle ao clicar no menu principal
toggleFiscal.addEventListener("click", (e) => {
  e.preventDefault();
  submenuFiscal.classList.toggle("expanded");
  toggleFiscal.classList.toggle("active");
});

// 4. Marca a página atual como ativa
if (currentPath.includes("index.html")) {
  document.getElementById("link-home").classList.add("active");
} else if (currentPath.includes("conf_fiscal_bp.html")) {
  document.getElementById("link-conf_fiscal_bp").classList.add("active");
} else if (currentPath.includes("conf_auditoria.html")) {
  document.getElementById("link-conf_auditoria").classList.add("active");
}
