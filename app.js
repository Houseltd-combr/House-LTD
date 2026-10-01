/* =========================================================
   HOUSE LTD
   SISTEMA PRINCIPAL
   Firebase + Firestore + Cloudinary
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyCRUNymKVh-UxKkSvNEUZkAjmRi_4_AQU",

  authDomain:
    "house-ltd.firebaseapp.com",

  projectId:
    "house-ltd",

  storageBucket:
    "house-ltd.firebasestorage.app",

  messagingSenderId:
    "821811124213",

  appId:
    "1:821811124213:web:c8dd2b2f1e1a41bcd632bc",

  measurementId:
    "G-P28WHBV9VB"

};


/* =========================================================
   CLOUDINARY
   ========================================================= */

const CLOUDINARY_CLOUD_NAME =
  "gsqmelxb";

const CLOUDINARY_UPLOAD_PRESET =
  "House LTD";

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/gsqmelxb/image/upload";


/* =========================================================
   FIREBASE INIT
   ========================================================= */

let db = null;
let auth = null;

try {

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.firestore();
  auth = firebase.auth();

} catch (error) {

  console.error(
    "Erro ao iniciar Firebase:",
    error
  );

}


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) =>
  document.getElementById(id);


function normalize(value) {

  return String(value || "")
    .trim()
    .toLocaleLowerCase("pt-BR");

}


function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatDate(timestamp) {

  if (!timestamp) {
    return "Data não disponível";
  }

  try {

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short"
      }
    );

  } catch {

    return "Data não disponível";

  }

}


function vacancyStatus(data) {

  const status =
    normalize(data.status);

  if (
    status === "fechada" ||
    status === "fechado" ||
    status === "closed"
  ) {

    return "fechada";

  }

  return "aberta";

}


function showStatus(element, message, type = "") {

  if (!element) return;

  element.textContent = message;

  element.className =
    `form-status ${type}`;

}


function isFirebaseReady() {

  if (!db || !auth) {

    alert(
      "O Firebase não foi inicializado corretamente."
    );

    return false;

  }

  return true;

}


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadImage(file) {

  if (!file) {
    throw new Error(
      "Nenhuma imagem foi selecionada."
    );
  }


  if (!file.type.startsWith("image/")) {

    throw new Error(
      "O arquivo precisa ser uma imagem."
    );

  }


  if (file.size > 8 * 1024 * 1024) {

    throw new Error(
      "A imagem deve ter no máximo 8 MB."
    );

  }


  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );


  const response =
    await fetch(
      CLOUDINARY_UPLOAD_URL,
      {
        method: "POST",
        body: formData
      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.secure_url
  ) {

    throw new Error(
      data?.error?.message ||
      "Erro ao enviar imagem para o Cloudinary."
    );

  }


  return data.secure_url;

}


/* =========================================================
   PREVIEW
   ========================================================= */

function setupPreview(
  inputId,
  imageId,
  placeholderId
) {

  const input = $(inputId);
  const image = $(imageId);
  const placeholder = $(placeholderId);

  if (!input) return;


  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0];

      if (!file) {

        image.style.display =
          "none";

        placeholder.style.display =
          "block";

        return;

      }


      const url =
        URL.createObjectURL(file);

      image.src = url;

      image.style.display =
        "block";

      placeholder.style.display =
        "none";

    }
  );

}


/* =========================================================
   VAGAS PÚBLICAS
   ========================================================= */

async function loadPublicVacancies() {

  if (!db) return;


  const openContainer =
    $("openVacancies");

  const closedContainer =
    $("closedVacancies");


  try {

    const snapshot =
      await db
        .collection("vagas")
        .get();


    const vacancies =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );


    const open =
      vacancies.filter(
        item =>
          vacancyStatus(item) === "aberta"
      );


    const closed =
      vacancies.filter(
        item =>
          vacancyStatus(item) === "fechada"
      );


    renderPublicVacancies(
      openContainer,
      open,
      false
    );


    renderPublicVacancies(
      closedContainer,
      closed,
      true
    );


  } catch (error) {

    console.error(error);

    openContainer.innerHTML =
      `<div class="empty-card">
        Não foi possível carregar as vagas.
      </div>`;

    closedContainer.innerHTML =
      `<div class="empty-card">
        Não foi possível carregar as vagas.
      </div>`;

  }

}


