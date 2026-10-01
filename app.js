/* =========================================================
   HOUSE LTD — APP.JS COMPLETO
   PUBLIC INDEX + ADMIN PANEL
   Firebase + Cloudinary
   ========================================================= */

/* =========================================================
   1. CONFIGURAÇÕES
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCRUNymKVh-UxKkSvNEUZkAjmRi_4_AQU",
  authDomain: "house-ltd.firebaseapp.com",
  projectId: "house-ltd",
  storageBucket: "house-ltd.firebasestorage.app",
  messagingSenderId: "821811124213",
  appId: "1:821811124213:web:c8dd2b2f1e1a41bcd632bc",
  measurementId: "G-P28WHBV9VB"
};

const CLOUDINARY_CLOUD_NAME = "gsqmelxb";
const CLOUDINARY_UPLOAD_PRESET = "House LTD";
const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/* =========================================================
   2. CONTAS ADM
   ========================================================= */

const ADMIN_ACCOUNTS = {
  YM7JQ7: {
    name: "Aiko",
    role: "Dono",
    level: 100
  },

  YQ7NM4: {
    name: "Noah",
    role: "Sub-dono",
    level: 90
  },

  JM7XQ8: {
    name: "Shime",
    role: "Líder de Adm",
    level: 80
  },

  Y7KQ2M: {
    name: "Shiro",
    role: "ADM",
    level: 70
  },

  M7IQY5: {
    name: "Isa",
    role: "Staff",
    level: 60
  },

  QY7MH3: {
    name: "Mah",
    role: "ADM",
    level: 70
  },

  Y4JQ7L: {
    name: "Luan",
    role: "ADM",
    level: 70
  },

  K7YQ9M: {
    name: "Ayrken",
    role: "ADM",
    level: 70
  },

  YM4QX7: {
    name: "Evan",
    role: "ADM",
    level: 70
  },

  Q7YTM5: {
    name: "Tamsy",
    role: "ADM",
    level: 70
  },

  JY7QK6: {
    name: "Lucca",
    role: "ADM",
    level: 70
  },

  YQ5M7X: {
    name: "Kally",
    role: "ADM",
    level: 70
  },

  TH1K0L: {
    name: "Lici",
    role: "ADM",
    level: 70
  },

  FB61K5: {
    name: "Belly",
    role: "ADM",
    level: 70
  }
};


/* =========================================================
   3. FIREBASE
   ========================================================= */

let firebaseReady = false;
let firebaseError = null;

let db = null;
let auth = null;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.firestore();
  auth = firebase.auth();

  firebaseReady = true;
} catch (error) {
  firebaseError = error;
  console.error("Erro ao iniciar Firebase:", error);
}


/* =========================================================
   4. ESTADO
   ========================================================= */

const state = {
  admin: null,

  requests: [],
  vacancies: [],
  members: [],
  admins: [],
  logs: [],
  chat: [],

  currentView: "home",

  publicVacancies: [],
  publicMembers: []
};


/* =========================================================
   5. HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function getTimestamp() {
  if (
    typeof firebase !== "undefined" &&
    firebase.firestore &&
    firebase.firestore.FieldValue
  ) {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  return new Date();
}

function formatDate(value) {
  if (!value) return "—";

  try {
    if (value.toDate) {
      value = value.toDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "—";
  }
}

function formatDateTime(value) {
  if (!value) return "—";

  try {
    if (value.toDate) {
      value = value.toDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function isOpenVacancy(vacancy) {
  if (!vacancy) return false;

  if (typeof vacancy.open === "boolean") {
    return vacancy.open;
  }

  if (typeof vacancy.aberta === "boolean") {
    return vacancy.aberta;
  }

  if (typeof vacancy.status === "string") {
    const status = normalizeText(vacancy.status);

    return (
      status === "aberta" ||
      status === "open" ||
      status === "disponivel"
    );
  }

  return true;
}

function vacancyCharacter(vacancy) {
  return (
    vacancy.character ||
    vacancy.personagem ||
    vacancy.name ||
    vacancy.nome ||
    ""
  );
}

function vacancyWork(vacancy) {
  return (
    vacancy.work ||
    vacancy.obra ||
    vacancy.anime ||
    ""
  );
}

function vacancyPhoto(vacancy) {
  return (
    vacancy.photo ||
    vacancy.image ||
    vacancy.imagem ||
    vacancy.imageUrl ||
    ""
  );
}


/* =========================================================
   6. SESSION
   ========================================================= */

