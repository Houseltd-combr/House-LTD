console.log('📋 Sistema de Vagas carregado');

import { db } from './firebase.js';
import { 
    collection, 
    query, 
    where, 
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const vagasAbertas = document.getElementById('vagas-abertas');
const vagasFechadas = document.getElementById('vagas-fechadas');

window.criarVaga = async function() {
    const personagem = document.getElementById('nova-vaga-personagem').value.trim();
    const obra = document.getElementById('nova-vaga-obra').value.trim();
    const foto = document.getElementById('nova-vaga-foto').value.trim();

    if (!personagem || !obra) {
        alert('❌ Preencha o nome do personagem e a obra!');
        return;
    }

    try {
        await addDoc(collection(db, "vagas"), {
            personagem: personagem,
            obra: obra,
            foto: foto || "",
            status: "aberta",
            dataCriacao: serverTimestamp()
        });

        document.getElementById('nova-vaga-personagem').value = '';
        document.getElementById('nova-vaga-obra').value = '';
        document.getElementById('nova-vaga-foto').value = '';

        alert('✅ Vaga criada com sucesso!');
    } catch (erro) {
        console.error('❌ Erro:', erro);
        alert('❌ Erro ao criar vaga: ' + erro.message);
    }
};

function carregarVagasAbertas() {
    const q = query(collection(db, "vagas"), where("status", "==", "aberta"));
    onSnapshot(q, (snapshot) => {
        vagasAbertas.innerHTML = '';
        if (snapshot.empty) {
            vagasAbertas.innerHTML = '<p style="color: rgba(255,255,255,0.4);">Nenhuma vaga aberta.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const vaga = doc.data();
            vagasAbertas.innerHTML += criarCard(vaga, 'aberta');
        });
    });
}

function carregarVagasFechadas() {
    const q = query(collection(db, "vagas"), where("status", "==", "fechada"));
    onSnapshot(q, (snapshot) => {
        vagasFechadas.innerHTML = '';
        if (snapshot.empty) {
            vagasFechadas.innerHTML = '<p style="color: rgba(255,255,255,0.4);">Nenhuma vaga fechada.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const vaga = doc.data();
            vagasFechadas.innerHTML += criarCard(vaga, 'fechada');
        });
    });
}

function criarCard(vaga, tipo) {
    return `
        <div style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <p style="font-weight: bold; margin: 0;">${vaga.personagem}</p>
            <p style="font-size: 0.9em; color: rgba(255,255,255,0.5); margin: 4px 0 0 0;">${vaga.obra}</p>
            ${tipo === 'fechada' && vaga.ocupadaPor 
                ? `<p style="font-size: 0.85em; color: #888; margin: 4px 0 0 0;">👤 Ocupada por: ${vaga.ocupadaPor}</p>` 
                : ''
            }
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarVagasAbertas();
    carregarVagasFechadas();
});
