/* =========================================================
   HOUSE LTD
   APP.JS — ADMINISTRAÇÃO
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


/* =========================================================
   CLOUDINARY
   ========================================================= */

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/gsqmelxb/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
  "House LTD";


/* =========================================================
   ADMINS
   ========================================================= */

const ADMIN_ACCOUNTS = {

  YM7JQ7: {
    name: "Aiko",
    role: "Dono"
  },

  YQ7NM4: {
    name: "Noah",
    role: "Sub-dono"
  },

  JM7XQ8: {
    name: "Shime",
    role: "Líder de ADM"
  },

  Y7KQ2M: {
    name: "Shiro",
    role: "ADM"
  },

  M7IQY5: {
    name: "Isa",
    role: "Staff"
  },

  QY7MH3: {
    name: "Mah",
    role: "ADM"
  },

  Y4JQ7L: {
    name: "Luan",
    role: "ADM"
  },

  K7YQ9M: {
    name: "Ayrken",
    role: "ADM"
  },

  YM4QX7: {
    name: "Evan",
    role: "ADM"
  },

  Q7YTM5: {
    name: "Tamsy",
    role: "ADM"
  },

  JY7QK6: {
    name: "Lucca",
    role: "ADM"
  },

  YQ5M7X: {
    name: "Kally",
    role: "ADM"
  },

  TH1K0L: {
    name: "Lici",
    role: "ADM"
  },

  FB61K5: {
    name: "Belly",
    role: "ADM"
  }

};


/* =========================================================
   FIREBASE
   ========================================================= */

firebase.initializeApp(firebaseConfig);

const db =
  firebase.firestore();

const auth =
  firebase.auth();


/* =========================================================
   ESTADO
   ========================================================= */

const state = {

  admin: null,

  editVacancyId: null,

  requests: [],

  vacancies: [],

  members: [],

  admins: [],

  chat: [],

  logs: []

};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function esc(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

}


function toast(message) {

  const element =
    $("toast");

  if (!element) return;

  element.textContent =
    message;

  element.classList.remove(
    "hidden"
  );

  clearTimeout(
    window.__toastTimer
  );

  window.__toastTimer =
    setTimeout(() => {

      element.classList.add(
        "hidden"
      );

    }, 3000);

}


function setLoginMessage(
  message,
  success = false
) {

  const element =
    $("loginMsg");

  if (!element) return;

  element.textContent =
    message;

  element.style.color =
    success
      ? "#67e6a7"
      : "#ff9aac";

}


function normalizeCode(
  value
) {

  return String(value || "")
    .trim()
    .toUpperCase();

}


/* =========================================================
   SESSÃO
   ========================================================= */

function getStoredAdmin() {

  try {

    return JSON.parse(
      sessionStorage.getItem(
        "houseLTDAdmin"
      ) || "null"
    );

  } catch {

    return null;

  }

}


function saveStoredAdmin(
  admin
) {

  sessionStorage.setItem(
    "houseLTDAdmin",
    JSON.stringify(admin)
  );

}


function clearStoredAdmin() {

  sessionStorage.removeItem(
    "houseLTDAdmin"
  );

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

  const code =
    normalizeCode(
      $("adminCode")?.value
    );

  const admin =
    ADMIN_ACCOUNTS[code];


  if (!admin) {

    setLoginMessage(
      "Código inválido."
    );

    return;

  }


  state.admin = {
    ...admin,
    code
  };


  saveStoredAdmin(
    state.admin
  );


  /*
    Tenta criar uma sessão Firebase anônima.
    O login por código é feito pelo painel.
  */

  try {

    if (!auth.currentUser) {

      await auth.signInAnonymously();

    }

  } catch (error) {

    console.warn(
      "Firebase Auth:",
      error
    );

  }


  showApp();


  await ensureAdminProfile();

  await logAction(
    "login",
    "Entrada no painel"
  );

  await refreshAll();

}


function logout() {

  clearStoredAdmin();

  location.reload();

}


/* =========================================================
   MOSTRAR PAINEL
   ========================================================= */

function showApp() {

  $("loginView")
    ?.classList
    .add("hidden");

  $("appView")
    ?.classList
    .remove("hidden");


  $("meName").textContent =
    state.admin?.name ||
    "ADM";


  $("meRole").textContent =
    state.admin?.role ||
    "";

}