function renderPublicVacancies(
  container,
  vacancies,
  closed
) {

  if (!container) return;


  if (!vacancies.length) {

    container.innerHTML =
      `<div class="empty-card">
        ${
          closed
            ? "Nenhuma vaga fechada."
            : "Nenhuma vaga aberta no momento."
        }
      </div>`;

    return;

  }


  container.innerHTML =
    vacancies
      .map(vacancy => {

        const photo =
          vacancy.foto ||
          vacancy.photo ||
          "https://placehold.co/600x800/130b10/ffffff?text=LTD";


        return `

          <article class="vacancy-card">

            <img
              class="card-image"
              src="${escapeHTML(photo)}"
              alt="${escapeHTML(vacancy.personagem)}"
              loading="lazy"
            >

            <div class="card-content">

              <h3>
                ${escapeHTML(
                  vacancy.personagem ||
                  "Personagem"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  vacancy.obra ||
                  "Obra não informada"
                )}
              </p>

              <span class="status ${
                closed
                  ? "closed"
                  : "open"
              }">

                ${
                  closed
                    ? "OCUPADO"
                    : "DISPONÍVEL"
                }

              </span>

            </div>

          </article>

        `;

      })
      .join("");

}


/* =========================================================
   VERIFICAR VAGA
   ========================================================= */

async function findOpenVacancy(
  personagem,
  obra
) {

  const snapshot =
    await db
      .collection("vagas")
      .get();


  return snapshot.docs.find(
    doc => {

      const data =
        doc.data();

      return (
        normalize(data.personagem) ===
          normalize(personagem) &&

        normalize(data.obra) ===
          normalize(obra) &&

        vacancyStatus(data) ===
          "aberta"
      );

    }
  );

}


/* =========================================================
   SOLICITAÇÃO
   ========================================================= */

