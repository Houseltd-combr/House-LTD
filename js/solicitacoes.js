console.log('📥 Sistema de Solicitações carregado');

document.addEventListener('DOMContentLoaded', () => {
    const fichaForm = document.getElementById('ficha-form');
    if (fichaForm) {
        fichaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('✅ Solicitação enviada com sucesso! Aguarde a aprovação da administração.');
            fichaForm.reset();
        });
    }
});
