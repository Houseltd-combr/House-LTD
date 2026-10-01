console.log('🔄 Sistema de Troca carregado');

document.addEventListener('DOMContentLoaded', () => {
    const trocaForm = document.getElementById('troca-form');
    if (trocaForm) {
        trocaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('✅ Solicitação de troca enviada! A administração analisará seu pedido.');
            trocaForm.reset();
        });
    }
});