/* =========================================================
   PERFIL ADM
   ========================================================= */

async function ensureAdminProfile() {

  if (!state.admin)
    return;


  try {

    const query =
      await db
        .collection("adminProfiles")
        .where(
          "name",
          "==",
          state.admin.name
        )
        .limit(1)
        .get();


    if (query.empty) {

      await db
        .collection("adminProfiles")
        .add({

          name:
            state.admin.name,

          role:
            state.admin.role,

          status:
            true,

          createdAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });

    }

  } catch (error) {

    console.warn(
      "adminProfiles:",
      error
    );

  }

}


/* =========================================================
   LOGS
   ========================================================= */

async function logAction(
  action,
  details
) {

  try {

    await db
      .collection("accessLogs")
      .add({

        admin:
          state.admin?.name ||
          "Desconhecido",

        role:
          state.admin?.role ||
          "",

        action,

        details,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

  } catch (error) {

    console.warn(
      "log:",
      error
    );

  }

}


/* =========================================================
   DATAS
   ========================================================= */

function dateValue(data) {

  const raw =
    data?.createdAt ||
    data?.date ||
    data?.updatedAt;


  if (!raw)
    return 0;


  if (
    typeof raw.toMillis ===
    "function"
  ) {

    return raw.toMillis();

  }


  const date =
    new Date(raw);


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

}


function formatDate(data) {

  const value =
    dateValue(data);


  if (!value)
    return "—";


  return new Date(
    value
  ).toLocaleString(
    "pt-BR"
  );

}


/* =========================================================
   STATUS
   ========================================================= */

function statusIsOpen(
  vacancy
) {

  const status =
    String(
      vacancy?.status ||
      vacancy?.estado ||
      ""
    ).toLowerCase();


  return (

    status === "aberta" ||

    status === "aberto" ||

    status === "open" ||

    status === "livre"

  );

}


function statusIsPending(
  request
) {

  const status =
    String(
      request?.status ||
      ""
    ).toLowerCase();


  return (

    !status ||

    status === "pendente" ||

    status === "pending"

  );

}


/* =========================================================
   LER COLEÇÃO
   ========================================================= */

async function getCollectionSafe(
  collectionName,
  orderField = null
) {

  try {

    let reference =
      db.collection(
        collectionName
      );


    if (orderField) {

      reference =
        reference.orderBy(
          orderField,
          "desc"
        );

    }


    const snapshot =
      await reference.get();


    return snapshot.docs.map(
      document => ({

        id:
          document.id,

        ref:
          document.ref,

        ...document.data()

      })
    );


  } catch (error) {

    console.warn(
      `Coleção ${collectionName}:`,
      error
    );

    return [];

  }

}


/* =========================================================
   SOLICITAÇÕES
   ========================================================= */

async function loadRequests() {

  let rows =
    await getCollectionSafe(
      "characterRequests",
      "createdAt"
    );


  /*
    Compatibilidade com
    instalações antigas.
  */

  if (!rows.length) {

    rows =
      await getCollectionSafe(
        "requests",
        "createdAt"
      );

  }


  state.requests =
    rows.filter(
      statusIsPending
    );

}


/* =========================================================
   VAGAS
   ========================================================= */

async function loadVacancies() {

  let rows =
    await getCollectionSafe(
      "vagas",
      "createdAt"
    );


  if (!rows.length) {

    rows =
      await getCollectionSafe(
        "occupiedCharacters",
        "createdAt"
      );

  }


  state.vacancies =
    rows;

}


/* =========================================================
   MEMBROS
   ========================================================= */

async function loadMembers() {

  state.members =
    await getCollectionSafe(
      "members",
      "createdAt"
    );

}


/* =========================================================
   ADMINS
   ========================================================= */

async function loadAdmins() {

  const rows =
    await getCollectionSafe(
      "adminProfiles",
      "createdAt"
    );


  const byName =
    new Map(
      rows.map(
        item => [
          String(
            item.name || ""
          ).toLowerCase(),

          item
        ]
      )
    );


  state.admins =
    Object.entries(
      ADMIN_ACCOUNTS
    ).map(
      ([code, base]) => {

        const saved =
          byName.get(
            base.name.toLowerCase()
          ) || {};


        return {

          ...base,

          ...saved,

          code

        };

      }
    );

}


/* =========================================================
   CHAT
   ========================================================= */

async function loadChat() {

  state.chat =
    await getCollectionSafe(
      "adminChat",
      "createdAt"
    );

}


/* =========================================================
   LOGS
   ========================================================= */

async function loadLogs() {

  state.logs =
    await getCollectionSafe(
      "accessLogs",
      "createdAt"
    );

}


/* =========================================================
   ATUALIZAR TUDO
   ========================================================= */

async function refreshAll() {

  await Promise.all([

    loadRequests(),

    loadVacancies(),

    loadMembers(),

    loadAdmins(),

    loadChat(),

    loadLogs()

  ]);


  renderAll();

}


/* =========================================================
   RENDER
   ========================================================= */

function renderAll() {

  renderStats();

  renderRequests();

  renderVacancies();

  renderMembers();

  renderAdmins();

  renderChat();

  renderLogs();

  renderHome();

}


/* =========================================================
   ESTATÍSTICAS
   ========================================================= */

function renderStats() {

  const open =
    state.vacancies
      .filter(
        statusIsOpen
      ).length;


  const closed =
    state.vacancies.length -
    open;


  $("statRequests")
    .textContent =
    state.requests.length;


  $("statOpen")
    .textContent =
    open;


  $("statClosed")
    .textContent =
    closed;


  $("statMembers")
    .textContent =
    state.members.length;

}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

  const element =
    $("homeSummary");


  if (!element)
    return;


  element.innerHTML = `

    <div class="card">

      <span class="pill">
        Solicitações
      </span>

      <h3>
        ${state.requests.length}
      </h3>

      <span class="muted">
        aguardando análise
      </span>

    </div>


    <div class="card">

      <span class="pill">
        Vagas
      </span>

      <h3>
        ${
          state.vacancies
            .filter(statusIsOpen)
            .length
        }
      </h3>

      <span class="muted">
        disponíveis agora
      </span>

    </div>


    <div class="card">

      <span class="pill">
        Equipe
      </span>

      <h3>
        ${state.admins.length}
      </h3>

      <span class="muted">
        administradores cadastrados
      </span>

    </div>

  `;

}


/* =========================================================
   SOLICITAÇÕES — VISUAL
   ========================================================= */

function renderRequests() {

  const element =
    $("requestsList");


  if (!element)
    return;


  if (!state.requests.length) {

    element.innerHTML = `
      <div class="empty">
        Nenhuma solicitação pendente.
      </div>
    `;

    return;

  }


  element.innerHTML =
    state.requests
      .map(request => `

        <div
          class="card"
          style="margin-bottom:10px"
        >

          <div class="row">

            <div>

              <h3>
                ${
                  esc(
                    request.name ||
                    request.nickname ||
                    "Sem nome"
                  )
                }
              </h3>

              <span class="muted">

                ${
                  esc(
                    request.character ||
                    request.personagem ||
                    "—"
                  )
                }

                •

                ${
                  esc(
                    request.work ||
                    request.obra ||
                    "—"
                  )
                }

              </span>

            </div>


            ${
              request.photo

                ? `

                  <img
                    class="avatar"
                    src="${esc(request.photo)}"
                    alt=""
                  >

                `

                : ""
            }

          </div>


          <p class="muted">

            Idade:
            ${
              esc(
                request.age ||
                request.idade ||
                "—"
              )
            }

            •

            Últimos 4 dígitos:
            ${
              esc(
                request.phoneLast4 ||
                request.last4 ||
                request.ultimos4 ||
                "—"
              )
            }

          </p>


          <p class="muted">

            Enviado:
            ${formatDate(request)}

          </p>


          <div class="actions">

            <button
              class="btn"
              data-approve="${esc(request.id)}"
            >
              Aceitar
            </button>


            <button
              class="btn danger"
              data-reject="${esc(request.id)}"
            >
              Recusar
            </button>

          </div>

        </div>

      `)
      .join("");

}


/* =========================================================
   VAGAS — VISUAL
   ========================================================= */

function renderVacancies() {

  const element =
    $("vacanciesList");


  if (!element)
    return;


  if (!state.vacancies.length) {

    element.innerHTML = `
      <div class="empty">
        Nenhuma vaga cadastrada.
      </div>
    `;

    return;

  }


  element.innerHTML =
    state.vacancies
      .map(vacancy => {

        const open =
          statusIsOpen(
            vacancy
          );


        /*
          IMPORTANTE:
          personagem e obra são
          campos separados.
        */

        const character =
          vacancy.character ||
          vacancy.personagem ||
          vacancy.name ||
          "Sem personagem";


        const work =
          vacancy.work ||
          vacancy.obra ||
          "Sem obra";


        return `

          <div class="card">

            ${
              vacancy.image ||
              vacancy.photo

                ? `

                  <img
                    class="cover"
                    src="${
                      esc(
                        vacancy.image ||
                        vacancy.photo
                      )
                    }"
                    alt=""
                  >

                `

                : ""
            }


            <div class="row">

              <h3>
                ${esc(character)}
              </h3>

              <span class="pill">

                ${
                  open
                    ? "Aberta"
                    : "Fechada"
                }

              </span>

            </div>


            <div class="muted">

              ${esc(work)}

            </div>


            <div class="actions">

              <button
                class="btn ghost"
                data-edit-vac="${esc(vacancy.id)}"
              >
                Editar
              </button>


              <button
                class="btn ghost"
                data-toggle-vac="${esc(vacancy.id)}"
              >

                ${
                  open
                    ? "Fechar"
                    : "Abrir"
                }

              </button>


              <button
                class="btn danger"
                data-delete-vac="${esc(vacancy.id)}"
              >
                Excluir
              </button>

            </div>

          </div>

        `;

      })
      .join("");

}


