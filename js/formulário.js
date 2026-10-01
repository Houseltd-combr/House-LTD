console.log('📋 Formulário carregado');

import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById('form-solicitacao');
const mensagemSucesso = document.getElementById('mensagem-sucesso');
const inputFoto = document.getElementById('foto');
const previewContainer = document.getElementById('preview-container');
const previewFoto = document.getElementById('preview-foto');

// Pré-visualização da foto escolhida
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

// Função para enviar a foto ao Cloudinary
async function enviarParaCloudinary(arquivo) {
    const cloudName = "dum5yqzbo"; // ⚠️ Troque pelo SEU nome do Cloudinary!
    const uploadPreset = "house_ltd"; // Nome do preset que você criou

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

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btnEnviar = document.getElementById('btn-enviar');
        const textoOriginal = btnEnviar.innerHTML;
        btnEnviar.innerHTML = 'ENVIANDO...';
        btnEnviar.disabled = true;

        // Pegar dados
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const personagem = document.getElementById('personagem').value.trim();
        const obra = document.getElementById('obra').value.trim();
        const arquivoFoto = inputFoto.files[0];
        const mensagem = document.getElementById('mensagem').value.trim() || '';

        console.log('📤 Dados prontos para envio');

        // Validação
        if (!nome || !telefone || !personagem || !obra || !arquivoFoto) {
            alert('❌ Preencha TODOS os campos e escolha uma foto!');
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;
            return;
        }

        if (telefone.length !== 4) {
            alert('❌ Digite exatamente os 4 últimos dígitos do telefone!');
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;
            return;
        }

        // Enviar foto primeiro
        alert('📸 Enviando foto, aguarde um instante...');
        const resultadoUpload = await enviarParaCloudinary(arquivoFoto);
        
        if (!resultadoUpload.sucesso) {
            alert('❌ Erro ao enviar foto: ' + resultadoUpload.erro);
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;
            return;
        }

        console.log('✅ Foto enviada:', resultadoUpload.url);

        // Salvar no Firebase com a URL da foto
        const dados = {
            nome: nome,
            telefone: telefone,
            personagem: personagem,
            obra: obra,
            foto: resultadoUpload.url,
            mensagem: mensagem,
            status: 'pendente',
            data: serverTimestamp()
        };

        try {
            console.log('📡 Salvando solicitação...');
            const docRef = await addDoc(collection(db, "characterRequests"), dados);
            console.log('✅ Solicitação salva! ID:', docRef.id);
            
            form.style.display = 'none';
            mensagemSucesso.style.display = 'block';
            
        } catch (erro) {
            console.error('❌ Erro ao salvar:', erro);
            alert('❌ Erro: ' + erro.message);
            
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;
        }
    });
}

window.voltar = function() {
    form.reset();
    previewContainer.style.display = 'none';
    form.style.display = 'block';
    mensagemSucesso.style.display = 'none';
};
