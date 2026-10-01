console.log('📋 Formulário carregado');

import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById('form-solicitacao');
const mensagemSucesso = document.getElementById('mensagem-sucesso');
const inputFoto = document.getElementById('foto');
const previewContainer = document.getElementById('preview-container');
const previewFoto = document.getElementById('preview-foto');

// Pré-visualização da foto
if (inputFoto) {
    inputFoto.addEventListener('change', function(e) {
        const arquivo = e.target.files[0];
        if (arquivo) {
            const leitor = new FileReader();
            leitor.onload = function(e) {
                previewFoto.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            leitor.readAsDataURL(arquivo);
        } else {
            previewContainer.style.display = 'none';
        }
    });
}

// Enviar foto para o Cloudinary
async function enviarParaCloudinary(arquivo) {
    const cloudName = "dum5yqzbo"; // ⚠️ TROQUE PELO SEU CLOUD NAME!
    const uploadPreset = "house_ltd";

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("upload_preset", uploadPreset);

    try {
        const resposta = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: formData }
        );
        const dados = await resposta.json();
        if (dados.secure_url) {
            return { sucesso: true, url: dados.secure_url };
        }
        return { sucesso: false, erro: "Sem URL na resposta" };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// Envio do formulário
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btn = document.getElementById('btn-enviar');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = 'ENVIANDO...';
        btn.disabled = true;

        // Pegar valores
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const personagem = document.getElementById('personagem').value.trim();
        const obra = document.getElementById('obra').value.trim();
        const arquivoFoto = inputFoto.files[0];
        const mensagem = document.getElementById('mensagem').value.trim() || '';

        // Validar
        if (!nome || !telefone || !personagem || !obra || !arquivoFoto) {
            alert('❌ Preencha TODOS os campos e escolha uma foto!');
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
            return;
        }

        if (telefone.length !== 4) {
            alert('❌ Digite exatamente os 4 últimos dígitos do telefone!');
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
            return;
        }

        // Enviar foto primeiro
        alert('📸 Enviando foto, aguarde um instante...');
        const upload = await enviarParaCloudinary(arquivoFoto);
        
        if (!upload.sucesso) {
            alert('❌ Erro ao enviar foto: ' + upload.erro);
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
            return;
        }

        // Salvar no Firebase
        try {
            await addDoc(collection(db, "characterRequests"), {
                nome: nome,
                telefone: telefone,
                personagem: personagem,
                obra: obra,
                foto: upload.url,
                mensagem: mensagem,
                status: 'pendente',
                data: serverTimestamp()
            });

            form.style.display = 'none';
            mensagemSucesso.style.display = 'block';
            
        } catch (erro) {
            console.error('❌ Erro ao salvar:', erro);
            alert('❌ Erro: ' + erro.message);
        }

        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    });
}

window.voltar = function() {
    form.reset();
    previewContainer.style.display = 'none';
    form.style.display = 'block';
    mensagemSucesso.style.display = 'none';
};