/* =========================================================
   MEMBROS
   ========================================================= */

function renderMembers() {

  const element =
    $("membersList");


  if (!element)
    return;


  if (!state.members.length) {

    element.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty"
        >
          Nenhum membro aprovado.
        </td>
      </tr>
    `;

    return;

  }


  element.innerHTML =
    state.members
      .map(member => `

        <tr>

          <td>
            ${
              esc(
                member.name ||
                member.nickname ||
                "—"
              )
            }
          </td>


          <td>
            ${
              esc(
                member.age ||
                member.idade ||
                "—"
              )
            }
          </td>


          <td>
            ${
              esc(
                member.character ||
                member.personagem ||
                "—"
              )
            }
          </td>


          <td>
            ${
              esc(
                member.work ||
                member.obra ||
                "—"
              )
            }
          </td>


          <td>
            ${formatDate(member)}
          </td>

        </tr>

      `)
      .join("");

}


/* =========================================================
   ADMS
   ========================================================= */

function renderAdmins() {

  const element =
    $("adminsList");


  if (!element)
    return;


  element.innerHTML =
    state.admins
      .map(admin => `

        <div class="card">

          ${
            admin.cover

              ? `

                <img
                  class="cover"
                  src="${esc(admin.cover)}"
                  alt=""
                >

              `

              : ""
          }


          <div class="row">

            ${
              admin.photo

                ? `

                  <img
                    class="avatar"
                    src="${esc(admin.photo)}"
                    alt=""
                  >

                `

                : `

                  <div class="avatar"></div>

                `
            }


            <div style="flex:1">

              <h3>
                ${esc(admin.name)}
              </h3>

              <span class="muted">
                ${esc(admin.role)}
              </span>

            </div>

          </div>


          <div
            style="margin-top:12px"
            class="${
              admin.online
                ? "online"
                : "offline"
            }"
          >

            ${
              admin.online
                ? "● Online"
                : "● Offline"
            }

          </div>

        </div>

      `)
      .join("");

}


/* =========================================================
   CHAT
   ========================================================= */

function renderChat() {

  const element =
    $("chatList");


  if (!element)
    return;


  if (!state.chat.length) {

    element.innerHTML = `
      <div class="empty">
        Nenhuma mensagem ainda.
      </div>
    `;

    return;

  }


  element.innerHTML =
    state.chat
      .map(message => `

        <div
          class="card"
          style="margin-bottom:8px"
        >

          <div class="row">

            <strong>
              ${
                esc(
                  message.adminName ||
                  message.admin ||
                  "ADM"
                )
              }
            </strong>


            <span class="muted">
              ${formatDate(message)}
            </span>

          </div>


          <div style="margin-top:7px">

            ${
              esc(
                message.message ||
                ""
              )
            }

          </div>

        </div>

      `)
      .join("");


  element.scrollTop =
    element.scrollHeight;

}


/* =========================================================
   LOGS
   ========================================================= */

function renderLogs() {

  const element =
    $("logsList");


  if (!element)
    return;


  if (!state.logs.length) {

    element.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="empty"
        >
          Nenhum log.
        </td>
      </tr>
    `;

    return;

  }


  element.innerHTML =
    state.logs
      .slice(0,100)
      .map(log => `

        <tr>

          <td>
            ${formatDate(log)}
          </td>

          <td>
            ${esc(log.admin || "—")}
          </td>

          <td>
            ${esc(log.action || "—")}
          </td>

          <td>
            ${esc(log.details || "—")}
          </td>

        </tr>

      `)
      .join("");

}


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showView(
  name
) {

  document
    .querySelectorAll(".view")
    .forEach(view => {

      view.classList.remove(
        "active"
      );

    });


  document
    .querySelectorAll(".nav button")
    .forEach(button => {

      button.classList.remove(
        "active"
      );

    });


  $("view-" + name)
    ?.classList
    .add("active");


  document
    .querySelector(
      `.nav button[data-view="${name}"]`
    )
    ?.classList
    .add("active");


  const titles = {

    home: [
      "Início",
      "Visão geral da House LTD"
    ],

    requests: [
      "Solicitações",
      "Analise as fichas recebidas"
    ],

    vacancies: [
      "Vagas",
      "Controle de vagas abertas e fechadas"
    ],

    members: [
      "Membros",
      "Membros aprovados"
    ],

    admins: [
      "Administradores",
      "Equipe da House LTD"
    ],

    chat: [
      "Chat ADM",
      "Comunicação interna"
    ],

    logs: [
      "Logs",
      "Histórico de ações"
    ]

  };


  const title =
    titles[name] ||
    titles.home;


  $("pageTitle").textContent =
    title[0];


  $("pageSubtitle").textContent =
    title[1];

}