async function submitRequest(event) {

  event.preventDefault();


  const status =
    $("requestStatus");


  if (!isFirebaseReady()) return;


  try {

    const nome =
      $("requestName").value.trim();

    const idade =
      $("requestAge").value.trim();

    const telefone =
      $("requestPhone").value.trim();

    const personagem =
      $("requestCharacter").value.trim();

    const obra =
      $("requestWork").value.trim();

    const mensagem =
      $("requestMessage").value.trim();

    const file =
      $("requestPhoto").files?.[0];


    if (!/^[0-9]{4}$/.test(telefone)) {

      throw new Error(
        "Digite exatamente os últimos 4 dígitos do telefone."
      );

    }


    if (!file) {

      throw new Error(
        "A foto do personagem é obrigatória."
      );

    }


    const vacancy =
      await findOpenVacancy(
        personagem,
        obra
      );


    if (!vacancy) {

      throw new Error(
        "Esse personagem não possui uma vaga aberta."
      );

    }


    showStatus(
      status,
      "Enviando imagem..."
    );


    const photo =
      await uploadImage(file);


    showStatus(
      status,
      "Salvando ficha..."
    );


    await db
      .collection("characterRequests")
      .add({

        tipo: "nova",

        nome,

        idade,

        telefone4: telefone,

        personagem,

        obra,

        foto: photo,

        mensagem,

        status: "pendente",

        vacancyId:
          vacancy.id,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    showStatus(
      status,
      "Ficha enviada com sucesso! Aguarde a análise da administração.",
      "success"
    );


    $("requestForm").reset();


    $("requestPhotoPreview")
      .style.display = "none";

    $("requestPhotoPlaceholder")
      .style.display = "block";


  } catch (error) {

    console.error(error);

    showStatus(
      status,
      error.message ||
        "Não foi possível enviar a ficha.",
      "error"
    );

  }

}


/* =========================================================
   TROCA
   ========================================================= */

async function submitExchange(event) {

  event.preventDefault();


  const status =
    $("exchangeStatus");


  if (!isFirebaseReady()) return;


  try {

    const telefone =
      $("exchangePhone").value.trim();

    const antigo =
      $("exchangeOldCharacter").value.trim();

    const antigaObra =
      $("exchangeOldWork").value.trim();

    const novo =
      $("exchangeNewCharacter").value.trim();

    const novaObra =
      $("exchangeNewWork").value.trim();

    const file =
      $("exchangePhoto").files?.[0];


    if (!/^[0-9]{4}$/.test(telefone)) {

      throw new Error(
        "Digite os últimos 4 dígitos corretamente."
      );

    }


    if (!file) {

      throw new Error(
        "A nova foto é obrigatória."
      );

    }


    const newVacancy =
      await findOpenVacancy(
        novo,
        novaObra
      );


    if (!newVacancy) {

      throw new Error(
        "O novo personagem não está disponível."
      );

    }


    showStatus(
      status,
      "Enviando nova foto..."
    );


    const photo =
      await uploadImage(file);


    await db
      .collection("characterRequests")
      .add({

        tipo: "troca",

        telefone4: telefone,

        antigoPersonagem: antigo,

        antigaObra,

        personagem: novo,

        obra: novaObra,

        foto: photo,

        status: "pendente",

        newVacancyId:
          newVacancy.id,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    showStatus(
      status,
      "Solicitação de troca enviada para a administração.",
      "success"
    );


    $("exchangeForm").reset();


    $("exchangePhotoPreview")
      .style.display = "none";

    $("exchangePhotoPlaceholder")
      .style.display = "block";


  } catch (error) {

    console.error(error);

    showStatus(
      status,
      error.message ||
        "Não foi possível solicitar a troca.",
      "error"
    );

  }

}


/* =========================================================
   BUSCAR MEMBROS
   ========================================================= */

let membersCache = [];


async function loadMembers() {

  if (!db) return;


  try {

    const snapshot =
      await db
        .collection("members")
        .get();


    membersCache =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );


  } catch (error) {

    console.error(
      "Erro ao carregar membros:",
      error
    );

  }

}


function renderMembers(search = "") {

  const container =
    $("membersList");

  if (!container) return;


  const term =
    normalize(search);


  const members =
    membersCache.filter(
      member => {

        if (!term) {
          return false;
        }

        return (

          normalize(member.nome)
            .includes(term) ||

          normalize(member.personagem)
            .includes(term) ||

          normalize(member.obra)
            .includes(term)

        );

      }
    );


  if (!members.length) {

    container.innerHTML =
      `<div class="empty-card">
        ${
          term
            ? "Nenhum membro encontrado."
            : "Digite algo para pesquisar."
        }
      </div>`;

    return;

  }


  container.innerHTML =
    members
      .map(member => {

        const photo =
          member.foto ||
          "https://placehold.co/500x500/130b10/ffffff?text=LTD";


        return `

          <article class="member-card">

            <img
              class="card-image"
              src="${escapeHTML(photo)}"
              alt="${escapeHTML(member.nome || member.personagem)}"
              loading="lazy"
            >

            <div class="card-content">

              <h3>
                ${escapeHTML(
                  member.nome ||
                  "Membro"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  member.personagem
                )}
              </p>

              <p>
                ${escapeHTML(
                  member.obra
                )}
              </p>

            </div>

          </article>

        `;

      })
      .join("");

}


/* =========================================================
   ADMIN
   ========================================================= */

let currentAdmin = null;


function adminEmailFromCode(code) {

  return (
    code
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
    +
    "@admin.houseltd.local"
  );

}


async function adminLogin(event) {

  event.preventDefault();


  const status =
    $("adminLoginStatus");


  if (!isFirebaseReady()) return;


  const code =
    $("adminCode")
      .value
      .trim();


  if (!code) return;


  try {

    showStatus(
      status,
      "Verificando..."
    );


    const email =
      adminEmailFromCode(code);


    await auth
      .signInWithEmailAndPassword(
        email,
        code
      );


  } catch (error) {

    console.error(error);

    showStatus(
      status,
      "Código inválido ou acesso não configurado.",
      "error"
    );

  }

}


/* =========================================================
   VERIFICAR ADMIN
   ========================================================= */

async function loadCurrentAdmin(user) {

  if (!user) {

    showAdminLogin();

    return;

  }


  try {

    const doc =
      await db
        .collection("adminProfiles")
        .doc(user.uid)
        .get();


    if (!doc.exists) {

      await auth.signOut();

      showAdminLogin();

      return;

    }


    const data =
      doc.data();


    if (data.status === false) {

      await auth.signOut();

      showAdminLogin();

      return;

    }


    currentAdmin = {

      uid: user.uid,

      ...data

    };


    showAdminPanel();


    await loadAdminData();


  } catch (error) {

    console.error(error);

    await auth.signOut();

    showAdminLogin();

  }

}


/* =========================================================
   MOSTRAR LOGIN
   ========================================================= */

function showAdminLogin() {

  const login =
    $("adminLogin");

  const panel =
    $("adminPanel");

  const loading =
    $("adminLoading");


  if (login) {
    login.classList.remove("hidden");
  }

  if (panel) {
    panel.classList.add("hidden");
  }

  if (loading) {
    loading.classList.add("hide");
  }

}


/* =========================================================
   MOSTRAR PAINEL
   ========================================================= */

function showAdminPanel() {

  const login =
    $("adminLogin");

  const panel =
    $("adminPanel");

  const loading =
    $("adminLoading");


  if (login) {
    login.classList.add("hidden");
  }

  if (panel) {
    panel.classList.remove("hidden");
  }

  if (loading) {
    loading.classList.add("hide");
  }


  const welcome =
    $("adminWelcome");


  if (welcome && currentAdmin) {

    welcome.textContent =
      `${currentAdmin.nome || "Administrador"} • ${
        currentAdmin.cargo || "ADM"
      }`;

  }

}


/* =========================================================
   ADMIN DATA
   ========================================================= */

async function loadAdminData() {

  await Promise.all([
    loadAdminRequests(),
    loadAdminVacancies(),
    loadAdminMembers(),
    loadAdminProfiles(),
    loadAdminLogs()
  ]);

}


/* =========================================================
   SOLICITAÇÕES ADMIN
   ========================================================= */

async function loadAdminRequests() {

  const container =
    $("requestsAdminList");

  if (!container) return;


  try {

    const snapshot =
      await db
        .collection("characterRequests")
        .get();


    const requests =
      snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort(
          (a, b) =>
            getTime(b.createdAt) -
            getTime(a.createdAt)
        );


    $("statRequests").textContent =
      requests.filter(
        item =>
          item.status === "pendente"
      ).length;


    if (!requests.length) {

      container.innerHTML =
        `<div class="empty-card">
          Nenhuma solicitação.
        </div>`;

      return;

    }


    container.innerHTML =
      requests
        .map(request =>
          renderRequestAdmin(request)
        )
        .join("");


  } catch (error) {

    console.error(error);

    container.innerHTML =
      `<div class="empty-card">
        Erro ao carregar solicitações.
      </div>`;

  }

}


function getTime(value) {

  if (!value) return 0;

  if (value.toMillis) {
    return value.toMillis();
  }

  return new Date(value).getTime() || 0;

}


function renderRequestAdmin(request) {

  const photo =
    request.foto ||
    "https://placehold.co/300x400/130b10/ffffff?text=LTD";


  const type =
    request.tipo === "troca"
      ? "TROCA"
      : "NOVA FICHA";


  let details = "";


  if (request.tipo === "troca") {

    details = `
      <p>
        Atual:
        <strong>
          ${escapeHTML(
            request.antigoPersonagem
          )}
        </strong>
        •
        ${escapeHTML(
          request.antigaObra
        )}
      </p>

      <p>
        Novo:
        <strong>
          ${escapeHTML(
            request.personagem
          )}
        </strong>
        •
        ${escapeHTML(
          request.obra
        )}
      </p>
    `;

  } else {

    details = `
      <p>
        Personagem:
        <strong>
          ${escapeHTML(
            request.personagem
          )}
        </strong>
      </p>

      <p>
        Obra:
        ${escapeHTML(
          request.obra
        )}
      </p>

      <p>
        Idade:
        ${escapeHTML(
          request.idade
        )}
      </p>

      <p>
        Telefone:
        ****${escapeHTML(
          request.telefone4
        )}
      </p>
    `;

  }


  const actions =
    request.status === "pendente"

      ? `

        <button
          class="button primary"
          onclick="approveRequest('${request.id}')"
        >
          Aceitar
        </button>

        <button
          class="button danger"
          onclick="rejectRequest('${request.id}')"
        >
          Recusar
        </button>

      `

      : "";


  return `

    <article class="request-card">

      <div class="request-top">

        <div class="request-info">

          <img
            class="request-photo"
            src="${escapeHTML(photo)}"
            alt="Personagem"
          >

          <div>

            <span class="small-label">
              ${type}
            </span>

            <h3>
              ${escapeHTML(
                request.nome ||
                request.personagem ||
                "Solicitação"
              )}
            </h3>

            ${details}

            <p>
              Status:
              ${escapeHTML(
                request.status
              )}
            </p>

            <p>
              ${formatDate(
                request.createdAt
              )}
            </p>

          </div>

        </div>


        <div class="request-actions">

          ${actions}

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   APROVAR SOLICITAÇÃO
   ========================================================= */

async function approveRequest(id) {

  if (!currentAdmin) return;


  try {

    const requestRef =
      db
        .collection("characterRequests")
        .doc(id);


    const requestSnap =
      await requestRef.get();


    if (!requestSnap.exists) {

      throw new Error(
        "Solicitação não encontrada."
      );

    }


    const request =
      requestSnap.data();


    if (request.status !== "pendente") {

      throw new Error(
        "Essa solicitação já foi processada."
      );

    }


    if (request.tipo === "troca") {

      await approveExchange(
        requestRef,
        request
      );

    } else {

      await approveNewMember(
        requestRef,
        request
      );

    }


    await writeLog(
      "solicitacao_aprovada",
      `Solicitação ${id} aprovada.`
    );


    await loadAdminData();


    await loadPublicVacancies();

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Erro ao aprovar solicitação."
    );

  }

}


/* =========================================================
   APROVAR NOVO MEMBRO
   ========================================================= */

async function approveNewMember(
  requestRef,
  request
) {

  const vacancy =
    await findOpenVacancy(
      request.personagem,
      request.obra
    );


  if (!vacancy) {

    throw new Error(
      "A vaga desse personagem não está mais aberta."
    );

  }


  const memberRef =
    db.collection("members").doc();


  const batch =
    db.batch();


  batch.set(
    memberRef,
    {

      nome:
        request.nome || "Membro",

      personagem:
        request.personagem,

      obra:
        request.obra,

      foto:
        request.foto || "",

      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp(),

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  batch.set(
    db
      .collection("memberPrivate")
      .doc(memberRef.id),
    {

      memberId:
        memberRef.id,

      nome:
        request.nome || "",

      idade:
        request.idade || "",

      telefone4:
        request.telefone4 || "",

      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  batch.update(
    vacancy.ref,
    {

      status: "fechada",

      membroId:
        memberRef.id,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  batch.update(
    requestRef,
    {

      status: "aprovado",

      memberId:
        memberRef.id,

      approvedBy:
        currentAdmin.nome || "",

      approvedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  await batch.commit();

}


/* =========================================================
   APROVAR TROCA
   ========================================================= */

async function approveExchange(
  requestRef,
  request
) {

  const privateSnapshot =
    await db
      .collection("memberPrivate")
      .where(
        "telefone4",
        "==",
        request.telefone4
      )
      .limit(1)
      .get();


  if (privateSnapshot.empty) {

    throw new Error(
      "Membro não encontrado pelos últimos 4 dígitos."
    );

  }


  const privateDoc =
    privateSnapshot.docs[0];

  const memberId =
    privateDoc.id;


  const memberRef =
    db
      .collection("members")
      .doc(memberId);


  const memberSnap =
    await memberRef.get();


  if (!memberSnap.exists) {

    throw new Error(
      "Perfil do membro não encontrado."
    );

  }


  const vacanciesSnapshot =
    await db
      .collection("vagas")
      .get();


  const vacancies =
    vacanciesSnapshot.docs
      .map(doc => ({
        ref: doc.ref,
        id: doc.id,
        ...doc.data()
      }));


  const newVacancy =
    vacancies.find(
      vacancy =>

        normalize(
          vacancy.personagem
        ) ===
          normalize(
            request.personagem
          ) &&

        normalize(
          vacancy.obra
        ) ===
          normalize(
            request.obra
          ) &&

        vacancyStatus(vacancy) ===
          "aberta"
    );


  if (!newVacancy) {

    throw new Error(
      "O novo personagem não está disponível."
    );

  }


  const oldVacancy =
    vacancies.find(
      vacancy =>

        vacancy.membroId ===
          memberId ||

        (
          normalize(
            vacancy.personagem
          ) ===
            normalize(
              request.antigoPersonagem
            ) &&

          normalize(
            vacancy.obra
          ) ===
            normalize(
              request.antigaObra
            ) &&

          vacancyStatus(vacancy) ===
            "fechada"
        )
    );


  if (!oldVacancy) {

    throw new Error(
      "A vaga do personagem antigo não foi encontrada."
    );

  }


  if (
    oldVacancy.id ===
    newVacancy.id
  ) {

    throw new Error(
      "O personagem novo não pode ser igual ao atual."
    );

  }


  const batch =
    db.batch();


  batch.update(
    oldVacancy.ref,
    {

      status: "aberta",

      membroId:
        firebase.firestore
          .FieldValue
          .delete(),

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  batch.update(
    newVacancy.ref,
    {

      status: "fechada",

      membroId:
        memberId,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  batch.update(
    memberRef,
    {

      personagem:
        request.personagem,

      obra:
        request.obra,

      foto:
        request.foto,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  batch.update(
    requestRef,
    {

      status: "aprovado",

      memberId,

      approvedBy:
        currentAdmin.nome || "",

      approvedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    }
  );


  await batch.commit();

}


/* =========================================================
   RECUSAR
   ========================================================= */

async function rejectRequest(id) {

  if (!currentAdmin) return;


  try {

    await db
      .collection("characterRequests")
      .doc(id)
      .update({

        status: "recusado",

        rejectedBy:
          currentAdmin.nome || "",

        rejectedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    await writeLog(
      "solicitacao_recusada",
      `Solicitação ${id} recusada.`
    );


    await loadAdminData();


  } catch (error) {

    console.error(error);

    alert(
      "Não foi possível recusar a solicitação."
    );

  }

}


/* =========================================================
   VAGAS ADMIN
   ========================================================= */

let adminVacancies = [];


async function loadAdminVacancies() {

  const container =
    $("adminVacanciesList");

  if (!container) return;


  try {

    const snapshot =
      await db
        .collection("vagas")
        .get();


    adminVacancies =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data()
        })
      );


    const open =
      adminVacancies.filter(
        item =>
          vacancyStatus(item) ===
          "aberta"
      ).length;


    const closed =
      adminVacancies.length -
      open;


    $("statOpen").textContent =
      open;

    $("statClosed").textContent =
      closed;


    if (!adminVacancies.length) {

      container.innerHTML =
        `<div class="empty-card">
          Nenhuma vaga cadastrada.
        </div>`;

      return;

    }


    container.innerHTML =
      adminVacancies
        .map(
          vacancy =>
            renderAdminVacancy(vacancy)
        )
        .join("");


  } catch (error) {

    console.error(error);

  }

}


function renderAdminVacancy(vacancy) {

  const photo =
    vacancy.foto ||
    vacancy.photo ||
    "https://placehold.co/300x300/130b10/ffffff?text=LTD";


  const closed =
    vacancyStatus(vacancy) ===
    "fechada";


  return `

    <article class="admin-vacancy">

      <img
        src="${escapeHTML(photo)}"
        alt="${escapeHTML(vacancy.personagem)}"
      >


      <div class="admin-vacancy-info">

        <strong>
          ${escapeHTML(
            vacancy.personagem
          )}
        </strong>

        <span>
          ${escapeHTML(
            vacancy.obra
          )}
        </span>

        <span>
          •
          ${
            closed
              ? "Fechada"
              : "Aberta"
          }
        </span>

      </div>


      <div class="admin-vacancy-actions">

        <button
          onclick="editVacancy('${vacancy.id}')"
        >
          Editar
        </button>


        <button
          onclick="toggleVacancy('${vacancy.id}')"
        >
          ${
            closed
              ? "Abrir"
              : "Fechar"
          }
        </button>


        <button
          onclick="deleteVacancy('${vacancy.id}')"
        >
          Excluir
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   SALVAR VAGA
   ========================================================= */

async function saveVacancy(event) {

  event.preventDefault();


  if (!currentAdmin) return;


  const status =
    $("vacancyStatusMessage");


  try {

    const id =
      $("vacancyId").value.trim();

    const personagem =
      $("vacancyCharacter")
        .value
        .trim();

    const obra =
      $("vacancyWork")
        .value
        .trim();

    const vacancyStatusValue =
      $("vacancyStatus")
        .value;

    const file =
      $("vacancyPhoto")
        .files?.[0];


    if (!personagem || !obra) {

      throw new Error(
        "Preencha personagem e obra."
      );

    }


    let photo = "";


    if (id) {

      const old =
        await db
          .collection("vagas")
          .doc(id)
          .get();

      photo =
        old.data()?.foto ||
        old.data()?.photo ||
        "";

    }


    if (file) {

      showStatus(
        status,
        "Enviando imagem..."
      );

      photo =
        await uploadImage(file);

    }


    const data = {

      personagem,

      obra,

      foto: photo,

      status:
        vacancyStatusValue,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    };


    if (id) {

      await db
        .collection("vagas")
        .doc(id)
        .update(data);


      await writeLog(
        "vaga_editada",
        `${personagem} • ${obra}`
      );


    } else {

      data.createdAt =
        firebase.firestore
          .FieldValue
          .serverTimestamp();


      await db
        .collection("vagas")
        .add(data);


      await writeLog(
        "vaga_criada",
        `${personagem} • ${obra}`
      );

    }


    showStatus(
      status,
      "Vaga salva com sucesso.",
      "success"
    );


    clearVacancyForm();


    await loadAdminData();


    await loadPublicVacancies();


  } catch (error) {

    console.error(error);

    showStatus(
      status,
      error.message ||
        "Erro ao salvar vaga.",
      "error"
    );

  }

}


/* =========================================================
   EDITAR VAGA
   ========================================================= */

function editVacancy(id) {

  const vacancy =
    adminVacancies.find(
      item => item.id === id
    );


  if (!vacancy) return;


  $("vacancyId").value =
    vacancy.id;

  $("vacancyCharacter").value =
    vacancy.personagem || "";

  $("vacancyWork").value =
    vacancy.obra || "";

  $("vacancyStatus").value =
    vacancyStatus(vacancy);


  window.scrollTo({
    top:
      $("vacancyForm")
        .getBoundingClientRect()
        .top +
      window.scrollY -
      100,

    behavior: "smooth"
  });

}


/* =========================================================
   LIMPAR FORM VAGA
   ========================================================= */

function clearVacancyForm() {

  $("vacancyForm").reset();

  $("vacancyId").value = "";

}


/* =========================================================
   ABRIR / FECHAR VAGA
   ========================================================= */

async function toggleVacancy(id) {

  try {

    const ref =
      db
        .collection("vagas")
        .doc(id);


    const snap =
      await ref.get();


    if (!snap.exists) return;


    const data =
      snap.data();


    const current =
      vacancyStatus(data);


    const next =
      current === "aberta"
        ? "fechada"
        : "aberta";


    await ref.update({

      status: next,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    });


    await writeLog(
      next === "aberta"
        ? "vaga_aberta"
        : "vaga_fechada",
      `${data.personagem} • ${data.obra}`
    );


    await loadAdminData();


    await loadPublicVacancies();


  } catch (error) {

    console.error(error);

    alert(
      "Não foi possível alterar a vaga."
    );

  }

}


/* =========================================================
   EXCLUIR VAGA
   ========================================================= */

async function deleteVacancy(id) {

  if (
    !confirm(
      "Tem certeza que deseja excluir esta vaga?"
    )
  ) {

    return;

  }


  try {

    const ref =
      db
        .collection("vagas")
        .doc(id);


    const snap =
      await ref.get();


    const data =
      snap.data();


    await ref.delete();


    await writeLog(
      "vaga_excluida",
      `${data?.personagem || ""} • ${data?.obra || ""}`
    );


    await loadAdminData();


    await loadPublicVacancies();


  } catch (error) {

    console.error(error);

    alert(
      "Não foi possível excluir a vaga."
    );

  }

}


/* =========================================================
   MEMBROS ADMIN
   ========================================================= */

async function loadAdminMembers() {

  const container =
    $("adminMembersList");

  if (!container) return;


  try {

    const snapshot =
      await db
        .collection("members")
        .get();


    const members =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );


    $("statMembers").textContent =
      members.length;


    if (!members.length) {

      container.innerHTML =
        `<div class="empty-card">
          Nenhum membro aprovado.
        </div>`;

      return;

    }


    container.innerHTML =
      members
        .map(member => {

          const photo =
            member.foto ||
            "https://placehold.co/300x300/130b10/ffffff?text=LTD";


          return `

            <article class="admin-card">

              <img
                src="${escapeHTML(photo)}"
                alt=""
              >

              <div class="admin-card-info">

                <strong>
                  ${escapeHTML(
                    member.nome ||
                    "Membro"
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    member.personagem
                  )}
                </span>

                <span>
                  ${escapeHTML(
                    member.obra
                  )}
                </span>

              </div>

            </article>

          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   PERFIS DOS ADMS
   ========================================================= */

async function loadAdminProfiles() {

  const container =
    $("adminProfilesList");

  if (!container) return;


  try {

    const snapshot =
      await db
        .collection("adminProfiles")
        .get();


    const profiles =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );


    if (!profiles.length) {

      container.innerHTML =
        `<div class="empty-card">
          Nenhum perfil administrativo cadastrado no Firestore.
        </div>`;

      return;

    }


    container.innerHTML =
      profiles
        .map(profile => {

          const photo =
            profile.foto ||
            profile.photo ||
            "https://placehold.co/300x300/130b10/ffffff?text=ADM";


          const online =
            profile.online === true;


          return `

            <article class="admin-card">

              <img
                src="${escapeHTML(photo)}"
                alt=""
              >


              <div class="admin-card-info">

                <strong>
                  ${escapeHTML(
                    profile.nome ||
                    "Administrador"
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    profile.cargo ||
                    "ADM"
                  )}
                </span>

              </div>


              <span
                class="${
                  online
                    ? "online"
                    : "offline"
                }"
              ></span>

            </article>

          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   LOGS
   ========================================================= */

async function loadAdminLogs() {

  const container =
    $("logsAdminList");

  if (!container) return;


  try {

    const snapshot =
      await db
        .collection("accessLogs")
        .limit(50)
        .get();


    const logs =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );


    if (!logs.length) {

      container.innerHTML =
        `<div class="empty-card">
          Nenhum log registrado.
        </div>`;

      return;

    }


    container.innerHTML =
      logs
        .map(log => `

          <article class="log-card">

            <strong>
              ${escapeHTML(
                log.action ||
                "Ação"
              )}
            </strong>

            <p>
              ${escapeHTML(
                log.details ||
                ""
              )}
            </p>

            <p>
              ${escapeHTML(
                log.admin ||
                ""
              )}
              •
              ${formatDate(
                log.createdAt
              )}
            </p>

          </article>

        `)
        .join("");


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   ESCREVER LOG
   ========================================================= */

async function writeLog(
  action,
  details
) {

  if (!currentAdmin) return;


  try {

    await db
      .collection("accessLogs")
      .add({

        action,

        details,

        admin:
          currentAdmin.nome ||
          "",

        adminId:
          currentAdmin.uid,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

  } catch (error) {

    console.error(
      "Erro ao criar log:",
      error
    );

  }

}


/* =========================================================
   STATUS ONLINE
   ========================================================= */

async function setAdminOnline(
  online
) {

  if (
    !currentAdmin ||
    !db
  ) return;


  try {

    await db
      .collection("adminProfiles")
      .doc(currentAdmin.uid)
      .update({

        online,

        lastOnline:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutAdmin() {

  await setAdminOnline(false);

  await auth.signOut();

}


/* =========================================================
   INICIALIZAÇÃO PÚBLICA
   ========================================================= */

async function initializePublic() {

  setupPreview(
    "requestPhoto",
    "requestPhotoPreview",
    "requestPhotoPlaceholder"
  );


  setupPreview(
    "exchangePhoto",
    "exchangePhotoPreview",
    "exchangePhotoPlaceholder"
  );


  $("requestForm")
    ?.addEventListener(
      "submit",
      submitRequest
    );


  $("exchangeForm")
    ?.addEventListener(
      "submit",
      submitExchange
    );


  $("memberSearch")
    ?.addEventListener(
      "input",
      event =>
        renderMembers(
          event.target.value
        )
    );


  await loadPublicVacancies();

  await loadMembers();


  setTimeout(
    () => {

      $("loadingScreen")
        ?.classList
        .add("hide");

    },
    500
  );

}


/* =========================================================
   INICIALIZAÇÃO ADMIN
   ========================================================= */

function initializeAdmin() {

  $("adminLoginForm")
    ?.addEventListener(
      "submit",
      adminLogin
    );


  $("vacancyForm")
    ?.addEventListener(
      "submit",
      saveVacancy
    );


  $("cancelVacancyEdit")
    ?.addEventListener(
      "click",
      clearVacancyForm
    );


  $("refreshAdmin")
    ?.addEventListener(
      "click",
      loadAdminData
    );


  $("logoutButton")
    ?.addEventListener(
      "click",
      logoutAdmin
    );


  auth.onAuthStateChanged(
    loadCurrentAdmin
  );

}


/* =========================================================
   GLOBAL
   ========================================================= */

window.approveRequest =
  approveRequest;

window.rejectRequest =
  rejectRequest;

window.editVacancy =
  editVacancy;

window.toggleVacancy =
  toggleVacancy;

window.deleteVacancy =
  deleteVacancy;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const page =
      document.body.dataset.page;


    if (page === "public") {

      initializePublic();

    }


    if (page === "admin") {

      initializeAdmin();

    }

  }
);
