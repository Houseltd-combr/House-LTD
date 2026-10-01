// 🔐 SISTEMA DE AUTENTICAÇÃO ADMINISTRATIVA — HOUSE LTD
const adminCodes = {
    'YM7JQ7': { nome: 'Aiko', cargo: 'Dono' },
    'YQ7NM4': { nome: 'Noah', cargo: 'Sub-dono' },
    'JM7XQ8': { nome: 'Shime', cargo: 'Líder de ADM' },
    'Y7KQ2M': { nome: 'Shiro', cargo: 'ADM' },
    'M7IQY5': { nome: 'Isa', cargo: 'Staff' },
    'QY7MH3': { nome: 'Mah', cargo: 'ADM' },
    'Y4JQ7L': { nome: 'Luan', cargo: 'ADM' },
    'K7YQ9M': { nome: 'Ayrken', cargo: 'ADM' },
    'YM4QX7': { nome: 'Evan', cargo: 'ADM' },
    'Q7YTM5': { nome: 'Tamsy', cargo: 'ADM' },
    'JY7QK6': { nome: 'Lucca', cargo: 'ADM' },
    'YQ5M7X': { nome: 'Kally', cargo: 'ADM' },
    'TH1K0L': { nome: 'Lici', cargo: 'ADM' }
};

document.addEventListener('DOMContentLoaded', () => {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('admin-code').value.trim();
            if (adminCodes[code]) {
                localStorage.setItem('adminLogado', 'true');
                localStorage.setItem('adminNome', adminCodes[code].nome);
                localStorage.setItem('adminCargo', adminCodes[code].cargo);
                window.location.href = 'painel.html';
            } else {
                alert('❌ Código inválido! Tente novamente.');
                document.getElementById('admin-code').value = '';
            }
        });
    }

    // Mostrar nome do ADM
    const adminNomeEl = document.getElementById('admin-nome');
    if (adminNomeEl) {
        const nome = localStorage.getItem('adminNome');
        if (nome) {
            adminNomeEl.textContent = nome;
        } else {
            adminNomeEl.textContent = 'Visitante';
        }
    }

    // Verificar se está logado nas páginas do painel
    const path = window.location.pathname;
    if (path.includes('/admin/') && !path.includes('login.html')) {
        const logado = localStorage.getItem('adminLogado');
        if (!logado) {
            window.location.href = 'login.html';
        }
    }
});
