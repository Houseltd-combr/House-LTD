/* =========================================================
   HOUSE LTD — APP.JS
   Sistema principal da House LTD

   Firebase:
   Projeto: house-ltd

   Cloudinary:
   Cloud: gsqmelxb
   Preset: House LTD
========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCRUNymKVh-UxKxSvNEUZkAjmRi_4_AQU",
  authDomain: "house-ltd.firebaseapp.com",
  projectId: "house-ltd",
  storageBucket: "house-ltd.firebasestorage.app",
  messagingSenderId: "821811124213",
  appId: "1:821811124213:web:c8dd2b2f1e1a41bcd632bc",
  measurementId: "G-P28WHBV9VB"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();


/* =========================================================
   CLOUDINARY
========================================================= */

const CLOUDINARY_CLOUD_NAME = "gsqmelxb";
const CLOUDINARY_UPLOAD_PRESET = "House LTD";

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/* =========================================================
   ESTADO GLOBAL
========================================================= */

let currentAdmin = null;
let currentAdminUser = null;

let vacanciesCache = [];
let requestsCache = [];
let membersCache = [];
let adminsCache = [];

let currentEditingVacancy = null;


/* =========================================================
   CONFIGURAÇÃO DOS ADMINISTRADORES

   NÃO colocar códigos aqui.

   O código digitado pelo administrador é usado
   para autenticar no Firebase Authentication.

   Depois disso, o documento adminProfiles/{uid}
   identifica:
   - nome
   - cargo
   - status
   - foto
   - capa
========================================================= */


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}


function showElement(element) {
  if (element) {
    element.style.display = "";
  }
}


function hideElement(element) {
  if (element) {
    element.style.display = "none";
  }
}


function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = value ?? "";
  }
}


function showMessage(message, type = "info") {

  let box = $("ltdMessage");

  if (!box) {

    box = document.createElement("div");

    box.id = "ltdMessage";

    box.style.position = "fixed";
    box.style.bottom = "20px";
    box.style.left = "50%";
    box.style.transform = "translateX(-50%)";
    box.style.zIndex = "99999";
    box.style.padding = "12px 18px";
    box.style.borderRadius = "12px";
    box.style.maxWidth = "90%";
    box.style.fontWeight = "600";

    document.body.appendChild(box);
  }

  box.textContent = message;
  box.dataset.type = type;

  clearTimeout(window.ltdMessageTimer);

  window.ltdMessageTimer = setTimeout(() => {
    box.remove();
  }, 3500);
}


/* =========================================================
   LOADING
========================================================= */

function showLoading(text = "Carregando...") {

  let loading = $("ltdLoading");

  if (!loading) {

    loading = document.createElement("div");

    loading.id = "ltdLoading";

    loading.innerHTML = `
      <div class="ltd-loading-content">
        <div class="ltd-spinner"></div>
        <p id="ltdLoadingText"></p>
      </div>
    `;

    loading.style.position = "fixed";
    loading.style.inset = "0";
    loading.style.zIndex = "99998";
    loading.style.display = "flex";
    loading.style.alignItems = "center";
    loading.style.justifyContent = "center";

    document.body.appendChild(loading);
  }

  const textElement = $("ltdLoadingText");

  if (textElement) {
    textElement.textContent = text;
  }

  loading.style.display = "flex";
}


function hideLoading() {

  const loading = $("ltdLoading");

  if (loading) {
    loading.style.display = "none";
  }
}


/* =========================================================
   CLOUDINARY — UPLOAD
========================================================= */

async function uploadToCloudinary(file) {

  if (!file) {
    throw new Error("Nenhuma imagem selecionada.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("A imagem deve ter no máximo 10 MB.");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    CLOUDINARY_UPLOAD_URL,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao enviar a imagem.");
  }

  const result = await response.json();

  if (!result.secure_url) {
    throw new Error("O Cloudinary não retornou a imagem.");
  }

  return result.secure_url;
}


/* =========================================================
   LOGIN ADMINISTRATIVO
========================================================= */

async function loginAdmin(code) {

  code = String(code || "").trim();

  if (!code) {
    throw new Error("Digite o código de administração.");
  }

  /*
   * O código funciona como senha da conta do Firebase Auth.
   *
   * Não colocamos os códigos dos administradores
   * no JavaScript público.
   */

  const email =
    `${code.toLowerCase()}@admin.houseltd.local`;

  const credential =
    await auth.signInWithEmailAndPassword(
      email,
      code
    );

  return credential.user;
}


/* =========================================================
   VERIFICAÇÃO DO ADMIN
========================================================= */

async function loadCurrentAdmin(user) {

  if (!user) {
    currentAdmin = null;
    currentAdminUser = null;
    return null;
  }

  currentAdminUser = user;

  const possibleCollections = [
    "adminProfiles",
    "admins"
  ];

  let adminData = null;
  let adminId = null;

  /*
   * Primeiro tenta adminProfiles.
   */

  for (const collectionName of possibleCollections) {

    const doc =
      await db
        .collection(collectionName)
        .doc(user.uid)
        .get();

    if (doc.exists) {

      adminData = doc.data();
      adminId = doc.id;

      break;
    }
  }

  if (!adminData) {

    await auth.signOut();

    throw new Error(
      "Esta conta não está cadastrada como administrador."
    );
  }

  if (
    adminData.status === false ||
    adminData.active === false
  ) {

    await auth.signOut();

    throw new Error(
      "Este administrador está desativado."
    );
  }

  currentAdmin = {
    id: adminId,
    uid: user.uid,
    name:
      adminData.name ||
      adminData.nome ||
      "Administrador",

    role:
      adminData.role ||
      adminData.cargo ||
      "ADM",

    photo:
      adminData.photo ||
      adminData.profilePhoto ||
      "",

    cover:
      adminData.cover ||
      adminData.coverPhoto ||
      "",

    ...adminData
  };

  return currentAdmin;
}