/* =========================================================
   APROVAR SOLICITAÇÃO
   ========================================================= */

async function approveRequest(
  id
) {

  const request =
    state.requests.find(
      item =>
        item.id === id
    );


  if (!request)
    return;


  const character =
    request.character ||
    request.personagem;


  const work =
    request.work ||
    request.obra;


  if (!character || !work) {

    toast(
      "A solicitação não possui personagem/obra."
    );

    return;

  }


  /*
    Procura a vaga aberta
    pelo personagem E pela obra.
  */

  const vacancy =
    state.vacancies.find(
      item =>

        String(
          item.character ||
          item.personagem ||
          item.name ||
          ""
        ).toLowerCase()
        ===
        String(
          character
        ).toLowerCase()

        &&

        String(
          item.work ||
          item.obra ||
          ""
        ).toLowerCase()
        ===
        String(
          work
        ).toLowerCase()

        &&

        statusIsOpen(item)
    );


  try {

    /* =========================
       CRIA MEMBRO
       ========================= */

    await db
      .collection("members")
      .add({

        name:
          request.name ||
          request.nickname ||
          "",

        age:
          request.age ||
          request.idade ||
          "",

        character,

        work,

        photo:
          request.photo ||
          "",

        approvedBy:
          state.admin.name,

        approvedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    /* =========================
       FECHA VAGA
       ========================= */

    if (vacancy?.ref) {

      await vacancy.ref.update({

        status:
          "fechada",

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        occupiedBy:
          request.name ||
          request.nickname ||
          ""

      });

    }


    /* =========================
       ATUALIZA SOLICITAÇÃO
       ========================= */

    const collection =
      await findRequestCollection(
        id
      );


    if (collection) {

      await db
        .collection(collection)
        .doc(id)
        .update({

          status:
            "aprovado",

          approvedBy:
            state.admin.name,

          approvedAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });

    }


    await logAction(
      "aprovar_solicitacao",
      `${character} • ${work}`
    );


    toast(
      "Solicitação aprovada."
    );


    await refreshAll();


  } catch (error) {

    console.error(error);

    toast(
      "Não foi possível aprovar. Verifique as regras do Firestore."
    );

  }

}


/* =========================================================
   RECUSAR
   ========================================================= */

async function rejectRequest(
  id
) {

  try {

    const collection =
      await findRequestCollection(
        id
      );


    if (!collection)
      return;


    await db
      .collection(collection)
      .doc(id)
      .update({

        status:
          "recusado",

        rejectedBy:
          state.admin.name,

        rejectedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    await logAction(
      "recusar_solicitacao",
      id
    );


    toast(
      "Solicitação recusada."
    );


    await refreshAll();


  } catch (error) {

    console.error(error);

    toast(
      "Não foi possível recusar."
    );

  }

}


/* =========================================================
   ENCONTRAR SOLICITAÇÃO
   ========================================================= */

async function findRequestCollection(
  id
) {

  try {

    const first =
      await db
        .collection(
          "characterRequests"
        )
        .doc(id)
        .get();


    if (first.exists)
      return "characterRequests";

  } catch {}


  try {

    const second =
      await db
        .collection(
          "requests"
        )
        .doc(id)
        .get();


    if (second.exists)
      return "requests";

  } catch {}


  return null;

}


/* =========================================================
   MODAL DE VAGA
   ========================================================= */

function openVacancyModal(
  id = null
) {

  state.editVacancyId =
    id;


  const vacancy =
    id
      ? state.vacancies.find(
          item =>
            item.id === id
        )
      : null;


  $("modalTitle")
    .textContent =
    vacancy
      ? "Editar vaga"
      : "Nova vaga";


  $("vacCharacter").value =
    vacancy?.character ||
    vacancy?.personagem ||
    vacancy?.name ||
    "";


  $("vacWork").value =
    vacancy?.work ||
    vacancy?.obra ||
    "";


  $("vacImage").value =
    vacancy?.image ||
    vacancy?.photo ||
    "";


  $("vacStatus").value =
    statusIsOpen(vacancy)
      ? "aberta"
      : "fechada";


  $("vacMsg").textContent =
    "";


  $("modal")
    .classList
    .add("open");

}


function closeVacancyModal() {

  $("modal")
    .classList
    .remove("open");


  state.editVacancyId =
    null;

}


/* =========================================================
   SALVAR VAGA
   ========================================================= */

async function saveVacancy() {

  const character =
    $("vacCharacter")
      .value
      .trim();


  const work =
    $("vacWork")
      .value
      .trim();


  const image =
    $("vacImage")
      .value
      .trim();


  const status =
    $("vacStatus")
      .value;


  if (!character || !work) {

    $("vacMsg")
      .textContent =
      "Personagem e obra são obrigatórios.";

    return;

  }


  try {

    const data = {

      character,

      work,

      image,

      status,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    };


    if (state.editVacancyId) {

      await db
        .collection("vagas")
        .doc(
          state.editVacancyId
        )
        .update(data);


      await logAction(
        "editar_vaga",
        `${character} • ${work}`
      );


      toast(
        "Vaga atualizada."
      );

    } else {

      await db
        .collection("vagas")
        .add({

          ...data,

          createdAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });


      await logAction(
        "criar_vaga",
        `${character} • ${work}`
      );


      toast(
        "Vaga criada."
      );

    }


    closeVacancyModal();

    await refreshAll();


  } catch (error) {

    console.error(error);

    $("vacMsg")
      .textContent =
      "Erro ao salvar. Verifique as regras do Firestore.";

  }

}


/* =========================================================
   ABRIR / FECHAR VAGA
   ========================================================= */

async function toggleVacancy(
  id
) {

  const vacancy =
    state.vacancies.find(
      item =>
        item.id === id
    );


  if (!vacancy)
    return;


  const nextStatus =
    statusIsOpen(vacancy)
      ? "fechada"
      : "aberta";


  try {

    await db
      .collection("vagas")
      .doc(id)
      .update({

        status:
          nextStatus,

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    await logAction(

      nextStatus === "aberta"
        ? "abrir_vaga"
        : "fechar_vaga",

      `${

        vacancy.character ||
        vacancy.personagem ||

        "Sem personagem"

      } • ${

        vacancy.work ||
        vacancy.obra ||

        "Sem obra"

      }`

    );


    toast(

      nextStatus === "aberta"
        ? "Vaga aberta."
        : "Vaga fechada."

    );


    await refreshAll();


  } catch (error) {

    console.error(error);

    toast(
      "Não foi possível alterar a vaga."
    );

  }

}


/* =========================================================
   EXCLUIR VAGA
   ========================================================= */

async function deleteVacancy(
  id
) {

  const vacancy =
    state.vacancies.find(
      item =>
        item.id === id
    );


  if (!vacancy)
    return;


  const name =
    vacancy.character ||
    vacancy.personagem ||
    vacancy.name ||
    "esta vaga";


  if (
    !confirm(
      `Excluir a vaga "${name}"?`
    )
  ) {

    return;

  }


  try {

    await db
      .collection("vagas")
      .doc(id)
      .delete();


    await logAction(
      "excluir_vaga",
      name
    );


    toast(
      "Vaga excluída."
    );


    await refreshAll();


  } catch (error) {

    console.error(error);

    toast(
      "Não foi possível excluir."
    );

  }

}


/* =========================================================
   CHAT
   ========================================================= */

async function sendChat() {

  const input =
    $("chatInput");


  const message =
    input.value.trim();


  if (!message)
    return;


  try {

    await db
      .collection("adminChat")
      .add({

        adminName:
          state.admin.name,

        adminRole:
          state.admin.role,

        message,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    input.value =
      "";


    await loadChat();

    renderChat();


  } catch (error) {

    console.error(error);

    toast(
      "Não foi possível enviar a mensagem."
    );

  }

}


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(
  file
) {

  if (!file)
    return "";


  const form =
    new FormData();


  form.append(
    "file",
    file
  );


  form.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );


  const response =
    await fetch(
      CLOUDINARY_UPLOAD_URL,
      {
        method: "POST",
        body: form
      }
    );


  if (!response.ok) {

    throw new Error(
      "Falha no Cloudinary"
    );

  }


  const data =
    await response.json();


  return (
    data.secure_url ||
    data.url ||
    ""
  );

}


/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener(
  "click",
  async event => {

    const navigation =
      event.target.closest(
        "[data-view]"
      );


    if (navigation) {

      showView(
        navigation.dataset.view
      );

    }


    const approve =
      event.target.closest(
        "[data-approve]"
      );


    if (approve) {

      await approveRequest(
        approve.dataset.approve
      );

    }


    const reject =
      event.target.closest(
        "[data-reject]"
      );


    if (reject) {

      await rejectRequest(
        reject.dataset.reject
      );

    }


    const edit =
      event.target.closest(
        "[data-edit-vac]"
      );


    if (edit) {

      openVacancyModal(
        edit.dataset.editVac
      );

    }


    const toggle =
      event.target.closest(
        "[data-toggle-vac]"
      );


    if (toggle) {

      await toggleVacancy(
        toggle.dataset.toggleVac
      );

    }


    const deleteButton =
      event.target.closest(
        "[data-delete-vac]"
      );


    if (deleteButton) {

      await deleteVacancy(
        deleteButton.dataset.deleteVac
      );

    }


    const refresh =
      event.target.closest(
        "[data-refresh-section]"
      );


    if (refresh) {

      await refreshAll();

    }

  }
);


/* =========================================================
   BOTÕES
   ========================================================= */

$("loginBtn")
  ?.addEventListener(
    "click",
    login
  );


$("adminCode")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        login();

      }

    }
  );


$("logoutBtn")
  ?.addEventListener(
    "click",
    logout
  );


$("refreshBtn")
  ?.addEventListener(
    "click",
    async () => {

      await refreshAll();

      toast(
        "Painel atualizado."
      );

    }
  );


$("newVacancyBtn")
  ?.addEventListener(
    "click",
    () =>
      openVacancyModal()
  );


$("closeModal")
  ?.addEventListener(
    "click",
    closeVacancyModal
  );


$("saveVacancyBtn")
  ?.addEventListener(
    "click",
    saveVacancy
  );


$("sendChatBtn")
  ?.addEventListener(
    "click",
    sendChat
  );


$("chatInput")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        sendChat();

      }

    }
  );


$("modal")
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("modal")
      ) {

        closeVacancyModal();

      }

    }
  );


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

(async function boot() {

  const saved =
    getStoredAdmin();


  if (
    !saved ||
    !ADMIN_ACCOUNTS[saved.code]
  ) {

    return;

  }


  state.admin =
    saved;


  showApp();


  try {

    if (!auth.currentUser) {

      await auth
        .signInAnonymously();

    }

  } catch (error) {

    console.warn(
      "Firebase Auth:",
      error
    );

  }


  await refreshAll();

})();
