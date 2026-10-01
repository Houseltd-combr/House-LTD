console.log('📥 Sistema de Solicitações carregado');

import { db, uploadImagem } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const fichaForm = document.getElementById('ficha-form');
    if (fichaForm) {
        fichaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = fichaForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'ENVIANDO...';

            try {
                const nome = document.getElementById('nome').value.trim();
                const idade = document.getElementById('idade').value;
                const telefone = document.getElementById('telefone').value.trim();
                const personagem = document.getElementById('personagem').value.trim();
                const obra = document.getElementById('obra').value.trim();
                const fotoArquivo = document.getElementById('foto').files[0];
                const mensagem = document.getElementById('mensagem').value.trim();

                if (!fotoArquivo) {
                    alert('❌ Selecione uma foto!');
                    btn.disabled = false;
                    btn.textContent = 'ENVIAR SOLICITAÇÃO';
                    return;
                }

                const resultadoUpload = await uploadImagem(fotoArquivo);
                
                if (!resultadoUpload.sucesso) {
                    throw new Error(resultadoUpload.erro || 'Falha ao enviar imagem');
                }

                const fotoUrl = resultadoUpload.url;

                await addDoc(collection(db, "characterRequests"), {
                    nome,
                    idade,
                    telefone,
                    personagem,
                    obra,
                    foto: fotoUrl,
                    mensagem: mensagem || "",
                    status: "pendente",
                    data: serverTimestamp()
                });

                alert('✅ Solicitação enviada com sucesso! Aguarde a aprovação.');
                fichaForm.reset();
                
            } catch (erro) {
                console.error('❌ Erro:', erro);
                alert('❌ Erro ao enviar: ' + erro.message);
            }

            btn.disabled = false;
            btn.textContent = 'ENVIAR SOLICITAÇÃO';
        });
    }
});
