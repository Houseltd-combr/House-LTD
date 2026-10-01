console.log('📋 Formulário carregado');

import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById('form-solicitacao');

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // ⚠️ ISSO É O MAIS IMPORTANTE! Para não recarregar a página

        const botao = form.querySelector('button[type="submit"]');
        const textoOriginal = botao.innerHTML;
        botao.innerHTML = 'ENVIANDO...';
        botao.disabled = true;

        // Pegar valores dos campos
        const dados = {
            nome: document.getElementById('nome').value.trim(),
            telefone: document.getElementById('telefone').value.trim(),
            personagem: document.getElementById('personagem').value.trim(),
            obra: document.getElementById('obra').value.trim(),
            mensagem: document.getElementById('mensagem').value.trim() || '',
            status: 'pendente',
            data: serverTimestamp()
        };

        console.log('📤 Enviando dados:', dados);

        // Validar campos obrigatórios
        if (!dados.nome || !dados.telefone || !dados.personagem || !dados.obra) {
            alert('❌ Preencha todos os campos obrigatórios!');
            botao.innerHTML = textoOriginal;
            botao.disabled = false;
            return;
        }

        try {
            // Salvar no Firebase
            const docRef = await addDoc(collection(db, "characterRequests"), dados);
            console.log('✅ Solicitação enviada com sucesso! ID:', docRef.id);
            
            alert('✅ SOLICITAÇÃO ENVIADA COM SUCESSO!\n\nObrigado por se inscrever! ✨');
            form.reset(); // Limpa o formulário SÓ DEPOIS de enviar com sucesso!
            
        } catch (erro) {
            console.error('❌ Erro ao enviar:', erro);
            alert('❌ Erro ao enviar: ' + erro.message + '\n\nVerifique sua conexão e tente novamente.');
        }

        botao.innerHTML = textoOriginal;
        botao.disabled = false;
    });
} else {
    console.log('⚠️ Formulário não encontrado na página');
}
