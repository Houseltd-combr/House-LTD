console.log('📋 Painel de Solicitações carregado');

import { db } from './firebase.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    addDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elementos da tela
const listaSolicitacoes = document.getElementById('lista-solicitacoes');
const carregando = document.getElementById('carregando');

// Carregar solicitações pendentes em TEMPO REAL
function carregarSolicitacoes() {
    if (!listaSolicitacoes) return;

    carregando.style.display = 'block';
    listaSolicitacoes.innerHTML = '';

    const q = query(
        collection(db, "characterRequests"),
        where("status", "==", "pendente"),
        orderBy("data", "desc")
    );

    // Escutar mudanças em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
        carregando.style.display = 'none';
        listaSolicitacoes.innerHTML = '';

        if (snapshot.empty) {
            listaSolicitacoes.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px;">
                    <p style="color: rgba(255,255,255,0.5); font-size: 1em;">
                        📭 Nenhuma solicitação pendente.
                    </p>
                </div>
            `;
            return;
        }

        snapshot.forEach((doc) => {
            const dados = doc.data();
            const id = doc.id;
            criarCardSolicitacao(id, dados);
        });
    }, (erro) => {
        console.error('❌ Erro ao carregar:', erro);
        carregando.style.display = 'none';
        listaSolicitacoes.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <p style="color: #ff4444;">❌ Erro ao carregar: ${erro.message}</p>
                <p style="color: rgba(255,255,255,0.5); font-size: 0.8em; margin-top: 10px;">
                    Verifique as regras do Firestore
                </p>
            </div>
        `;
    });
}

// Criar o card de cada solicitação
function criarCardSolicitacao(id, dados) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
            ${dados.foto ? `<img src="${dados.foto}" alt="${dados.personagem}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">` : ''}
            <div style="flex: 1; min-width: 200px;">
                <h3 style="color: #00a8ff; margin-bottom: 8px;">${dados.personagem || 'Sem nome'}</h3>
                <p style="color: rgba(255,255,255,0.7); font-size: 0.9em; margin-bottom: 4px;">
                    <strong>Obra:</strong> ${dados.obra || 'Não informada'}
                </p>
                <p style="color: rgba(255,255,255,0.7); font-size: 0.9em; margin-bottom: 4px;">
                    <strong>Membro:</strong> ${dados.nome || 'Anônimo'}
                </p>
                <p style="color: rgba(255,255,255,0.5); font-size: 0.85em;">
                    <strong>Telefone:</strong> ****${dados.telefone || '____'}
                </p>
                ${dados.mensagem ? `<p style="color: rgba(255,255,255,0.5); font-size: 0.85em; margin-top: 8px; font-style: italic;">"${dados.mensagem}"</p>` : ''}
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="aprovarSolicitacao('${id}')" style="background: #00cc66; border: none;">✅ APROVAR</button>
            <button class="btn" onclick="recusarSolicitacao('${id}')" style="border-color: #ff4444; color: #ff4444;">❌ RECUSAR</button>
        </div>
    `;
    listaSolicitacoes.appendChild(card);
}

// Aprovar solicitação
window.aprovarSolicitacao = async function(id) {
    if (!confirm('✅ Tem certeza que deseja APROVAR esta solicitação?')) return;

    try {
        const solicitacaoRef = doc(db, "characterRequests", id);
        const solicitacaoSnap = await getDoc(solicitacaoRef);
        
        if (!solicitacaoSnap.exists()) {
            alert('❌ Solicitação não encontrada!');
            return;
        }

        const dados = solicitacaoSnap.data();

        // 1. Atualizar status da solicitação
        await updateDoc(solicitacaoRef, {
            status: "aprovado",
            dataAprovacao: serverTimestamp()
        });

        // 2. Adicionar aos personagens ocupados
        await addDoc(collection(db, "occupiedCharacters"), {
            personagem: dados.personagem,
            obra: dados.obra,
            membro: dados.nome,
            telefone: dados.telefone,
            foto: dados.foto,
            status: "ocupado",
            dataEntrada: serverTimestamp()
        });

        alert('✅ Solicitação APROVADA! Personagem agora está ocupado.');
    } catch (erro) {
        console.error('❌ Erro ao aprovar:', erro);
        alert('❌ Erro: ' + erro.message);
    }
};

// Recusar solicitação
window.recusarSolicitacao = async function(id) {
    if (!confirm('❌ Tem certeza que deseja RECUSAR esta solicitação?')) return;

    try {
        const solicitacaoRef = doc(db, "characterRequests", id);
        await updateDoc(solicitacaoRef, {
            status: "recusado",
            dataRecusa: serverTimestamp()
        });
        alert('❌ Solicitação RECUSADA.');
    } catch (erro) {
        console.error('❌ Erro ao recusar:', erro);
        alert('❌ Erro: ' + erro.message);
    }
};

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', carregarSolicitacoes);