/* =========================================================
   AUTH STATE
========================================================= */

auth.onAuthStateChanged(async (user) => {

  try {

    if (!user) {

      currentAdmin = null;
      currentAdminUser = null;

      showAdminLogin();

      return;
    }

    showLoading("Verificando acesso...");

    await loadCurrentAdmin(user);

    showAdminPanel();

    await registerAdminOnline();
    await registerAccessLog("login");

    await loadDashboard();

  } catch (error) {

    console.error(error);

    await auth.signOut();

    showAdminLogin();

    showLoginError(
      error.message ||
      "Não foi possível entrar."
    );

  } finally {

    hideLoading();
  }
});


/* =========================================================
   MOSTRAR LOGIN
========================================================= */

function showAdminLogin() {

  const login = $("adminLogin");
  const panel = $("adminPanel");

  if (login) {
    login.style.display = "flex";
  }

  if (panel) {
    panel.style.display = "none";
  }
}


/* =========================================================
   MOSTRAR PAINEL
========================================================= */

function showAdminPanel() {

  const login = $("adminLogin");
  const panel = $("adminPanel");

  if (login) {
    login.style.display = "none";
  }

  if (panel) {
    panel.style.display = "block";
  }

  if (currentAdmin) {

    setText(
      "adminName",
      currentAdmin.name
    );

    setText(
      "welcomeName",
      currentAdmin.name
    );

    setText(
      "adminRole",
      currentAdmin.role
    );
  }
}


/* =========================================================
   ERRO LOGIN
========================================================= */

function showLoginError(message) {

  const error = $("loginError");

  if (error) {
    error.textContent = message;
  }
}


/* =========================================================
   FORM LOGIN
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const loginForm = $("loginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const input = $("adminCode");

        const code =
          input ? input.value.trim() : "";

        try {

          showLoading("Entrando...");

          await loginAdmin(code);

        } catch (error) {

          console.error(error);

          showLoginError(
            "Código inválido ou acesso não autorizado."
          );

        } finally {

          hideLoading();
        }
      }
    );
  }


  const logoutButton = $("logoutButton");

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logoutAdmin
    );
  }


  setupNavigation();

  setupPublicForms();

});


/* =========================================================
   LOGOUT
========================================================= */

async function logoutAdmin() {

  try {

    if (currentAdmin) {

      await db
        .collection("adminsOnline")
        .doc(currentAdmin.uid)
        .delete()
        .catch(() => {});

      await registerAccessLog("logout");
    }

  } catch (error) {

    console.error(error);

  } finally {

    await auth.signOut();

    currentAdmin = null;
    currentAdminUser = null;

    showAdminLogin();
  }
}


/* =========================================================
   ADMIN ONLINE
========================================================= */

async function registerAdminOnline() {

  if (!currentAdmin) {
    return;
  }

  await db
    .collection("adminsOnline")
    .doc(currentAdmin.uid)
    .set({
      uid: currentAdmin.uid,
      name: currentAdmin.name,
      role: currentAdmin.role,
      online: true,
      lastSeen: serverTimestamp()
    });
}


/* =========================================================
   ADMIN OFFLINE
========================================================= */

async function setAdminOffline() {

  if (!currentAdmin) {
    return;
  }

  await db
    .collection("adminsOnline")
    .doc(currentAdmin.uid)
    .set({
      uid: currentAdmin.uid,
      name: currentAdmin.name,
      role: currentAdmin.role,
      online: false,
      lastSeen: serverTimestamp()
    });
}


/* =========================================================
   LOGS
========================================================= */

