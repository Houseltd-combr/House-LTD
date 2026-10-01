console.log('👤 Sistema de Membros carregado');

import { db } from './firebase.js';
import { 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const resultadoDiv = document.getElementById('resultado-busca');
const mensagemDiv = document.getElementById('mensagem');

window.buscarMembro = async function() {
    const telefoneBusca = document.getElementById('busca-telefone').value.trim();
    
    if (telefoneBusca.length !== 4) {
        alert('❌ Digite os 4 dígitos completos!');
        return;
    }

    resultadoDiv.style.display = 'none';
    mensagemDiv.style.display = 'block';
    mensagemDiv.innerHTML = '<p>🔄 Buscando membro...</p>';

    try {
        const q = query(
            collection(db, "occupiedCharacters"),
            where("telefone", "==", telefoneBusca)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            mensagemDiv.innerHTML = `
                <p style="color: #ff6666;">❌ Nenhum membro encontrado com esses dígitos.</p>
                <p style="font-size: 0.9em; margin-top: 10px;">Verifique se os 4 dígitos estão corretos.</p>
            `;
            return;
        }

        const personagens = [];
        let nomeMembro = '';

        snapshot.forEach((doc) => {
            const dados = doc.data();
            personagens.push({
                id: doc.id,
                personagem: dados.personagem,
                obra: dados.obra,
                foto: dados.foto
            });
            if (!nomeMembro && dados.membro) nomeMembro = dados.membro;
        });

        mensagemDiv.style.display = 'none';
        resultadoDiv.style.display = 'block';
        mostrarPerfil(nomeMembro, telefoneBusca, personagens);

    } catch (erro) {
        console.error('❌ Erro na busca:', erro);
        mensagemDiv.innerHTML = `<p style="color: #ff6666;">❌ Erro: ${erro.message}</p>`;
    }
};

function mostrarPerfil(nome, telefone, personagens) {
    const p1 = personagens[0] || null;
    const p2 = personagens[1] || null;

    resultadoDiv.innerHTML = `
        <div class="card" style="border: 2px solid #00a8ff; background: linear-gradient(135deg, rgba(0,168,255,0.08), rgba(0,0,0,0.8));">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h2 style="color: #00a8ff; font-size: 1.8em; margin-bottom: 5px;">${nome || 'Membro'}</h2>
                <p style="color: rgba(255,255,255,0.5); font-size: 0.9em;">****${telefone}</p>
                <span style="display: inline-block; background: #00cc66; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; margin-top: 8px;">
                    ✅ Ativo
                </span>
            </div>

            <h3 style="color: #fff; margin-bottom: 20px; text-align: center;">🎭 PERSONAGENS (${personagens.length}/2)</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(0,168,255,0.3); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: #00a8ff; margin-bottom: 15px;">PERSONAGEM 1</h4>
                    ${p1 && p1.foto 
                        ? `<img src="${p1.foto}" alt="${p1.personagem}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; border: 2px solid #00a8ff;">`
                        : `<div style="width: 120px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 8px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3);">Sem foto</div>`
                    }
                    <p style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${p1 ? p1.personagem : '—'}</p>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.9em;">${p1 ? p1.obra : '—'}</p>
                </div>

                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: rgba(255,255,255,0.5); margin-bottom: 15px;">PERSONAGEM 2</h4>
                    ${p2 && p2.foto 
                        ? `<img src="${p2.foto}" alt="${p2.personagem}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; border: 2px solid #888;">`
                        : `<div style="width: 120px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 8px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3);">Vazio</div>`
                    }
                    <p style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px; color: ${p2 ? '#fff' : '#666'};">${p2 ? p2.personagem : '—'}</p>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.9em;">${p2 ? p2.obra : '—'}</p>
                </div>
            </div>
        </div>
    `;
}