function getStoredAdmin() {
  try {
    const raw = sessionStorage.getItem("house_ltd_admin");

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeAdmin(admin) {
  try {
    sessionStorage.setItem(
      "house_ltd_admin",
      JSON.stringify(admin)
    );
  } catch {}
}

function clearStoredAdmin() {
  try {
    sessionStorage.removeItem("house_ltd_admin");
  } catch {}
}


/* =========================================================
   7. LOGIN / LOGOUT
   ========================================================= */

function showLogin() {
  const loginView = $("loginView");
  const appView = $("appView");

  if (loginView) {
    loginView.classList.remove("hidden");
  }

  if (appView) {
    appView.classList.add("hidden");
  }
}

function showApp() {
  const loginView = $("loginView");
  const appView = $("appView");

  if (loginView) {
    loginView.classList.add("hidden");
  }

  if (appView) {
    appView.classList.remove("hidden");
  }
}

function loginAdmin() {
  const input = $("adminCode");
  const message = $("loginMsg");

  if (!input) return;

  const code = normalizeCode(input.value);
  const account = ADMIN_ACCOUNTS[code];

  if (!account) {
    if (message) {
      message.textContent = "Código inválido.";
      message.classList.add("error");
    }

    input.value = "";
    return;
  }

  state.admin = {
    ...account,
    code
  };

  storeAdmin(state.admin);

  if (message) {
    message.textContent = "";
    message.classList.remove("error");
  }

  showApp();

  startAdminSession();

  if (typeof showView === "function") {
    showView("home");
  }
}

async function logoutAdmin() {
  clearStoredAdmin();

  state.admin = null;

  try {
    if (auth && auth.currentUser) {
      await auth.signOut();
    }
  } catch {}

  location.reload();
}


/* =========================================================
   8. FIREBASE ANÔNIMO
   ========================================================= */

async function ensureAnonymousAuth() {
  if (!firebaseReady || !auth) {
    return false;
  }

  try {
    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }

    return true;
  } catch (error) {
    console.warn("Firebase Auth:", error);
    return false;
  }
}


/* =========================================================
   9. CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(file) {
  if (!file) {
    throw new Error("Nenhuma imagem selecionada.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
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
    throw new Error(
      `Erro no Cloudinary: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error(
      "O Cloudinary não retornou a imagem."
    );
  }

  return data.secure_url;
}


/* =========================================================
   10. LOADING DO INDEX
   ========================================================= */

function finishPublicLoading() {
  const loading = $("loadingScreen");

  if (!loading) return;

  loading.classList.add("hidden");

  loading.style.opacity = "0";
  loading.style.pointerEvents = "none";

  setTimeout(() => {
    if (loading) {
      loading.style.display = "none";
    }
  }, 500);
}


/* =========================================================
   11. PUBLIC — VAGAS
   ========================================================= */

async function getPublicVacancies() {
  if (!db) {
    return [];
  }

  const result = [];

  const collections = [
    "vagas",
    "occupiedCharacters"
  ];

  for (const collectionName of collections) {
    try {
      const snapshot =
        await db.collection(collectionName).get();

      snapshot.forEach(doc => {
        const data = {
          id: doc.id,
          ...doc.data()
        };

        const alreadyExists = result.some(item => {
          const a = normalizeText(vacancyCharacter(item));
          const b = normalizeText(vacancyCharacter(data));

          const aw = normalizeText(vacancyWork(item));
          const bw = normalizeText(vacancyWork(data));

          return a === b && aw === bw;
        });

        if (!alreadyExists) {
          result.push(data);
        }
      });

      if (result.length) {
        break;
      }
    } catch (error) {
      console.warn(
        `Erro ao carregar ${collectionName}:`,
        error
      );
    }
  }

  return result;
}

function createVacancyCard(vacancy, closed = false) {
  const character = vacancyCharacter(vacancy);
  const work = vacancyWork(vacancy);
  const photo = vacancyPhoto(vacancy);

  const imageHTML = photo
    ? `
      <img
        src="${escapeHTML(photo)}"
        alt="${escapeHTML(character)}"
        loading="lazy"
      >
    `
    : `
      <div class="vacancy-placeholder">
        LTD
      </div>
    `;

  return `
    <article
      class="vacancy-card ${closed ? "closed" : "open"}"
      data-character="${escapeHTML(character)}"
    >
      <div class="vacancy-image">
        ${imageHTML}
      </div>

      <div class="vacancy-info">
        <h3>${escapeHTML(character || "Personagem")}</h3>

        ${
          work
            ? `<p>${escapeHTML(work)}</p>`
            : ""
        }

        <span class="vacancy-status">
          ${closed ? "Vaga fechada" : "Vaga aberta"}
        </span>
      </div>
    </article>
  `;
}

function renderPublicVacancies(vacancies) {
  state.publicVacancies = vacancies || [];

  const openContainer = $("openVacancies");
  const closedContainer = $("closedVacancies");

  const open = state.publicVacancies.filter(
    vacancy => isOpenVacancy(vacancy)
  );

  const closed = state.publicVacancies.filter(
    vacancy => !isOpenVacancy(vacancy)
  );

  if (openContainer) {
    openContainer.innerHTML = open.length
      ? open
          .map(v => createVacancyCard(v, false))
          .join("")
      : `
        <div class="empty-state">
          Nenhuma vaga aberta no momento.
        </div>
      `;
  }

  if (closedContainer) {
    closedContainer.innerHTML = closed.length
      ? closed
          .map(v => createVacancyCard(v, true))
          .join("")
      : `
        <div class="empty-state">
          Nenhuma vaga fechada no momento.
        </div>
      `;
  }
}


/* =========================================================
   12. PUBLIC — MEMBROS
   ========================================================= */

async function getPublicMembers() {
  if (!db) return [];

  try {
    const snapshot =
      await db.collection("members").get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.warn(
      "Erro ao carregar membros:",
      error
    );

    return [];
  }
}

function memberCharacter(member) {
  return (
    member.character ||
    member.personagem ||
    ""
  );
}

function memberWork(member) {
  return (
    member.work ||
    member.obra ||
    ""
  );
}

function memberName(member) {
  return (
    member.name ||
    member.nome ||
    member.nickname ||
    member.apelido ||
    "Membro"
  );
}

function memberPhoto(member) {
  return (
    member.photo ||
    member.image ||
    member.imageUrl ||
    ""
  );
}

function createPublicMemberCard(member) {
  const name = memberName(member);
  const character = memberCharacter(member);
  const work = memberWork(member);
  const photo = memberPhoto(member);

  return `
    <article
      class="member-card"
      data-member-search="${escapeHTML(
        `${name} ${character} ${work}`
      )}"
    >

      <div class="member-photo">
        ${
          photo
            ? `
              <img
                src="${escapeHTML(photo)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
              >
            `
            : `
              <div class="member-placeholder">
                ${escapeHTML(
                  String(name).charAt(0).toUpperCase()
                )}
              </div>
            `
        }
      </div>

      <div class="member-info">
        <h3>${escapeHTML(name)}</h3>

        ${
          character
            ? `<p>${escapeHTML(character)}</p>`
            : ""
        }

        ${
          work
            ? `<small>${escapeHTML(work)}</small>`
            : ""
        }
      </div>

    </article>
  `;
}

function renderPublicMembers(members) {
  state.publicMembers = members || [];

  const container = $("membersList");

  if (!container) return;

  if (!state.publicMembers.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhum membro cadastrado ainda.
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.publicMembers
      .map(createPublicMemberCard)
      .join("");
}

function filterPublicMembers() {
  const input = $("memberSearch");
  const container = $("membersList");

  if (!input || !container) return;

  const query = normalizeText(input.value);

  const cards =
    container.querySelectorAll(
      ".member-card"
    );

  cards.forEach(card => {
    const text =
      normalizeText(
        card.dataset.memberSearch || ""
      );

    card.style.display =
      !query || text.includes(query)
        ? ""
        : "none";
  });
}


/* =========================================================
   13. PUBLIC — FOTO PREVIEW
   ========================================================= */

function setupImagePreview(
  inputId,
  previewId,
  placeholderId
) {
  const input = $(inputId);
  const preview = $(previewId);
  const placeholder = $(placeholderId);

  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (!file) {
      if (preview) {
        preview.style.display = "none";
        preview.removeAttribute("src");
      }

      if (placeholder) {
        placeholder.style.display = "";
      }

      return;
    }

    if (!file.type.startsWith("image/")) {
      input.value = "";

      if (preview) {
        preview.style.display = "none";
      }

      if (placeholder) {
        placeholder.style.display = "";
      }

      alert("Selecione uma imagem válida.");

      return;
    }

    const url = URL.createObjectURL(file);

    if (preview) {
      preview.src = url;
      preview.style.display = "block";
    }

    if (placeholder) {
      placeholder.style.display = "none";
    }
  });
}