async function registerAccessLog(action, extra = {}) {

  if (!currentAdmin) {
    return;
  }

  try {

    await db
      .collection("accessLogs")
      .add({
        adminId: currentAdmin.uid,
        adminName: currentAdmin.name,
        role: currentAdmin.role,
        action,
        timestamp: serverTimestamp(),
        ...extra
      });

  } catch (error) {

    console.error(
      "Erro ao registrar log:",
      error
    );
  }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

  showLoading("Carregando painel...");

  try {

    await Promise.all([
      loadRequests(),
      loadVacancies(),
      loadMembers(),
      loadAdmins(),
      loadChat(),
      loadLogs()
    ]);

  } catch (error) {

    console.error(error);

    showMessage(
      "Algumas informações não puderam ser carregadas.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   SOLICITAÇÕES
========================================================= */

async function loadRequests() {

  const container =
    $("requestsList");

  if (!container) {
    return;
  }

  container.innerHTML =
    "<p>Carregando solicitações...</p>";

  let snapshot;

  try {

    snapshot =
      await db
        .collection("characterRequests")
        .where("status", "==", "pendente")
        .get();

  } catch (error) {

    /*
     * Compatibilidade com coleção antiga.
     */

    try {

      snapshot =
        await db
          .collection("requests")
          .where("status", "==", "pendente")
          .get();

    } catch (secondError) {

      console.error(secondError);

      container.innerHTML =
        "<p>Não foi possível carregar as solicitações.</p>";

      return;
    }
  }

  requestsCache = [];

  snapshot.forEach(doc => {

    requestsCache.push({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    });

  });

  setText(
    "pendingCount",
    requestsCache.length
  );

  renderRequests();
}


/* =========================================================
   RENDER SOLICITAÇÕES
========================================================= */

function renderRequests() {

  const container =
    $("requestsList");

  if (!container) {
    return;
  }

  if (!requestsCache.length) {

    container.innerHTML =
      "<p>Nenhuma solicitação pendente.</p>";

    return;
  }

  container.innerHTML = "";

  requestsCache.forEach(request => {

    const card =
      document.createElement("div");

    card.className =
      "request-card";

    const photo =
      request.photo ||
      request.image ||
      "";

    card.innerHTML = `

      ${
        photo
          ? `
            <img
              src="${escapeHTML(photo)}"
              class="request-photo"
              alt="Foto do personagem"
            >
          `
          : ""
      }

      <div class="request-info">

        <h3>
          ${escapeHTML(
            request.character ||
            "Personagem não informado"
          )}
        </h3>

        <p>
          <strong>Obra:</strong>
          ${escapeHTML(
            request.work ||
            "Não informado"
          )}
        </p>

        <p>
          <strong>Nome:</strong>
          ${escapeHTML(
            request.name ||
            request.nickname ||
            "Não informado"
          )}
        </p>

        <p>
          <strong>Idade:</strong>
          ${escapeHTML(
            request.age ||
            "Não informado"
          )}
        </p>

        <p>
          <strong>Últimos 4 números:</strong>
          ${escapeHTML(
            request.last4 ||
            request.phoneLast4 ||
            "Não informado"
          )}
        </p>

        <div class="request-actions">

          <button
            type="button"
            onclick="approveRequest('${request.id}')"
          >
            Aceitar
          </button>

          <button
            type="button"
            onclick="rejectRequest('${request.id}')"
          >
            Recusar
          </button>

        </div>

      </div>
    `;

    container.appendChild(card);
  });
}


/* =========================================================
   ACEITAR SOLICITAÇÃO
========================================================= */

async function approveRequest(id) {

  if (!currentAdmin) {
    return;
  }

  const request =
    requestsCache.find(
      item => item.id === id
    );

  if (!request) {
    showMessage(
      "Solicitação não encontrada.",
      "error"
    );

    return;
  }

  try {

    showLoading("Aprovando solicitação...");

    /*
     * Procurar a vaga correspondente.
     */

    const vacancy =
      await findVacancy(
        request.character,
        request.work
      );

    if (
      vacancy &&
      vacancy.status === "fechada"
    ) {

      throw new Error(
        "Esse personagem já está ocupado."
      );
    }


    const batch =
      db.batch();


    /* Atualizar solicitação */

    batch.update(
      request.ref,
      {
        status: "aprovado",

        approvedAt:
          serverTimestamp(),

        approvedBy:
          currentAdmin.name
      }
    );


    /* Criar membro */

    const memberRef =
      db.collection("members").doc();

    batch.set(
      memberRef,
      {
        name:
          request.name ||
          request.nickname ||
          "",

        nickname:
          request.nickname ||
          request.name ||
          "",

        age:
          request.age ||
          null,

        character:
          request.character ||
          "",

        work:
          request.work ||
          "",

        photo:
          request.photo ||
          "",

        joinedAt:
          serverTimestamp(),

        approvedBy:
          currentAdmin.name,

        status:
          "ativo"
      }
    );


    /*
     * Dados privados ficam separados.
     */

    const privateRef =
      db.collection("memberPrivate").doc(
        memberRef.id
      );

    batch.set(
      privateRef,
      {
        memberId:
          memberRef.id,

        last4:
          request.last4 ||
          request.phoneLast4 ||
          "",

        age:
          request.age ||
          null,

        sourceRequest:
          request.id,

        createdAt:
          serverTimestamp()
      }
    );


    /*
     * Fechar a vaga correspondente.
     */

    if (vacancy) {

      batch.update(
        vacancy.ref,
        {
          status: "fechada",

          occupiedBy:
            memberRef.id,

          occupiedCharacter:
            request.character,

          occupiedWork:
            request.work,

          occupiedPhoto:
            request.photo || "",

          closedAt:
            serverTimestamp()
        }
      );

    } else {

      /*
       * Se a vaga ainda não existir,
       * cria o registro para manter o controle.
       */

      const newVacancy =
        db.collection("vagas").doc();

      batch.set(
        newVacancy,
        {
          character:
            request.character,

          work:
            request.work,

          photo:
            request.photo || "",

          status:
            "fechada",

          occupiedBy:
            memberRef.id,

          createdAt:
            serverTimestamp(),

          closedAt:
            serverTimestamp()
        }
      );
    }


    /*
     * Compatibilidade com occupiedCharacters.
     */

    const occupiedRef =
      db.collection("occupiedCharacters").doc();

    batch.set(
      occupiedRef,
      {
        character:
          request.character,

        work:
          request.work,

        memberId:
          memberRef.id,

        photo:
          request.photo || "",

        status:
          "ocupado",

        createdAt:
          serverTimestamp()
      }
    );


    await batch.commit();


    await registerAccessLog(
      "approve_request",
      {
        requestId: request.id,
        character: request.character,
        work: request.work
      }
    );


    showMessage(
      "Solicitação aprovada com sucesso!",
      "success"
    );


    await loadDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Erro ao aprovar solicitação.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   RECUSAR SOLICITAÇÃO
========================================================= */

async function rejectRequest(id) {

  if (!currentAdmin) {
    return;
  }

  const request =
    requestsCache.find(
      item => item.id === id
    );

  if (!request) {
    return;
  }

  const confirmed =
    confirm(
      "Deseja realmente recusar esta solicitação?"
    );

  if (!confirmed) {
    return;
  }

  try {

    showLoading("Recusando...");

    await request.ref.update({

      status:
        "recusado",

      rejectedAt:
        serverTimestamp(),

      rejectedBy:
        currentAdmin.name

    });


    await registerAccessLog(
      "reject_request",
      {
        requestId:
          request.id,

        character:
          request.character,

        work:
          request.work
      }
    );


    showMessage(
      "Solicitação recusada.",
      "success"
    );


    await loadRequests();

  } catch (error) {

    console.error(error);

    showMessage(
      "Não foi possível recusar.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   VAGAS
========================================================= */

async function loadVacancies() {

  const container =
    $("vacanciesList");

  if (!container) {
    return;
  }

  container.innerHTML =
    "<p>Carregando vagas...</p>";

  let snapshot;

  try {

    snapshot =
      await db
        .collection("vagas")
        .get();

  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Não foi possível carregar as vagas.</p>";

    return;
  }


  vacanciesCache = [];

  snapshot.forEach(doc => {

    vacanciesCache.push({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    });

  });


  renderVacancies();

}


/* =========================================================
   RENDER VAGAS
========================================================= */

function renderVacancies() {

  const container =
    $("vacanciesList");

  if (!container) {
    return;
  }

  if (!vacanciesCache.length) {

    container.innerHTML =
      "<p>Nenhuma vaga cadastrada.</p>";

    setText(
      "openVacanciesCount",
      0
    );

    setText(
      "closedVacanciesCount",
      0
    );

    return;
  }


  const open =
    vacanciesCache.filter(
      vacancy =>
        vacancy.status === "aberta" ||
        vacancy.status === "open"
    );

  const closed =
    vacanciesCache.filter(
      vacancy =>
        vacancy.status === "fechada" ||
        vacancy.status === "closed" ||
        vacancy.status === "ocupada"
    );


  setText(
    "openVacanciesCount",
    open.length
  );

  setText(
    "closedVacanciesCount",
    closed.length
  );


  container.innerHTML = "";


  vacanciesCache.forEach(vacancy => {

    const isOpen =
      vacancy.status === "aberta" ||
      vacancy.status === "open";


    const card =
      document.createElement("div");

    card.className =
      "vacancy-card";


    card.innerHTML = `

      ${
        vacancy.photo
          ? `
            <img
              src="${escapeHTML(vacancy.photo)}"
              alt="${escapeHTML(vacancy.character)}"
              class="vacancy-photo"
            >
          `
          : ""
      }

      <div class="vacancy-info">

        <h3>
          ${escapeHTML(
            vacancy.character ||
            "Personagem"
          )}
        </h3>

        <p>
          <strong>Obra:</strong>
          ${escapeHTML(
            vacancy.work ||
            "Não informado"
          )}
        </p>

        <p>
          <strong>Status:</strong>
          ${
            isOpen
              ? "Vaga aberta"
              : "Vaga fechada"
          }
        </p>


        <div class="vacancy-actions">

          <button
            type="button"
            onclick="toggleVacancy('${vacancy.id}')"
          >
            ${
              isOpen
                ? "Fechar vaga"
                : "Abrir vaga"
            }
          </button>


          <button
            type="button"
            onclick="editVacancy('${vacancy.id}')"
          >
            Editar
          </button>


          <button
            type="button"
            onclick="deleteVacancy('${vacancy.id}')"
          >
            Excluir
          </button>

        </div>

      </div>
    `;


    container.appendChild(card);

  });
}


/* =========================================================
   PROCURAR VAGA
========================================================= */

async function findVacancy(
  character,
  work
) {

  const normalizedCharacter =
    normalizeText(character);

  const normalizedWork =
    normalizeText(work);


  /*
   * Procurar no cache primeiro.
   */

  let found =
    vacanciesCache.find(
      vacancy =>
        normalizeText(vacancy.character) ===
          normalizedCharacter &&

        normalizeText(vacancy.work) ===
          normalizedWork
    );


  if (found) {
    return found;
  }


  /*
   * Procurar diretamente no Firebase.
   */

  const snapshot =
    await db
      .collection("vagas")
      .get();


  for (const doc of snapshot.docs) {

    const data = doc.data();

    if (
      normalizeText(data.character) ===
        normalizedCharacter &&

      normalizeText(data.work) ===
        normalizedWork
    ) {

      return {
        id: doc.id,
        ref: doc.ref,
        ...data
      };
    }
  }


  return null;
}


/* =========================================================
   ABRIR / FECHAR VAGA
========================================================= */

async function toggleVacancy(id) {

  if (!currentAdmin) {
    return;
  }

  const vacancy =
    vacanciesCache.find(
      item => item.id === id
    );

  if (!vacancy) {
    return;
  }


  const isOpen =
    vacancy.status === "aberta" ||
    vacancy.status === "open";


  const newStatus =
    isOpen
      ? "fechada"
      : "aberta";


  try {

    showLoading(
      isOpen
        ? "Fechando vaga..."
        : "Abrindo vaga..."
    );


    await vacancy.ref.update({

      status:
        newStatus,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        currentAdmin.name,

      ...(newStatus === "aberta"
        ? {
            occupiedBy:
              firebase.firestore.FieldValue.delete(),

            occupiedCharacter:
              firebase.firestore.FieldValue.delete(),

            occupiedWork:
              firebase.firestore.FieldValue.delete(),

            closedAt:
              firebase.firestore.FieldValue.delete()
          }
        : {
            closedAt:
              serverTimestamp()
          })
    });


    await registerAccessLog(
      isOpen
        ? "close_vacancy"
        : "open_vacancy",
      {
        vacancyId:
          vacancy.id,

        character:
          vacancy.character,

        work:
          vacancy.work
      }
    );


    await loadVacancies();


    showMessage(
      isOpen
        ? "Vaga fechada."
        : "Vaga aberta.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "Não foi possível alterar a vaga.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   EDITAR VAGA
========================================================= */

function editVacancy(id) {

  const vacancy =
    vacanciesCache.find(
      item => item.id === id
    );

  if (!vacancy) {
    return;
  }

  currentEditingVacancy = vacancy;


  /*
   * Se existir um modal criado no HTML,
   * preencher os campos.
   */

  const characterInput =
    $("editCharacter");

  const workInput =
    $("editWork");

  const photoInput =
    $("editPhoto");


  if (characterInput) {
    characterInput.value =
      vacancy.character || "";
  }

  if (workInput) {
    workInput.value =
      vacancy.work || "";
  }

  if (photoInput) {
    photoInput.value =
      vacancy.photo || "";
  }


  const modal =
    $("editVacancyModal");

  if (modal) {

    modal.style.display =
      "flex";

    return;
  }


  /*
   * Fallback caso o modal ainda não exista.
   */

  const character =
    prompt(
      "Nome do personagem:",
      vacancy.character || ""
    );

  if (character === null) {
    return;
  }


  const work =
    prompt(
      "Nome da obra:",
      vacancy.work || ""
    );

  if (work === null) {
    return;
  }


  updateVacancy(
    vacancy.id,
    {
      character,
      work
    }
  );
}


/* =========================================================
   SALVAR EDIÇÃO DA VAGA
========================================================= */

async function saveEditedVacancy() {

  if (!currentEditingVacancy) {
    return;
  }


  const character =
    $("editCharacter")?.value.trim();


  const work =
    $("editWork")?.value.trim();


  const photo =
    $("editPhoto")?.value.trim();


  await updateVacancy(
    currentEditingVacancy.id,
    {
      character,
      work,
      photo:
        photo ||
        currentEditingVacancy.photo ||
        ""
    }
  );


  closeEditVacancyModal();
}


/* =========================================================
   ATUALIZAR VAGA
========================================================= */

async function updateVacancy(
  id,
  data
) {

  if (!currentAdmin) {
    return;
  }


  if (!data.character) {

    showMessage(
      "Digite o nome do personagem.",
      "error"
    );

    return;
  }


  if (!data.work) {

    showMessage(
      "Digite o nome da obra.",
      "error"
    );

    return;
  }


  try {

    showLoading("Salvando vaga...");


    const vacancy =
      vacanciesCache.find(
        item => item.id === id
      );


    if (!vacancy) {
      throw new Error(
        "Vaga não encontrada."
      );
    }


    await vacancy.ref.update({

      character:
        data.character,

      work:
        data.work,

      photo:
        data.photo || "",

      updatedAt:
        serverTimestamp(),

      updatedBy:
        currentAdmin.name

    });


    await registerAccessLog(
      "edit_vacancy",
      {
        vacancyId:
          id,

        character:
          data.character,

        work:
          data.work
      }
    );


    await loadVacancies();


    showMessage(
      "Vaga atualizada!",
      "success"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "Não foi possível editar a vaga.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   FECHAR MODAL
========================================================= */

function closeEditVacancyModal() {

  const modal =
    $("editVacancyModal");

  if (modal) {
    modal.style.display = "none";
  }

  currentEditingVacancy = null;
}


/* =========================================================
   EXCLUIR VAGA
========================================================= */

async function deleteVacancy(id) {

  if (!currentAdmin) {
    return;
  }


  const vacancy =
    vacanciesCache.find(
      item => item.id === id
    );


  if (!vacancy) {
    return;
  }


  const confirmed =
    confirm(
      `Excluir a vaga de "${vacancy.character}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    showLoading("Excluindo vaga...");


    await vacancy.ref.delete();


    await registerAccessLog(
      "delete_vacancy",
      {
        vacancyId:
          id,

        character:
          vacancy.character,

        work:
          vacancy.work
      }
    );


    await loadVacancies();


    showMessage(
      "Vaga excluída.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "Não foi possível excluir a vaga.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   CRIAR NOVA VAGA
========================================================= */

async function createVacancy(data) {

  if (!currentAdmin) {
    return;
  }


  if (!data.character || !data.work) {

    showMessage(
      "Personagem e obra são obrigatórios.",
      "error"
    );

    return;
  }


  try {

    showLoading("Criando vaga...");


    const existing =
      await findVacancy(
        data.character,
        data.work
      );


    if (existing) {

      throw new Error(
        "Essa vaga já existe."
      );
    }


    const ref =
      db.collection("vagas").doc();


    await ref.set({

      character:
        data.character,

      work:
        data.work,

      photo:
        data.photo || "",

      status:
        data.status ||
        "aberta",

      createdAt:
        serverTimestamp(),

      createdBy:
        currentAdmin.name

    });


    await registerAccessLog(
      "create_vacancy",
      {
        vacancyId:
          ref.id,

        character:
          data.character,

        work:
          data.work
      }
    );


    await loadVacancies();


    showMessage(
      "Vaga criada!",
      "success"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Erro ao criar vaga.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   MEMBROS
========================================================= */

async function loadMembers() {

  const container =
    $("membersList");

  if (!container) {
    return;
  }


  container.innerHTML =
    "<p>Carregando membros...</p>";


  try {

    const snapshot =
      await db
        .collection("members")
        .get();


    membersCache = [];


    snapshot.forEach(doc => {

      membersCache.push({
        id: doc.id,
        ref: doc.ref,
        ...doc.data()
      });

    });


    setText(
      "membersCount",
      membersCache.length
    );


    renderMembers();

  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Não foi possível carregar os membros.</p>";
  }
}


/* =========================================================
   RENDER MEMBROS
========================================================= */

function renderMembers() {

  const container =
    $("membersList");

  if (!container) {
    return;
  }


  if (!membersCache.length) {

    container.innerHTML =
      "<p>Nenhum membro cadastrado.</p>";

    return;
  }


  container.innerHTML = "";


  membersCache.forEach(member => {

    const card =
      document.createElement("div");

    card.className =
      "member-card";


    card.innerHTML = `

      ${
        member.photo
          ? `
            <img
              src="${escapeHTML(member.photo)}"
              alt=""
            >
          `
          : ""
      }

      <div>

        <h3>
          ${escapeHTML(
            member.name ||
            member.nickname ||
            "Membro"
          )}
        </h3>

        <p>
          <strong>Personagem:</strong>
          ${escapeHTML(
            member.character ||
            "Não informado"
          )}
        </p>

        <p>
          <strong>Obra:</strong>
          ${escapeHTML(
            member.work ||
            "Não informado"
          )}
        </p>

      </div>

    `;


    container.appendChild(card);

  });
}


/* =========================================================
   ADMINISTRADORES
========================================================= */

async function loadAdmins() {

  const container =
    $("adminsList");

  if (!container) {
    return;
  }


  container.innerHTML =
    "<p>Carregando administradores...</p>";


  try {

    const snapshot =
      await db
        .collection("adminProfiles")
        .get();


    adminsCache = [];


    snapshot.forEach(doc => {

      adminsCache.push({
        id: doc.id,
        ...doc.data()
      });

    });


    renderAdmins();

  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Não foi possível carregar os administradores.</p>";
  }
}


/* =========================================================
   RENDER ADMS
========================================================= */

function renderAdmins() {

  const container =
    $("adminsList");

  if (!container) {
    return;
  }


  if (!adminsCache.length) {

    container.innerHTML =
      "<p>Nenhum administrador cadastrado.</p>";

    return;
  }


  container.innerHTML = "";


  adminsCache.forEach(admin => {

    const card =
      document.createElement("div");

    card.className =
      "admin-card";


    card.innerHTML = `

      ${
        admin.cover
          ? `
            <img
              class="admin-cover"
              src="${escapeHTML(admin.cover)}"
              alt=""
            >
          `
          : ""
      }


      <div class="admin-card-body">

        ${
          admin.photo
            ? `
              <img
                class="admin-photo"
                src="${escapeHTML(admin.photo)}"
                alt="${escapeHTML(admin.name)}"
              >
            `
            : ""
        }


        <h3>
          ${escapeHTML(
            admin.name ||
            "Administrador"
          )}
        </h3>


        <p>
          ${escapeHTML(
            admin.role ||
            "ADM"
          )}
        </p>


        <span class="admin-status">

          ${
            admin.status === false
              ? "Desativado"
              : "Ativo"
          }

        </span>

      </div>
    `;


    container.appendChild(card);

  });
}


/* =========================================================
   CHAT DA ADMINISTRAÇÃO
========================================================= */

async function loadChat() {

  const container =
    $("adminChatMessages");

  if (!container) {
    return;
  }


  try {

    const snapshot =
      await db
        .collection("adminChat")
        .orderBy(
          "timestamp",
          "asc"
        )
        .limit(100)
        .get();


    container.innerHTML = "";


    snapshot.forEach(doc => {

      const data =
        doc.data();


      const message =
        document.createElement("div");


      message.className =
        "admin-chat-message";


      message.innerHTML = `

        <strong>
          ${escapeHTML(
            data.adminName ||
            "ADM"
          )}
        </strong>

        <small>
          ${escapeHTML(
            data.role ||
            ""
          )}
        </small>

        <p>
          ${escapeHTML(
            data.message ||
            ""
          )}
        </p>

      `;


      container.appendChild(message);

    });


    container.scrollTop =
      container.scrollHeight;


  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Não foi possível carregar o chat.</p>";
  }
}


/* =========================================================
   ENVIAR CHAT
========================================================= */

async function sendAdminChatMessage(message) {

  if (!currentAdmin) {
    return;
  }


  message =
    String(message || "").trim();


  if (!message) {
    return;
  }


  await db
    .collection("adminChat")
    .add({

      adminId:
        currentAdmin.uid,

      adminName:
        currentAdmin.name,

      role:
        currentAdmin.role,

      message,

      timestamp:
        serverTimestamp()

    });


  await registerAccessLog(
    "send_admin_message"
  );


  await loadChat();
}


/* =========================================================
   FORM DO CHAT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const chatForm =
    $("chatForm");


  if (!chatForm) {
    return;
  }


  chatForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const input =
        $("chatMessage");


      if (!input) {
        return;
      }


      const message =
        input.value.trim();


      if (!message) {
        return;
      }


      try {

        await sendAdminChatMessage(
          message
        );


        input.value = "";


      } catch (error) {

        console.error(error);

        showMessage(
          "Não foi possível enviar a mensagem.",
          "error"
        );
      }

    }
  );

});


/* =========================================================
   LOGS — CARREGAR
========================================================= */

async function loadLogs() {

  const container =
    $("logsList");

  if (!container) {
    return;
  }


  try {

    const snapshot =
      await db
        .collection("accessLogs")
        .orderBy(
          "timestamp",
          "desc"
        )
        .limit(100)
        .get();


    container.innerHTML = "";


    snapshot.forEach(doc => {

      const data =
        doc.data();


      const item =
        document.createElement("div");


      item.className =
        "log-item";


      item.innerHTML = `

        <strong>
          ${escapeHTML(
            data.adminName ||
            "ADM"
          )}
        </strong>

        <span>
          ${escapeHTML(
            data.action ||
            "ação"
          )}
        </span>

      `;


      container.appendChild(item);

    });


  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Não foi possível carregar os logs.</p>";
  }
}


/* =========================================================
   NAVEGAÇÃO DO PAINEL
========================================================= */

function setupNavigation() {

  const buttons =
    document.querySelectorAll(
      "[data-section]"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const section =
          button.dataset.section;


        document
          .querySelectorAll(
            ".admin-section"
          )
          .forEach(element => {

            element.style.display =
              "none";

          });


        const target =
          $(`${section}Section`);


        if (target) {

          target.style.display =
            "block";

        }

      }
    );

  });
}


/* =========================================================
   FICHA DE RECEPÇÃO
========================================================= */

function setupPublicForms() {

  const form =
    $("receptionForm");


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    handleReceptionSubmit
  );
}


/* =========================================================
   ENVIAR FICHA
========================================================= */

async function handleReceptionSubmit(event) {

  event.preventDefault();


  const form =
    event.currentTarget;


  try {

    showLoading(
      "Enviando sua ficha..."
    );


    const name =
      form.querySelector(
        '[name="name"]'
      )?.value.trim() || "";


    const nickname =
      form.querySelector(
        '[name="nickname"]'
      )?.value.trim() || "";


    const age =
      form.querySelector(
        '[name="age"]'
      )?.value.trim() || "";


    const last4 =
      form.querySelector(
        '[name="last4"]'
      )?.value.trim() || "";


    const character =
      form.querySelector(
        '[name="character"]'
      )?.value.trim() || "";


    const work =
      form.querySelector(
        '[name="work"]'
      )?.value.trim() || "";


    const photoInput =
      form.querySelector(
        '[name="photo"]'
      );


    if (!age) {
      throw new Error(
        "A idade é obrigatória."
      );
    }


    if (!last4) {
      throw new Error(
        "Os últimos 4 números são obrigatórios."
      );
    }


    if (!character) {
      throw new Error(
        "Digite o personagem."
      );
    }


    if (!work) {
      throw new Error(
        "Digite a obra."
      );
    }


    if (
      !photoInput ||
      !photoInput.files ||
      !photoInput.files[0]
    ) {

      throw new Error(
        "A foto do personagem é obrigatória."
      );
    }


    /*
     * Verificar se personagem já está ocupado.
     */

    const vacancy =
      await findVacancy(
        character,
        work
      );


    if (
      vacancy &&
      (
        vacancy.status === "fechada" ||
        vacancy.status === "ocupada"
      )
    ) {

      throw new Error(
        "Esse personagem já está ocupado."
      );
    }


    /*
     * Upload Cloudinary.
     */

    const photo =
      await uploadToCloudinary(
        photoInput.files[0]
      );


    /*
     * Criar solicitação.
     */

    await db
      .collection("characterRequests")
      .add({

        name,

        nickname,

        age,

        last4,

        character,

        work,

        photo,

        status:
          "pendente",

        createdAt:
          serverTimestamp()

      });


    showMessage(
      "Ficha enviada com sucesso!",
      "success"
    );


    form.reset();


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Não foi possível enviar a ficha.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   TROCA DE PERSONAGEM
========================================================= */

async function submitCharacterExchange(data) {

  if (!data) {
    return;
  }


  const oldCharacter =
    String(
      data.oldCharacter || ""
    ).trim();


  const oldWork =
    String(
      data.oldWork || ""
    ).trim();


  const newCharacter =
    String(
      data.newCharacter || ""
    ).trim();


  const newWork =
    String(
      data.newWork || ""
    ).trim();


  if (
    !oldCharacter ||
    !oldWork ||
    !newCharacter ||
    !newWork
  ) {

    throw new Error(
      "Preencha todos os campos da troca."
    );
  }


  /*
   * O novo personagem precisa estar livre.
   */

  const newVacancy =
    await findVacancy(
      newCharacter,
      newWork
    );


  if (
    newVacancy &&
    (
      newVacancy.status === "fechada" ||
      newVacancy.status === "ocupada"
    )
  ) {

    throw new Error(
      "O novo personagem já está ocupado."
    );
  }


  /*
   * Encontrar o personagem antigo.
   */

  const oldVacancy =
    await findVacancy(
      oldCharacter,
      oldWork
    );


  if (!oldVacancy) {

    throw new Error(
      "O personagem atual não foi encontrado."
    );
  }


  /*
   * Upload da nova foto.
   */

  let newPhoto =
    data.newPhoto || "";


  if (
    data.photoFile
  ) {

    newPhoto =
      await uploadToCloudinary(
        data.photoFile
      );
  }


  /*
   * Registrar troca como solicitação.
   */

  await db
    .collection("requests")
    .add({

      type:
        "troca",

      oldCharacter,

      oldWork,

      newCharacter,

      newWork,

      newPhoto,

      status:
        "pendente",

      createdAt:
        serverTimestamp()

    });


  showMessage(
    "Solicitação de troca enviada!",
    "success"
  );
}


/* =========================================================
   ACEITAR TROCA
========================================================= */

async function approveExchange(
  requestId
) {

  if (!currentAdmin) {
    return;
  }


  const ref =
    db
      .collection("requests")
      .doc(requestId);


  const doc =
    await ref.get();


  if (!doc.exists) {
    return;
  }


  const data =
    doc.data();


  if (data.type !== "troca") {
    return;
  }


  try {

    showLoading(
      "Processando troca..."
    );


    const oldVacancy =
      await findVacancy(
        data.oldCharacter,
        data.oldWork
      );


    const newVacancy =
      await findVacancy(
        data.newCharacter,
        data.newWork
      );


    if (
      newVacancy &&
      (
        newVacancy.status === "fechada" ||
        newVacancy.status === "ocupada"
      )
    ) {

      throw new Error(
        "O novo personagem já está ocupado."
      );
    }


    const batch =
      db.batch();


    /*
     * Abrir personagem antigo.
     */

    if (oldVacancy) {

      batch.update(
        oldVacancy.ref,
        {
          status:
            "aberta",

          occupiedBy:
            firebase.firestore.FieldValue.delete(),

          occupiedCharacter:
            firebase.firestore.FieldValue.delete(),

          occupiedWork:
            firebase.firestore.FieldValue.delete(),

          closedAt:
            firebase.firestore.FieldValue.delete(),

          updatedAt:
            serverTimestamp()
        }
      );

    }


    /*
     * Fechar personagem novo.
     */

    if (newVacancy) {

      batch.update(
        newVacancy.ref,
        {
          status:
            "fechada",

          occupiedCharacter:
            data.newCharacter,

          occupiedWork:
            data.newWork,

          occupiedPhoto:
            data.newPhoto || "",

          closedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

    } else {

      const refNew =
        db
          .collection("vagas")
          .doc();


      batch.set(
        refNew,
        {
          character:
            data.newCharacter,

          work:
            data.newWork,

          photo:
            data.newPhoto || "",

          status:
            "fechada",

          closedAt:
            serverTimestamp(),

          createdAt:
            serverTimestamp()
        }
      );
    }


    /*
     * Finalizar solicitação.
     */

    batch.update(
      ref,
      {
        status:
          "aprovado",

        approvedBy:
          currentAdmin.name,

        approvedAt:
          serverTimestamp()
      }
    );


    await batch.commit();


    await registerAccessLog(
      "approve_exchange",
      {
        requestId
      }
    );


    showMessage(
      "Troca aprovada!",
      "success"
    );


    await loadDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Erro ao processar troca.",
      "error"
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   VERIFICAÇÃO DE PERMISSÃO
========================================================= */

function hasRole(...roles) {

  if (!currentAdmin) {
    return false;
  }


  const currentRole =
    normalizeText(
      currentAdmin.role
    );


  return roles.some(
    role =>
      normalizeText(role) ===
      currentRole
  );
}


/* =========================================================
   PERMISSÃO DE DONO
========================================================= */

function isOwner() {

  if (!currentAdmin) {
    return false;
  }


  return (
    normalizeText(
      currentAdmin.role
    ) === "dono"
  );
}


/* =========================================================
   PERMISSÃO DE LIDERANÇA
========================================================= */

function isLeadership() {

  if (!currentAdmin) {
    return false;
  }


  const role =
    normalizeText(
      currentAdmin.role
    );


  return (
    role === "dono" ||
    role === "sub-dono" ||
    role === "líder de adm"
  );
}


/* =========================================================
   BUSCAR ADMINISTRADORES ONLINE
========================================================= */

async function loadOnlineAdmins() {

  try {

    const snapshot =
      await db
        .collection("adminsOnline")
        .where(
          "online",
          "==",
          true
        )
        .get();


    return snapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );

  } catch (error) {

    console.error(error);

    return [];
  }
}


/* =========================================================
   ATUALIZAR STATUS PERIODICAMENTE
========================================================= */

let onlineInterval = null;


function startOnlineHeartbeat() {

  if (onlineInterval) {
    clearInterval(
      onlineInterval
    );
  }


  onlineInterval =
    setInterval(
      async () => {

        if (!currentAdmin) {
          return;
        }


        try {

          await db
            .collection("adminsOnline")
            .doc(currentAdmin.uid)
            .update({
              online: true,
              lastSeen:
                serverTimestamp()
            });

        } catch (error) {

          console.error(
            "Heartbeat:",
            error
          );
        }

      },
      60000
    );
}


/* =========================================================
   INICIAR HEARTBEAT QUANDO LOGAR
========================================================= */

auth.onAuthStateChanged(
  user => {

    if (user) {
      startOnlineHeartbeat();
    } else {

      if (onlineInterval) {

        clearInterval(
          onlineInterval
        );

        onlineInterval =
          null;
      }
    }
  }
);


/* =========================================================
   ANTES DE SAIR DA PÁGINA
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    /*
     * Não usar await aqui.
     * Apenas sinalização básica.
     */

    if (
      currentAdmin &&
      navigator.sendBeacon
    ) {

      /*
       * O Firebase normalmente cuidará
       * do estado da sessão.
       */
    }
  }
);


/* =========================================================
   EXPOR FUNÇÕES NECESSÁRIAS AO HTML
========================================================= */

window.approveRequest =
  approveRequest;

window.rejectRequest =
  rejectRequest;

window.toggleVacancy =
  toggleVacancy;

window.editVacancy =
  editVacancy;

window.deleteVacancy =
  deleteVacancy;

window.createVacancy =
  createVacancy;

window.updateVacancy =
  updateVacancy;

window.saveEditedVacancy =
  saveEditedVacancy;

window.closeEditVacancyModal =
  closeEditVacancyModal;

window.approveExchange =
  approveExchange;

window.uploadToCloudinary =
  uploadToCloudinary;

window.loadDashboard =
  loadDashboard;


/* =========================================================
   FINAL
========================================================= */

console.log(
  "House LTD — sistema carregado."
);
