console.log('🔄 Sistema de Troca carregado');

import { db, uploadImagem } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const trocaForm = document.getElementById('troca-form');
    if (trocaForm) {
        trocaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = trocaForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'ENVIANDO...';

            try {
                const personagemAtual = document.getElementById('personagem-atual').value.trim();
                const obraAtual = document.getElementById('obra-atual').value.trim();
                const novoPersonagem = document.getElementById('novo-personagem').value.trim();
                const novaObra = document.getElementById('nova-obra').value.trim();
                const novaFotoArquivo = document.getElementById('nova-foto').files[0];

                if (!novaFotoArquivo) {
                    alert('❌ Selecione a nova foto!');
                    btn.disabled = false;
                    btn.textContent = 'ENVIAR SOLICITAÇÃO DE TROCA';
                    return;
                }

                const resultadoUpload = await uploadImagem(novaFotoArquivo);
                
                if (!resultadoUpload.sucesso) {
                    throw new Error(resultadoUpload.erro || 'Falha ao enviar imagem');
                }

                const novaFotoUrl = resultadoUpload.url;

                await addDoc(collection(db, "trocaRequests"), {
                    personagemAtual,
                    obraAtual,
                    novoPersonagem,
                    novaObra,
                    novaFoto: novaFotoUrl,
                    status: "pendente",
                    data: serverTimestamp()
                });

                alert('✅ Solicitação de troca enviada! A administração analisará seu pedido.');
                trocaForm.reset();
                
            } catch (erro) {
                console.error('❌ Erro:', erro);
                alert('❌ Erro ao enviar: ' + erro.message);
            }

            btn.disabled = false;
            btn.textContent = 'ENVIAR SOLICITAÇÃO DE TROCA';
        });
    }
});