/* =========================================================
   14. PUBLIC — FICHA
   ========================================================= */

async function submitRequestForm(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const message = $("requestMessage");
  const status = $("requestStatus");

  const name =
    $("requestName")?.value.trim() || "";

  const age =
    $("requestAge")?.value.trim() || "";

  const phone =
    $("requestPhone")?.value.trim() || "";

  const character =
    $("requestCharacter")?.value.trim() || "";

  const work =
    $("requestWork")?.value.trim() || "";

  const photoInput =
    $("requestPhoto");

  const file =
    photoInput?.files?.[0];

  if (!age || !phone || !character || !work) {
    if (status) {
      status.textContent =
        "Preencha todos os campos obrigatórios.";
    }

    return;
  }

  if (!file) {
    if (status) {
      status.textContent =
        "Envie a foto do personagem.";
    }

    return;
  }

  if (!db) {
    if (status) {
      status.textContent =
        "O sistema ainda não conseguiu conectar ao banco de dados. Tente novamente.";
    }

    return;
  }

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  const originalText =
    button?.textContent || "";

  try {
    if (button) {
      button.disabled = true;
      button.textContent =
        "Enviando...";
    }

    if (status) {
      status.textContent =
        "Enviando imagem...";
    }

    const photo =
      await uploadToCloudinary(file);

    if (status) {
      status.textContent =
        "Enviando ficha...";
    }

    const data = {
      name,
      age,
      phone: phone.slice(-4),
      character,
      work,
      photo,

      status: "pending",
      type: "request",

      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };

    await db
      .collection("characterRequests")
      .add(data);

    if (status) {
      status.textContent =
        "Ficha enviada com sucesso! Aguarde a aprovação.";
    }

    if (message) {
      message.textContent =
        "Sua ficha foi enviada para a administração.";
    }

    form.reset();

    const preview = $("requestPhotoPreview");
    const placeholder =
      $("requestPhotoPlaceholder");

    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }

    if (placeholder) {
      placeholder.style.display = "";
    }

  } catch (error) {
    console.error(
      "Erro ao enviar ficha:",
      error
    );

    if (status) {
      status.textContent =
        "Não foi possível enviar a ficha. Tente novamente.";
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}


/* =========================================================
   15. PUBLIC — TROCA
   ========================================================= */

async function submitExchangeForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = $("exchangeStatus");

  const phone =
    $("exchangePhone")?.value.trim() || "";

  const oldCharacter =
    $("exchangeOldCharacter")?.value.trim() || "";

  const oldWork =
    $("exchangeOldWork")?.value.trim() || "";

  const newCharacter =
    $("exchangeNewCharacter")?.value.trim() || "";

  const newWork =
    $("exchangeNewWork")?.value.trim() || "";

  const file =
    $("exchangePhoto")?.files?.[0];

  if (
    !phone ||
    !oldCharacter ||
    !oldWork ||
    !newCharacter ||
    !newWork
  ) {
    if (status) {
      status.textContent =
        "Preencha todos os campos obrigatórios.";
    }

    return;
  }

  if (!file) {
    if (status) {
      status.textContent =
        "Envie a foto do novo personagem.";
    }

    return;
  }

  if (!db) {
    if (status) {
      status.textContent =
        "O banco de dados ainda não está disponível.";
    }

    return;
  }

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  const originalText =
    button?.textContent || "";

  try {
    if (button) {
      button.disabled = true;
      button.textContent =
        "Enviando...";
    }

    if (status) {
      status.textContent =
        "Enviando imagem...";
    }

    const photo =
      await uploadToCloudinary(file);

    await db
      .collection("characterRequests")
      .add({
        type: "exchange",
        status: "pending",

        phone: phone.slice(-4),

        oldCharacter,
        oldWork,

        character: newCharacter,
        work: newWork,
        photo,

        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      });

    if (status) {
      status.textContent =
        "Solicitação de troca enviada com sucesso!";
    }

    form.reset();

    const preview =
      $("exchangePhotoPreview");

    const placeholder =
      $("exchangePhotoPlaceholder");

    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }

    if (placeholder) {
      placeholder.style.display = "";
    }

  } catch (error) {
    console.error(
      "Erro na troca:",
      error
    );

    if (status) {
      status.textContent =
        "Não foi possível enviar a troca.";
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}


/* =========================================================
   16. PUBLIC — CARREGAMENTO
   ========================================================= */

async function loadPublicData() {
  if (!db) {
    renderPublicVacancies([]);
    renderPublicMembers([]);
    return;
  }

  try {
    const [vacancies, members] =
      await Promise.all([
        getPublicVacancies(),
        getPublicMembers()
      ]);

    renderPublicVacancies(vacancies);
    renderPublicMembers(members);

  } catch (error) {
    console.error(
      "Erro nos dados públicos:",
      error
    );

    renderPublicVacancies([]);
    renderPublicMembers([]);
  }
}


/* =========================================================
   17. ADMIN — CARREGAMENTO
   ========================================================= */

async function getCollection(
  collectionName
) {
  if (!db) return [];

  try {
    const snapshot =
      await db
        .collection(collectionName)
        .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.warn(
      `Erro ao carregar ${collectionName}:`,
      error
    );

    return [];
  }
}

async function refreshAll() {
  if (!db) return;

  const [
    requests,
    vacancies,
    members,
    admins,
    logs,
    chat
  ] = await Promise.all([
    getCollection("characterRequests"),
    getCollection("vagas"),
    getCollection("members"),
    getCollection("adminProfiles"),
    getCollection("accessLogs"),
    getCollection("adminChat")
  ]);

  state.requests = requests;
  state.vacancies = vacancies;
  state.members = members;
  state.admins = admins;
  state.logs = logs;
  state.chat = chat;

  renderStats();
  renderHome();
  renderRequests();
  renderVacancies();
  renderMembers();
  renderAdmins();
  renderChat();
  renderLogs();
}


/* =========================================================
   18. ADMIN — STATS
   ========================================================= */

function renderStats() {
  const pending =
    state.requests.filter(
      request =>
        normalizeText(request.status) ===
        "pending"
    ).length;

  const open =
    state.vacancies.filter(
      isOpenVacancy
    ).length;

  const closed =
    state.vacancies.filter(
      vacancy => !isOpenVacancy(vacancy)
    ).length;

  const members =
    state.members.length;

  const elements = {
    pending,
    open,
    closed,
    members
  };

  Object.entries(elements).forEach(
    ([key, value]) => {
      const el =
        document.querySelector(
          `[data-stat="${key}"]`
        );

      if (el) {
        el.textContent = value;
      }
    }
  );

  const ids = {
    pending: [
      "pendingCount",
      "statPending",
      "homePending"
    ],

    open: [
      "openCount",
      "statOpen",
      "homeOpen"
    ],

    closed: [
      "closedCount",
      "statClosed",
      "homeClosed"
    ],

    members: [
      "membersCount",
      "statMembers",
      "homeMembers"
    ]
  };

  Object.entries(ids).forEach(
    ([key, list]) => {
      list.forEach(id => {
        const el = $(id);

        if (el) {
          el.textContent =
            elements[key];
        }
      });
    }
  );
}


/* =========================================================
   19. ADMIN — HOME
   ========================================================= */

function renderHome() {
  const container =
    $("homeContent") ||
    $("homeView");

  if (!container) return;

  const pending =
    state.requests.filter(
      request =>
        normalizeText(request.status) ===
        "pending"
    ).length;

  const open =
    state.vacancies.filter(
      isOpenVacancy
    ).length;

  const closed =
    state.vacancies.filter(
      vacancy => !isOpenVacancy(vacancy)
    ).length;

  const members =
    state.members.length;

  const existing =
    container.querySelector(
      "[data-ltd-home-stats]"
    );

  if (existing) {
    existing.innerHTML = `
      <strong>${pending}</strong>
      <span>Solicitações pendentes</span>

      <strong>${open}</strong>
      <span>Vagas abertas</span>

      <strong>${closed}</strong>
      <span>Vagas fechadas</span>

      <strong>${members}</strong>
      <span>Membros</span>
    `;
  }
}


/* =========================================================
   20. ADMIN — SOLICITAÇÕES
   ========================================================= */

function requestStatus(request) {
  const status =
    normalizeText(request.status);

  if (status === "approved") {
    return "Aprovada";
  }

  if (status === "rejected") {
    return "Recusada";
  }

  return "Pendente";
}

function renderRequests() {
  const container =
    $("requestsList") ||
    $("requestsContainer");

  if (!container) return;

  const pending =
    state.requests.filter(
      request =>
        !request.status ||
        normalizeText(request.status) ===
          "pending"
    );

  if (!pending.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhuma solicitação pendente.
      </div>
    `;

    return;
  }

  container.innerHTML =
    pending
      .map(request => {
        const character =
          request.character ||
          request.personagem ||
          "";

        const work =
          request.work ||
          request.obra ||
          "";

        const photo =
          request.photo ||
          request.image ||
          "";

        const isExchange =
          request.type === "exchange";

        return `
          <article
            class="request-card"
            data-request-id="${escapeHTML(request.id)}"
          >

            <div class="request-photo">
              ${
                photo
                  ? `
                    <img
                      src="${escapeHTML(photo)}"
                      alt="${escapeHTML(character)}"
                    >
                  `
                  : `
                    <div class="member-placeholder">
                      LTD
                    </div>
                  `
              }
            </div>

            <div class="request-info">

              <h3>
                ${escapeHTML(
                  character || "Sem personagem"
                )}
              </h3>

              <p>
                ${escapeHTML(work)}
              </p>

              ${
                request.name
                  ? `
                    <p>
                      <strong>Nome:</strong>
                      ${escapeHTML(request.name)}
                    </p>
                  `
                  : ""
              }

              ${
                request.age
                  ? `
                    <p>
                      <strong>Idade:</strong>
                      ${escapeHTML(request.age)}
                    </p>
                  `
                  : ""
              }

              ${
                request.phone
                  ? `
                    <p>
                      <strong>Final:</strong>
                      ${escapeHTML(request.phone)}
                    </p>
                  `
                  : ""
              }

              ${
                isExchange
                  ? `
                    <p>
                      <strong>Troca:</strong>
                      ${escapeHTML(
                        request.oldCharacter || ""
                      )}
                      —
                      ${escapeHTML(
                        request.oldWork || ""
                      )}
                    </p>
                  `
                  : ""
              }

              <small>
                ${formatDateTime(
                  request.createdAt
                )}
              </small>

            </div>

            <div class="request-actions">

              <button
                type="button"
                data-approve="${escapeHTML(request.id)}"
              >
                Aprovar
              </button>

              <button
                type="button"
                data-reject="${escapeHTML(request.id)}"
              >
                Recusar
              </button>

            </div>

          </article>
        `;
      })
      .join("");
}


/* =========================================================
   21. ADMIN — VAGAS
   ========================================================= */

function renderVacancies() {
  const container =
    $("vacanciesList") ||
    $("vacanciesContainer");

  if (!container) return;

  if (!state.vacancies.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhuma vaga cadastrada.
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.vacancies
      .map(vacancy => {
        const character =
          vacancyCharacter(vacancy);

        const work =
          vacancyWork(vacancy);

        const photo =
          vacancyPhoto(vacancy);

        const open =
          isOpenVacancy(vacancy);

        return `
          <article
            class="admin-vacancy-card"
            data-vacancy-id="${escapeHTML(vacancy.id)}"
          >

            <div class="vacancy-image">

              ${
                photo
                  ? `
                    <img
                      src="${escapeHTML(photo)}"
                      alt="${escapeHTML(character)}"
                    >
                  `
                  : `
                    <div class="vacancy-placeholder">
                      LTD
                    </div>
                  `
              }

            </div>

            <div class="vacancy-info">

              <h3>
                ${escapeHTML(
                  character || "Sem nome"
                )}
              </h3>

              <p>
                ${escapeHTML(work)}
              </p>

              <span>
                ${open
                  ? "Vaga aberta"
                  : "Vaga fechada"}
              </span>

            </div>

            <div class="vacancy-actions">

              <button
                type="button"
                data-edit-vacancy="${escapeHTML(vacancy.id)}"
              >
                Editar
              </button>

              <button
                type="button"
                data-toggle-vacancy="${escapeHTML(vacancy.id)}"
              >
                ${open ? "Fechar" : "Abrir"}
              </button>

              <button
                type="button"
                data-delete-vacancy="${escapeHTML(vacancy.id)}"
              >
                Excluir
              </button>

            </div>

          </article>
        `;
      })
      .join("");
}


/* =========================================================
   22. ADMIN — MEMBROS
   ========================================================= */

function renderMembers() {
  const container =
    $("adminMembersList") ||
    $("membersAdminList") ||
    $("membersListAdmin");

  if (!container) return;

  if (!state.members.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhum membro cadastrado.
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.members
      .map(member => {
        const name =
          memberName(member);

        const character =
          memberCharacter(member);

        const work =
          memberWork(member);

        const photo =
          memberPhoto(member);

        return `
          <article class="member-card">

            <div class="member-photo">

              ${
                photo
                  ? `
                    <img
                      src="${escapeHTML(photo)}"
                      alt="${escapeHTML(name)}"
                    >
                  `
                  : `
                    <div class="member-placeholder">
                      ${escapeHTML(
                        name.charAt(0).toUpperCase()
                      )}
                    </div>
                  `
              }

            </div>

            <div class="member-info">

              <h3>
                ${escapeHTML(name)}
              </h3>

              <p>
                ${escapeHTML(character)}
              </p>

              <small>
                ${escapeHTML(work)}
              </small>

            </div>

          </article>
        `;
      })
      .join("");
}


/* =========================================================
   23. ADMIN — ADMS
   ========================================================= */

function renderAdmins() {
  const container =
    $("adminsList") ||
    $("adminList");

  if (!container) return;

  const accounts =
    Object.entries(
      ADMIN_ACCOUNTS
    );

  container.innerHTML =
    accounts
      .map(([code, account]) => {
        const profile =
          state.admins.find(
            item =>
              normalizeText(item.name) ===
              normalizeText(account.name)
          );

        const photo =
          profile?.photo ||
          profile?.image ||
          "";

        return `
          <article class="admin-card">

            <div class="admin-photo">

              ${
                photo
                  ? `
                    <img
                      src="${escapeHTML(photo)}"
                      alt="${escapeHTML(account.name)}"
                    >
                  `
                  : `
                    <div class="member-placeholder">
                      ${escapeHTML(
                        account.name
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                  `
              }

            </div>

            <div>

              <h3>
                ${escapeHTML(account.name)}
              </h3>

              <p>
                ${escapeHTML(account.role)}
              </p>

            </div>

          </article>
        `;
      })
      .join("");
}


/* =========================================================
   24. ADMIN — CHAT
   ========================================================= */

function renderChat() {
  const container =
    $("chatMessages") ||
    $("adminChatMessages") ||
    $("chatList");

  if (!container) return;

  if (!state.chat.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhuma mensagem ainda.
      </div>
    `;

    return;
  }

  const sorted =
    [...state.chat].sort(
      (a, b) => {
        const ad =
          a.createdAt?.toDate?.() ||
          new Date(a.createdAt || 0);

        const bd =
          b.createdAt?.toDate?.() ||
          new Date(b.createdAt || 0);

        return ad - bd;
      }
    );

  container.innerHTML =
    sorted
      .map(message => `
        <div class="chat-message">

          <strong>
            ${escapeHTML(
              message.adminName ||
              message.name ||
              "ADM"
            )}
          </strong>

          <p>
            ${escapeHTML(
              message.message ||
              message.text ||
              ""
            )}
          </p>

          <small>
            ${formatDateTime(
              message.createdAt
            )}
          </small>

        </div>
      `)
      .join("");
}


/* =========================================================
   25. ADMIN — LOGS
   ========================================================= */

function renderLogs() {
  const container =
    $("logsList") ||
    $("accessLogsList");

  if (!container) return;

  if (!state.logs.length) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhum registro.
      </div>
    `;

    return;
  }

  const sorted =
    [...state.logs].sort(
      (a, b) => {
        const ad =
          a.createdAt?.toDate?.() ||
          new Date(a.createdAt || 0);

        const bd =
          b.createdAt?.toDate?.() ||
          new Date(b.createdAt || 0);

        return bd - ad;
      }
    );

  container.innerHTML =
    sorted
      .map(log => `
        <div class="log-item">

          <strong>
            ${escapeHTML(
              log.action ||
              log.type ||
              "Ação"
            )}
          </strong>

          <p>
            ${escapeHTML(
              log.description ||
              log.message ||
              ""
            )}
          </p>

          <small>
            ${escapeHTML(
              log.adminName ||
              "Sistema"
            )}
            —
            ${formatDateTime(
              log.createdAt
            )}
          </small>

        </div>
      `)
      .join("");
}


/* =========================================================
   26. LOG
   ========================================================= */

async function createLog(
  action,
  description
) {
  if (!db) return;

  try {
    await db
      .collection("accessLogs")
      .add({
        action,
        description,

        adminName:
          state.admin?.name ||
          "Sistema",

        adminCode:
          state.admin?.code ||
          null,

        createdAt:
          getTimestamp()
      });

  } catch (error) {
    console.warn(
      "Erro ao criar log:",
      error
    );
  }
}


/* =========================================================
   27. ENCONTRAR VAGA
   ========================================================= */

function findMatchingVacancy(
  character,
  work
) {
  const char =
    normalizeText(character);

  const obra =
    normalizeText(work);

  return state.vacancies.find(
    vacancy =>
      normalizeText(
        vacancyCharacter(vacancy)
      ) === char &&
      normalizeText(
        vacancyWork(vacancy)
      ) === obra
  );
}

async function findVacancyInFirestore(
  character,
  work
) {
  const local =
    findMatchingVacancy(
      character,
      work
    );

  if (local) return local;

  if (!db) return null;

  try {
    const snapshot =
      await db
        .collection("vagas")
        .get();

    const found =
      snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .find(vacancy =>
          normalizeText(
            vacancyCharacter(vacancy)
          ) ===
            normalizeText(character) &&
          normalizeText(
            vacancyWork(vacancy)
          ) ===
            normalizeText(work)
        );

    return found || null;

  } catch (error) {
    console.warn(
      "Erro procurando vaga:",
      error
    );

    return null;
  }
}


/* =========================================================
   28. CRIAR VAGA FECHADA
   ========================================================= */

async function createClosedVacancyFromRequest(
  request
) {
  if (!db) return null;

  const character =
    request.character ||
    request.personagem ||
    "";

  const work =
    request.work ||
    request.obra ||
    "";

  if (!character) {
    return null;
  }

  const existing =
    await findVacancyInFirestore(
      character,
      work
    );

  if (existing) {
    try {
      await db
        .collection("vagas")
        .doc(existing.id)
        .set(
          {
            ...existing,
            character,
            work,

            photo:
              request.photo ||
              existing.photo ||
              "",

            open: false,
            status: "closed",

            updatedAt:
              getTimestamp()
          },
          { merge: true }
        );

      return existing.id;

    } catch (error) {
      console.warn(
        "Erro fechando vaga existente:",
        error
      );

      return existing.id;
    }
  }

  const ref =
    await db
      .collection("vagas")
      .add({
        character,
        work,

        photo:
          request.photo || "",

        open: false,
        status: "closed",

        createdAt:
          getTimestamp(),

        updatedAt:
          getTimestamp()
      });

  return ref.id;
}


/* =========================================================
   29. FECHAR VAGA NA APROVAÇÃO
   ========================================================= */

async function closeVacancyFromApproval(
  request
) {
  const character =
    request.character ||
    request.personagem ||
    "";

  const work =
    request.work ||
    request.obra ||
    "";

  const vacancy =
    await findVacancyInFirestore(
      character,
      work
    );

  if (!vacancy) {
    return createClosedVacancyFromRequest(
      request
    );
  }

  try {
    await db
      .collection("vagas")
      .doc(vacancy.id)
      .set(
        {
          open: false,
          status: "closed",

          character:
            character ||
            vacancyCharacter(vacancy),

          work:
            work ||
            vacancyWork(vacancy),

          photo:
            request.photo ||
            vacancyPhoto(vacancy) ||
            "",

          updatedAt:
            getTimestamp()
        },
        { merge: true }
      );

    return vacancy.id;

  } catch (error) {
    console.error(
      "Erro fechando vaga:",
      error
    );

    throw error;
  }
}


/* =========================================================
   30. ENCONTRAR MEMBRO EXISTENTE
   ========================================================= */

async function findExistingMember(
  request
) {
  const character =
    normalizeText(
      request.character ||
      request.personagem
    );

  const phone =
    String(
      request.phone || ""
    ).slice(-4);

  const local =
    state.members.find(member => {
      const memberCharacterValue =
        normalizeText(
          memberCharacter(member)
        );

      const memberPhone =
        String(
          member.phone ||
          member.phoneLast4 ||
          ""
        ).slice(-4);

      return (
        memberCharacterValue ===
          character &&
        phone &&
        memberPhone === phone
      );
    });

  if (local) {
    return local;
  }

  if (!db) return null;

  try {
    const snapshot =
      await db
        .collection("members")
        .get();

    return (
      snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .find(member => {
          const mc =
            normalizeText(
              memberCharacter(member)
            );

          const mp =
            String(
              member.phone ||
              member.phoneLast4 ||
              ""
            ).slice(-4);

          return (
            mc === character &&
            phone &&
            mp === phone
          );
        }) || null
    );

  } catch {
    return null;
  }
}


/* =========================================================
   31. CRIAR MEMBRO
   ========================================================= */

async function createMemberFromRequest(
  request
) {
  if (!db) {
    throw new Error(
      "Firebase não disponível."
    );
  }

  const existing =
    await findExistingMember(
      request
    );

  if (existing) {
    return existing.id;
  }

  const memberData = {
    name:
      request.name ||
      request.nome ||
      request.nickname ||
      request.apelido ||
      "",

    age:
      request.age ||
      request.idade ||
      "",

    phone:
      String(
        request.phone ||
        ""
      ).slice(-4),

    character:
      request.character ||
      request.personagem ||
      "",

    work:
      request.work ||
      request.obra ||
      "",

    photo:
      request.photo ||
      request.image ||
      "",

    createdAt:
      getTimestamp(),

    updatedAt:
      getTimestamp()
  };

  const ref =
    await db
      .collection("members")
      .add(memberData);

  return ref.id;
}


/* =========================================================
   32. LOCALIZAR SOLICITAÇÃO
   ========================================================= */

async function findRequestCollection(
  requestId
) {
  if (!db) {
    throw new Error(
      "Firebase não disponível."
    );
  }

  try {
    const doc =
      await db
        .collection("characterRequests")
        .doc(requestId)
        .get();

    if (doc.exists) {
      return {
        collection: "characterRequests",
        id: requestId,
        data: doc.data()
      };
    }
  } catch {}

  try {
    const doc =
      await db
        .collection("requests")
        .doc(requestId)
        .get();

    if (doc.exists) {
      return {
        collection: "requests",
        id: requestId,
        data: doc.data()
      };
    }
  } catch {}

  return null;
}


/* =========================================================
   33. APROVAR SOLICITAÇÃO
   ========================================================= */

async function approveRequest(
  requestId
) {
  if (!db) {
    alert(
      "O Firebase não está disponível."
    );

    return;
  }

  const button =
    [...document.querySelectorAll(
      "[data-approve]"
    )].find(
      element =>
        element.dataset.approve ===
        requestId
    );

  if (button) {
    button.disabled = true;
    button.textContent =
      "Aprovando...";
  }

  try {
    const requestInfo =
      await findRequestCollection(
        requestId
      );

    if (!requestInfo) {
      throw new Error(
        "Solicitação não encontrada."
      );
    }

    const request =
      requestInfo.data;

    /*
      1. Cria o membro primeiro.
    */
    await createMemberFromRequest(
      request
    );

    /*
      2. Fecha a vaga existente.
         Se não existir, cria a vaga fechada.
    */
    await closeVacancyFromApproval(
      request
    );

    /*
      3. Marca a solicitação como aprovada.
    */
    await db
      .collection(
        requestInfo.collection
      )
      .doc(requestInfo.id)
      .set(
        {
          status: "approved",

          approvedAt:
            getTimestamp(),

          approvedBy:
            state.admin?.name ||
            "ADM",

          updatedAt:
            getTimestamp()
        },
        { merge: true }
      );

    /*
      4. Log.
    */
    await createLog(
      "Aprovação de solicitação",
      `Solicitação de ${request.character || request.personagem || "personagem"} aprovada.`
    );

    /*
      5. Atualiza tudo.
    */
    await refreshAll();

    alert(
      "Solicitação aprovada!\n\nO membro foi cadastrado e a vaga foi fechada."
    );

  } catch (error) {
    console.error(
      "Erro ao aprovar:",
      error
    );

    alert(
      "Não foi possível aprovar a solicitação.\n\n" +
      (error.message || error)
    );

    if (button) {
      button.disabled = false;
      button.textContent =
        "Aprovar";
    }
  }
}


/* =========================================================
   34. RECUSAR SOLICITAÇÃO
   ========================================================= */

async function rejectRequest(
  requestId
) {
  if (!db) return;

  const button =
    [...document.querySelectorAll(
      "[data-reject]"
    )].find(
      element =>
        element.dataset.reject ===
        requestId
    );

  if (button) {
    button.disabled = true;
    button.textContent =
      "Recusando...";
  }

  try {
    const requestInfo =
      await findRequestCollection(
        requestId
      );

    if (!requestInfo) {
      throw new Error(
        "Solicitação não encontrada."
      );
    }

    await db
      .collection(
        requestInfo.collection
      )
      .doc(requestInfo.id)
      .set(
        {
          status: "rejected",

          rejectedAt:
            getTimestamp(),

          rejectedBy:
            state.admin?.name ||
            "ADM",

          updatedAt:
            getTimestamp()
        },
        { merge: true }
      );

    await createLog(
      "Recusa de solicitação",
      `Solicitação de ${requestInfo.data.character || "personagem"} recusada.`
    );

    await refreshAll();

  } catch (error) {
    console.error(
      "Erro ao recusar:",
      error
    );

    alert(
      "Não foi possível recusar a solicitação."
    );

    if (button) {
      button.disabled = false;
      button.textContent =
        "Recusar";
    }
  }
}


/* =========================================================
   35. VAGAS — SALVAR
   ========================================================= */

async function saveVacancy(
  vacancyId = null
) {
  if (!db) return;

  const character =
    $("vacancyCharacter")?.value.trim() ||
    $("editCharacter")?.value.trim() ||
    "";

  const work =
    $("vacancyWork")?.value.trim() ||
    $("editWork")?.value.trim() ||
    "";

  const photoInput =
    $("vacancyPhoto") ||
    $("editPhoto");

  const file =
    photoInput?.files?.[0];

  if (!character || !work) {
    alert(
      "Preencha personagem e obra."
    );

    return;
  }

  try {
    let photo = "";

    if (file) {
      photo =
        await uploadToCloudinary(file);
    }

    const data = {
      character,
      work,

      open: true,
      status: "open",

      updatedAt:
        getTimestamp()
    };

    if (photo) {
      data.photo = photo;
    }

    if (vacancyId) {
      await db
        .collection("vagas")
        .doc(vacancyId)
        .set(
          data,
          { merge: true }
        );

      await createLog(
        "Edição de vaga",
        `${character} — ${work}`
      );

    } else {
      data.createdAt =
        getTimestamp();

      await db
        .collection("vagas")
        .add(data);

      await createLog(
        "Criação de vaga",
        `${character} — ${work}`
      );
    }

    await refreshAll();

    closeVacancyModal();

  } catch (error) {
    console.error(
      "Erro ao salvar vaga:",
      error
    );

    alert(
      "Não foi possível salvar a vaga."
    );
  }
}


/* =========================================================
   36. VAGAS — EDITAR
   ========================================================= */

function editVacancy(vacancyId) {
  const vacancy =
    state.vacancies.find(
      item => item.id === vacancyId
    );

  if (!vacancy) return;

  const modal =
    $("vacancyModal");

  if (!modal) return;

  const character =
    vacancyCharacter(vacancy);

  const work =
    vacancyWork(vacancy);

  const characterInput =
    $("vacancyCharacter") ||
    $("editCharacter");

  const workInput =
    $("vacancyWork") ||
    $("editWork");

  if (characterInput) {
    characterInput.value =
      character;
  }

  if (workInput) {
    workInput.value =
      work;
  }

  modal.dataset.editing =
    vacancyId;

  modal.classList.remove("hidden");
}


/* =========================================================
   37. VAGAS — ABRIR/FECHAR
   ========================================================= */

async function toggleVacancy(
  vacancyId
) {
  if (!db) return;

  const vacancy =
    state.vacancies.find(
      item => item.id === vacancyId
    );

  if (!vacancy) return;

  const next =
    !isOpenVacancy(vacancy);

  try {
    await db
      .collection("vagas")
      .doc(vacancyId)
      .set(
        {
          open: next,

          status:
            next
              ? "open"
              : "closed",

          updatedAt:
            getTimestamp()
        },
        { merge: true }
      );

    await createLog(
      next
        ? "Abertura de vaga"
        : "Fechamento de vaga",
      `${vacancyCharacter(vacancy)} — ${vacancyWork(vacancy)}`
    );

    await refreshAll();

  } catch (error) {
    console.error(
      "Erro alterando vaga:",
      error
    );

    alert(
      "Não foi possível alterar a vaga."
    );
  }
}


/* =========================================================
   38. VAGAS — EXCLUIR
   ========================================================= */

async function deleteVacancy(
  vacancyId
) {
  if (!db) return;

  const vacancy =
    state.vacancies.find(
      item => item.id === vacancyId
    );

  if (!vacancy) return;

  const confirmed =
    confirm(
      `Excluir a vaga "${vacancyCharacter(vacancy)}"?`
    );

  if (!confirmed) return;

  try {
    await db
      .collection("vagas")
      .doc(vacancyId)
      .delete();

    await createLog(
      "Exclusão de vaga",
      `${vacancyCharacter(vacancy)} — ${vacancyWork(vacancy)}`
    );

    await refreshAll();

  } catch (error) {
    console.error(
      "Erro excluindo vaga:",
      error
    );

    alert(
      "Não foi possível excluir a vaga."
    );
  }
}


/* =========================================================
   39. MODAL DE VAGA
   ========================================================= */

function closeVacancyModal() {
  const modal =
    $("vacancyModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.removeAttribute("data-editing");

  const characterInput =
    $("vacancyCharacter") ||
    $("editCharacter");

  const workInput =
    $("vacancyWork") ||
    $("editWork");

  if (characterInput) {
    characterInput.value = "";
  }

  if (workInput) {
    workInput.value = "";
  }
}

function openNewVacancyModal() {
  const modal =
    $("vacancyModal");

  if (!modal) return;

  modal.removeAttribute(
    "data-editing"
  );

  modal.classList.remove(
    "hidden"
  );
}


/* =========================================================
   40. CHAT — ENVIAR
   ========================================================= */

async function sendAdminChat() {
  if (!db) return;

  const input =
    $("chatInput") ||
    $("adminChatInput");

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  try {
    await db
      .collection("adminChat")
      .add({
        message,

        adminName:
          state.admin?.name ||
          "ADM",

        adminCode:
          state.admin?.code ||
          null,

        createdAt:
          getTimestamp()
      });

    input.value = "";

    state.chat =
      await getCollection(
        "adminChat"
      );

    renderChat();

  } catch (error) {
    console.error(
      "Erro no chat:",
      error
    );
  }
}


/* =========================================================
   41. NAVEGAÇÃO ADM
   ========================================================= */

function showView(view) {
  state.currentView =
    view || "home";

  const views =
    document.querySelectorAll(
      "[data-view]"
    );

  views.forEach(element => {
    const matches =
      element.dataset.view ===
      state.currentView;

    element.classList.toggle(
      "active",
      matches
    );

    element.classList.toggle(
      "hidden",
      !matches
    );
  });

  const navItems =
    document.querySelectorAll(
      "[data-nav]"
    );

  navItems.forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.nav ===
        state.currentView
    );
  });
}


/* =========================================================
   42. EVENTOS GERAIS
   ========================================================= */

function bindEvents() {

  /* -------------------------
     LOGIN
     ------------------------- */

  const loginButton =
    $("loginBtn");

  if (loginButton) {
    loginButton.addEventListener(
      "click",
      loginAdmin
    );
  }

  const adminCode =
    $("adminCode");

  if (adminCode) {
    adminCode.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          loginAdmin();
        }
      }
    );
  }


  /* -------------------------
     LOGOUT
     ------------------------- */

  const logout =
    $("logoutBtn") ||
    $("logoutButton");

  if (logout) {
    logout.addEventListener(
      "click",
      logoutAdmin
    );
  }


  /* -------------------------
     INDEX — FICHA
     ------------------------- */

  const requestForm =
    $("requestForm");

  if (requestForm) {
    requestForm.addEventListener(
      "submit",
      submitRequestForm
    );
  }


  /* -------------------------
     INDEX — TROCA
     ------------------------- */

  const exchangeForm =
    $("exchangeForm");

  if (exchangeForm) {
    exchangeForm.addEventListener(
      "submit",
      submitExchangeForm
    );
  }


  /* -------------------------
     PREVIEWS
     ------------------------- */

  setupImagePreview(
    "requestPhoto",
    "requestPhotoPreview",
    "requestPhotoPlaceholder"
  );

  setupImagePreview(
    "exchangePhoto",
    "exchangePhotoPreview",
    "exchangePhotoPlaceholder"
  );

  setupImagePreview(
    "vacancyPhoto",
    "vacancyPhotoPreview",
    "vacancyPhotoPlaceholder"
  );

  setupImagePreview(
    "editPhoto",
    "editPhotoPreview",
    "editPhotoPlaceholder"
  );


  /* -------------------------
     BUSCA MEMBROS
     ------------------------- */

  const memberSearch =
    $("memberSearch");

  if (memberSearch) {
    memberSearch.addEventListener(
      "input",
      filterPublicMembers
    );
  }


  /* -------------------------
     NAVEGAÇÃO ADM
     ------------------------- */

  document
    .querySelectorAll("[data-nav]")
    .forEach(item => {
      item.addEventListener(
        "click",
        event => {
          event.preventDefault();

          showView(
            item.dataset.nav
          );
        }
      );
    });


  /* -------------------------
     BOTÃO NOVA VAGA
     ------------------------- */

  const newVacancy =
    $("newVacancyBtn") ||
    $("addVacancyBtn") ||
    $("openVacancyModal");

  if (newVacancy) {
    newVacancy.addEventListener(
      "click",
      openNewVacancyModal
    );
  }


  /* -------------------------
     SALVAR VAGA
     ------------------------- */

  const saveButton =
    $("saveVacancyBtn") ||
    $("saveVacancy");

  if (saveButton) {
    saveButton.addEventListener(
      "click",
      () => {
        const modal =
          $("vacancyModal");

        const editing =
          modal?.dataset.editing ||
          null;

        saveVacancy(editing);
      }
    );
  }


  /* -------------------------
     FECHAR MODAL
     ------------------------- */

  const closeModal =
    $("closeVacancyModal") ||
    $("cancelVacancyBtn");

  if (closeModal) {
    closeModal.addEventListener(
      "click",
      closeVacancyModal
    );
  }


  /* -------------------------
     ENVIAR CHAT
     ------------------------- */

  const sendChat =
    $("sendChatBtn") ||
    $("sendAdminChat");

  if (sendChat) {
    sendChat.addEventListener(
      "click",
      sendAdminChat
    );
  }

  const chatInput =
    $("chatInput") ||
    $("adminChatInput");

  if (chatInput) {
    chatInput.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          sendAdminChat();
        }
      }
    );
  }


  /* =======================================================
     EVENTOS DINÂMICOS
     ======================================================= */

  document.addEventListener(
    "click",
    event => {

      /* APROVAR */

      const approve =
        event.target.closest(
          "[data-approve]"
        );

      if (approve) {
        event.preventDefault();

        const id =
          approve.dataset.approve;

        if (id) {
          approveRequest(id);
        }

        return;
      }


      /* RECUSAR */

      const reject =
        event.target.closest(
          "[data-reject]"
        );

      if (reject) {
        event.preventDefault();

        const id =
          reject.dataset.reject;

        if (id) {
          rejectRequest(id);
        }

        return;
      }


      /* EDITAR VAGA */

      const edit =
        event.target.closest(
          "[data-edit-vacancy]"
        );

      if (edit) {
        event.preventDefault();

        editVacancy(
          edit.dataset.editVacancy
        );

        return;
      }


      /* ABRIR/FECHAR VAGA */

      const toggle =
        event.target.closest(
          "[data-toggle-vacancy]"
        );

      if (toggle) {
        event.preventDefault();

        toggleVacancy(
          toggle.dataset.toggleVacancy
        );

        return;
      }


      /* EXCLUIR VAGA */

      const remove =
        event.target.closest(
          "[data-delete-vacancy]"
        );

      if (remove) {
        event.preventDefault();

        deleteVacancy(
          remove.dataset.deleteVacancy
        );

        return;
      }

    }
  );
}


/* =========================================================
   43. SESSÃO ADM
   ========================================================= */

async function startAdminSession() {
  if (!state.admin) return;

  try {
    await ensureAnonymousAuth();
  } catch {}

  try {
    await createLog(
      "Entrada no painel",
      `${state.admin.name} entrou no painel ADM.`
    );
  } catch {}
}


/* =========================================================
   44. BOOT PÚBLICO
   ========================================================= */

async function bootPublic() {

  /*
    O loading NÃO depende do Firebase.
    Isso impede o Index de ficar preso.
  */

  bindEvents();

  /*
    Libera a página rapidamente.
  */
  setTimeout(
    finishPublicLoading,
    1000
  );

  /*
    Firebase roda em segundo plano.
  */
  ensureAnonymousAuth()
    .catch(() => {});

  /*
    Carrega dados sem bloquear
    o carregamento visual.
  */
  try {

    await Promise.race([
      loadPublicData(),

      new Promise(resolve =>
        setTimeout(
          resolve,
          5000
        )
      )
    ]);

  } catch (error) {
    console.warn(
      "Dados públicos:",
      error
    );
 
