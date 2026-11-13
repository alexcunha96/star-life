
"use strict";

/* =========================================
   STARLIFE - SISTEMA PRINCIPAL
========================================= */

const SAVE_KEY = "starlife_save_v1";

let game = null;
let initialFamily = [];
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function createId() {
  return "person_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function money(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function saveGame() {
  if (!game) return;

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    updateContinuePanel();
  } catch (error) {
    console.error("Erro ao guardar o jogo:", error);
    showToast("Não foi possível guardar o jogo.");
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const loaded = JSON.parse(saved);

    if (!loaded || !loaded.player || !Array.isArray(loaded.family)) {
      return null;
    }

    return loaded;
  } catch (error) {
    console.error("Erro ao carregar gravação:", error);
    return null;
  }
}

function updateContinuePanel() {
  const saved = loadGame();
  $("continuePanel").classList.toggle("hidden", !saved);
}

function addEvent(message, type = "neutral") {
  if (!game) return;

  game.events.unshift({
    message,
    type,
    age: game.player.age
  });

  game.events = game.events.slice(0, 40);
}

function addFinanceEvent(message) {
  if (!game) return;

  game.financeHistory.unshift({
    message,
    age: game.player.age
  });

  game.financeHistory = game.financeHistory.slice(0, 30);
}

/* =========================================
   NOMES E DADOS
========================================= */

const femaleNames = [
  "Maria", "Ana", "Beatriz", "Inês", "Sofia",
  "Matilde", "Leonor", "Carolina", "Mariana",
  "Margarida", "Catarina", "Joana", "Rita",
  "Francisca", "Marta", "Laura", "Alice",
  "Diana", "Cláudia", "Raquel", "Teresa",
  "Isabel", "Helena", "Andreia", "Patrícia",
  "Eva", "Luísa", "Daniela", "Filipa"
];

const maleNames = [
  "João", "Pedro", "Miguel", "Francisco", "Tiago",
  "Diogo", "André", "Rafael", "Gonçalo",
  "Martim", "Afonso", "Tomás", "Duarte",
  "Bruno", "Ricardo", "Daniel", "António",
  "Manuel", "Luís", "Gabriel", "David",
  "Nuno", "Hugo", "Filipe", "Eduardo",
  "José", "Rodrigo", "Vasco", "Guilherme"
];

const surnames = [
  "Silva", "Santos", "Ferreira", "Pereira",
  "Oliveira", "Costa", "Rodrigues", "Martins",
  "Sousa", "Gomes", "Lopes", "Almeida",
  "Ribeiro", "Carvalho", "Moreira", "Mendes",
  "Teixeira", "Nunes", "Correia", "Monteiro"
];

const personalities = [
  "Carinhoso/a", "Aventureiro/a", "Tímido/a",
  "Extrovertido/a", "Ambicioso/a", "Calmo/a",
  "Ciumento/a", "Divertido/a", "Romântico/a",
  "Independente", "Sensível", "Confiante"
];

const interests = [
  "Desporto", "Música", "Cinema", "Viagens",
  "Animais", "Tecnologia", "Natureza",
  "Jogos", "Culinária", "Leitura", "Moda",
  "Carros", "Arte", "Dança"
];

const familyJobs = [
  { name: "Empregado/a de supermercado", salary: 11500 },
  { name: "Assistente de loja", salary: 12000 },
  { name: "Barbeiro/a", salary: 14500 },
  { name: "Cabeleireiro/a", salary: 14500 },
  { name: "Cozinheiro/a", salary: 15500 },
  { name: "Empregado/a de mesa", salary: 12000 },
  { name: "Motorista", salary: 16500 },
  { name: "Pedreiro/a", salary: 17000 },
  { name: "Eletricista", salary: 19000 },
  { name: "Mecânico/a", salary: 18000 },
  { name: "Enfermeiro/a", salary: 24000 },
  { name: "Professor/a", salary: 25000 },
  { name: "Engenheiro/a", salary: 32000 },
  { name: "Advogado/a", salary: 35000 },
  { name: "Médico/a", salary: 42000 },
  { name: "Empresário/a", salary: 38000 }
];

function generateName(sex) {
  if (sex === "Feminino") return randomFrom(femaleNames);
  if (sex === "Masculino") return randomFrom(maleNames);
  return randomFrom([...femaleNames, ...maleNames]);
}

function createFamilyMember(data) {
  return {
    id: createId(),
    name: data.name || "Sem nome",
    surname: data.surname || "",
    relation: data.relation || "Outro",
    age: Number(data.age) || 0,
    sex: data.sex || "Outro",
    alive: true,
    job: "",
    salary: 0,
    biologicalParentIds: [],
    adoptiveParentIds: [],
    socialParentIds: [],
    relationship: 70,
    partnerId: null,
    relationshipStatus: "Solteiro/a",
    marriageAge: null,
    childrenCount: 0
  };
}

function createSocialPerson(data = {}) {
  return {
    id: createId(),
    name: data.name || generateName(data.sex),
    surname: data.surname || randomFrom(surnames),
    sex: data.sex || randomFrom(["Masculino", "Feminino"]),
    age: Number(data.age) || 18,
    city: data.city || game.player.city,
    country: data.country || game.player.country,
    alive: true,
    personality: data.personality || randomFrom(personalities),
    interests: data.interests || [
      randomFrom(interests),
      randomFrom(interests)
    ],
    compatibility: randomNumber(35, 95),
    friendship: 0,
    love: 0,
    status: "Conhecido/a",
    partnerId: null,
    relationshipStatus: "Solteiro/a",
    job: "",
    salary: 0,
    childrenCount: 0,
    metAtAge: game.player.age
  };
}

function relationIsMother(relation) {
  return ["mãe", "mae"].includes(String(relation).toLowerCase());
}

function relationIsFather(relation) {
  return String(relation).toLowerCase() === "pai";
}

function getPersonFullName(person) {
  return `${person.name} ${person.surname || ""}`.trim();
}

function getRelationLabel(person) {
  return person.relation || "Familiar";
}

function getParentNames(person) {
  const ids = [
    ...(person.biologicalParentIds || []),
    ...(person.adoptiveParentIds || []),
    ...(person.socialParentIds || [])
  ];

  return ids
    .map(id => game.family.find(member => member.id === id))
    .filter(Boolean)
    .map(getPersonFullName)
    .join(", ") || "Não definido";
}

/* =========================================
   FAMÍLIA
========================================= */

function createAutomaticFamily() {
  const mother = createFamilyMember({
    name: generateName("Feminino"),
    surname: game.player.surname,
    relation: "Mãe",
    age: randomNumber(18, 45),
    sex: "Feminino"
  });

  const father = createFamilyMember({
    name: generateName("Masculino"),
    surname: game.player.surname,
    relation: "Pai",
    age: randomNumber(18, 50),
    sex: "Masculino"
  });

  mother.partnerId = father.id;
  father.partnerId = mother.id;
  mother.relationshipStatus = "Casado/a";
  father.relationshipStatus = "Casado/a";

  game.family.push(mother, father);
  game.player.biologicalParentIds = [mother.id, father.id];

  return { mother, father };
}

function connectInitialParents() {
  const mother = game.family.find(person => relationIsMother(person.relation));
  const father = game.family.find(person => relationIsFather(person.relation));

  game.player.biologicalParentIds = [];

  if (mother) game.player.biologicalParentIds.push(mother.id);
  if (father) game.player.biologicalParentIds.push(father.id);
}

function addFamilyMember(data, linkType = "biological") {
  if (!game) return;

  const person = createFamilyMember(data);

  game.family.push(person);

  if (linkType === "biological") {
    person.biologicalParentIds = [];
  } else if (linkType === "adoptive") {
    person.adoptiveParentIds = [];
  } else {
    person.socialParentIds = [];
  }

  if (["Filho", "Filha"].includes(person.relation)) {
    person.biologicalParentIds = [game.player.id];
  }

  addEvent(`${getPersonFullName(person)} passou a fazer parte da tua família.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function removeFamilyMember(id) {
  const person = game.family.find(member => member.id === id);
  if (!person) return;

  if (!confirm(`Queres mesmo remover ${getPersonFullName(person)} da família?`)) {
    return;
  }

  game.family = game.family.filter(member => member.id !== id);

  const remainingIds = new Set(game.family.map(member => member.id));

  game.player.biologicalParentIds =
    (game.player.biologicalParentIds || []).filter(value => remainingIds.has(value));

  game.family.forEach(member => {
    member.biologicalParentIds =
      (member.biologicalParentIds || []).filter(value => remainingIds.has(value));

    member.adoptiveParentIds =
      (member.adoptiveParentIds || []).filter(value => remainingIds.has(value));

    member.socialParentIds =
      (member.socialParentIds || []).filter(value => remainingIds.has(value));

    if (member.partnerId === id) {
      member.partnerId = null;
      member.relationshipStatus = "Viúvo/a";
    }
  });

  addEvent(`${getPersonFullName(person)} deixou de fazer parte da tua família.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function editFamilyMember(id) {
  const person = game.family.find(member => member.id === id);
  if (!person) return;

  const newName = prompt("Nome:", person.name);
  if (newName === null) return;

  const newSurname = prompt("Apelido:", person.surname || "");
  if (newSurname === null) return;

  const newAge = prompt("Idade:", String(person.age));
  if (newAge === null) return;

  const age = Number(newAge);

  if (!newName.trim() || !Number.isFinite(age) || age < 0 || age > 110) {
    showToast("Verifica o nome e a idade.");
    return;
  }

  const newRelation = prompt("Parentesco:", person.relation);
  if (newRelation === null) return;

  person.name = newName.trim();
  person.surname = newSurname.trim();
  person.age = Math.floor(age);
  person.relation = newRelation.trim() || "Outro";

  addEvent(`Atualizaste os dados de ${getPersonFullName(person)}.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function renderPeople() {
  const container = $("peopleList");
  container.innerHTML = "";

  if (!game.family.length) {
    container.innerHTML = "<p class='muted'>Ainda não tens familiares registados.</p>";
    return;
  }

  game.family.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";

    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>
          ${escapeHTML(getRelationLabel(person))} ·
          ${person.age} anos ·
          ${person.alive ? "Vivo/a" : "Falecido/a"}
        </small>
        <small>Relação: ${person.relationship ?? 70}%</small>
        <small>Profissão: ${escapeHTML(person.job || "Sem profissão")}</small>
        <small>Estado amoroso: ${escapeHTML(person.relationshipStatus || "Solteiro/a")}</small>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderFamilyEditor() {
  const container = $("familyEditorList");
  if (!container || !game) return;

  container.innerHTML = "";

  if (!game.family.length) {
    container.innerHTML = "<p class='muted'>Ainda não tens familiares. Podes adicionar abaixo.</p>";
    return;
  }

  game.family.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";

    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${escapeHTML(person.relation)} · ${person.age} anos</small>
        <small>Progenitores: ${escapeHTML(getParentNames(person))}</small>
        <small>Profissão: ${escapeHTML(person.job || "Sem profissão")}</small>
        <small>Estado amoroso: ${escapeHTML(person.relationshipStatus || "Solteiro/a")}</small>
      </div>
      <div class="person-actions">
        <button class="small-btn" data-edit-person="${person.id}">Editar</button>
        <button class="small-btn" data-remove-person="${person.id}">Remover</button>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit-person]").forEach(button => {
    button.addEventListener("click", () => editFamilyMember(button.dataset.editPerson));
  });

  container.querySelectorAll("[data-remove-person]").forEach(button => {
    button.addEventListener("click", () => removeFamilyMember(button.dataset.removePerson));
  });
}

function renderFamilyTree() {
  const container = $("familyTree");
  container.innerHTML = "";

  const playerParents = [
    ...(game.player.biologicalParentIds || []),
    ...(game.player.adoptiveParentIds || []),
    ...(game.player.socialParentIds || [])
  ];

  const parents = game.family.filter(person => playerParents.includes(person.id));

  const children = game.family.filter(person => [
    ...(person.biologicalParentIds || []),
    ...(person.adoptiveParentIds || []),
    ...(person.socialParentIds || [])
  ].includes(game.player.id));

  const siblings = game.family.filter(person => {
    const ids = [
      ...(person.biologicalParentIds || []),
      ...(person.adoptiveParentIds || []),
      ...(person.socialParentIds || [])
    ];

    return ids.some(id => playerParents.includes(id)) &&
      !children.some(child => child.id === person.id);
  });

  function personBox(person, current = false) {
    return `
      <div class="tree-person ${current ? "current" : ""}">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${current ? "Tu" : escapeHTML(person.relation)}</small>
        <small>${person.age} anos</small>
      </div>
    `;
  }

  if (parents.length) {
    container.innerHTML += `
      <div class="tree-generation">
        ${parents.map(person => personBox(person)).join("")}
      </div>
      <div class="tree-connector">↓</div>
    `;
  }

  container.innerHTML += `
    <div class="tree-generation">
      ${personBox(game.player, true)}
    </div>
  `;

  if (siblings.length) {
    container.innerHTML += `
      <div class="tree-connector">↔</div>
      <div class="tree-generation">
        ${siblings.map(person => personBox(person)).join("")}
      </div>
    `;
  }

  if (children.length) {
    container.innerHTML += `
      <div class="tree-connector">↓</div>
      <div class="tree-generation">
        ${children.map(person => personBox(person)).join("")}
      </div>
    `;
  }

  if (!parents.length && !siblings.length && !children.length) {
    container.innerHTML = "<p class='muted'>A tua árvore genealógica começa contigo.</p>";
  }
}

/* =========================================
   VIDA AUTÓNOMA DOS FAMILIARES
========================================= */

function findFamilyPartner(person) {
  if (!person.partnerId) return null;
  return game.family.find(member => member.id === person.partnerId) || null;
}

function createAutonomousPartner(person) {
  const sex = person.sex === "Feminino" ? "Masculino" : "Feminino";

  const partner = createFamilyMember({
    name: generateName(sex),
    surname: randomFrom(surnames),
    relation: "Companheiro/a",
    age: clamp(person.age + randomNumber(-4, 4), 18, 90),
    sex
  });

  partner.partnerId = person.id;
  person.partnerId = partner.id;

  partner.relationshipStatus = "Namoro";
  person.relationshipStatus = "Namoro";

  game.family.push(partner);

  addEvent(
    `${getPersonFullName(person)} começou uma relação com ${getPersonFullName(partner)}. ❤️`
  );

  return partner;
}

function updateFamilyJobs(person) {
  if (!person.alive || person.age < 16) return;

  if (person.age >= 67 && person.job) {
    if (Math.random() < 0.20) {
      addEvent(`${getPersonFullName(person)} reformou-se.`);
      person.job = "";
      person.salary = 0;
    }
    return;
  }

  if (!person.job) {
    const chance = person.age < 18 ? 0.12 : 0.38;

    if (Math.random() < chance) {
      const available = familyJobs.filter(job =>
        person.age >= 18 || job.salary <= 15000
      );

      const job = randomFrom(available);
      person.job = job.name;
      person.salary = job.salary;

      addEvent(`${getPersonFullName(person)} conseguiu emprego como ${job.name}.`);
    }

    return;
  }

  if (Math.random() < 0.08) {
    const newJob = randomFrom(familyJobs);
    person.job = newJob.name;
    person.salary = newJob.salary;

    addEvent(`${getPersonFullName(person)} mudou de profissão para ${newJob.name}.`);
  }
}

function createAutonomousChild(parentOne, parentTwo) {
  if (!parentOne || !parentTwo) return;
  if (!parentOne.alive || !parentTwo.alive) return;

  if (parentOne.age < 20 || parentOne.age > 45) return;
  if (parentTwo.age < 18 || parentTwo.age > 50) return;

  if (!["Namoro", "Casado/a"].includes(parentOne.relationshipStatus)) return;
  if (!["Namoro", "Casado/a"].includes(parentTwo.relationshipStatus)) return;

  const existing = game.family.filter(person => {
    const ids = person.biologicalParentIds || [];
    return ids.includes(parentOne.id) && ids.includes(parentTwo.id);
  });

  if (existing.length >= 3 || Math.random() >= 0.035) return;

  const sex = randomFrom(["Masculino", "Feminino"]);

  const child = createFamilyMember({
    name: generateName(sex),
    surname: parentOne.surname || parentTwo.surname,
    relation: sex === "Feminino" ? "Filha" : "Filho",
    age: 0,
    sex
  });

  child.biologicalParentIds = [parentOne.id, parentTwo.id];

  game.family.push(child);

  parentOne.childrenCount = (parentOne.childrenCount || 0) + 1;
  parentTwo.childrenCount = (parentTwo.childrenCount || 0) + 1;

  addEvent(
    `${getPersonFullName(parentOne)} e ${getPersonFullName(parentTwo)} tiveram ${sex === "Feminino" ? "uma filha" : "um filho"}: ${getPersonFullName(child)}! 👶`
  );
}

function updateFamilyRelationships(person, processedPairs) {
  if (!person.alive || person.age < 18) return;

  let partner = findFamilyPartner(person);

  if (partner && !partner.alive) {
    person.partnerId = null;
    person.relationshipStatus = "Viúvo/a";
    addEvent(`${getPersonFullName(person)} ficou viúvo/a.`, "negative");
    return;
  }

  if (!partner && Math.random() < 0.035) {
    createAutonomousPartner(person);
    return;
  }

  if (!partner || !partner.alive) return;

  const pairKey = [person.id, partner.id].sort().join("_");
  if (processedPairs.has(pairKey)) return;

  processedPairs.add(pairKey);

  if (
    person.relationshipStatus === "Namoro" &&
    partner.relationshipStatus === "Namoro" &&
    person.age >= 20 &&
    partner.age >= 18 &&
    Math.random() < 0.16
  ) {
    person.relationshipStatus = "Casado/a";
    partner.relationshipStatus = "Casado/a";
    person.marriageAge = person.age;
    partner.marriageAge = partner.age;

    addEvent(`${getPersonFullName(person)} casou-se com ${getPersonFullName(partner)}! 💍`);
  }

  if (
    person.relationshipStatus === "Namoro" &&
    partner.relationshipStatus === "Namoro" &&
    Math.random() < 0.025
  ) {
    person.partnerId = null;
    partner.partnerId = null;
    person.relationshipStatus = "Separado/a";
    partner.relationshipStatus = "Separado/a";

    addEvent(`${getPersonFullName(person)} e ${getPersonFullName(partner)} terminaram a relação.`);
    return;
  }

  createAutonomousChild(person, partner);
}

function processFamilyLife() {
  if (!game) return;

  const snapshot = [...game.family];
  const processedPairs = new Set();

  snapshot.forEach(person => {
    if (!person.alive) return;

    updateFamilyJobs(person);
    updateFamilyRelationships(person, processedPairs);

    person.relationship = clamp(
      (person.relationship ?? 70) + (Math.random() < 0.5 ? 1 : -1)
    );
  });
}

/* =========================================
   SISTEMA DE RELAÇÕES DO JOGADOR
========================================= */

function getSocialPerson(id) {
  return game.socialPeople.find(person => person.id === id) || null;
}

function getPlayerPartner() {
  if (!game.player.partnerId) return null;
  return getSocialPerson(game.player.partnerId);
}

function isDatingAge(person) {
  return person && person.age >= 14;
}

function ageDifferenceAllowed(person) {
  const difference = Math.abs(game.player.age - person.age);

  if (game.player.age < 18 || person.age < 18) {
    return difference <= 2;
  }

  return difference <= 8;
}

function createNewAcquaintances() {
  if (game.player.age < 10) {
    showToast("Ainda és demasiado novo/a para conhecer pessoas desta forma.");
    return;
  }

  const available = game.socialPeople.filter(person =>
    person.alive &&
    person.status === "Conhecido/a" &&
    !game.player.friends.includes(person.id) &&
    person.id !== game.player.partnerId
  );

  let created = 0;

  for (let i = 0; i < 3; i++) {
    if (available.length > 0 && Math.random() < 0.4) continue;

    let age;

    if (game.player.age < 18) {
      age = clamp(game.player.age + randomNumber(-2, 2), 10, 17);
    } else {
      age = clamp(game.player.age + randomNumber(-8, 8), 18, 75);
    }

    const person = createSocialPerson({
      age,
      city: game.player.city,
      country: game.player.country
    });

    game.socialPeople.push(person);
    created++;
  }

  if (created > 0) {
    addEvent(`Conheceste ${created} pessoa(s) nova(s) na tua cidade. 👋`);
    showToast(`Conheceste ${created} pessoa(s) nova(s)!`);
  } else {
    showToast("Não encontraste ninguém novo desta vez. Tenta novamente.");
  }

  saveGame();
  renderRelationships();
}

function talkToPerson(id) {
  const person = getSocialPerson(id);
  if (!person || !person.alive) return;

  person.friendship = clamp(person.friendship + randomNumber(5, 15));
  person.status = person.friendship >= 60 ? "Amigo/a" : "Conhecido/a";

  game.player.happiness = clamp(game.player.happiness + 2);

  addEvent(`Tiveste uma boa conversa com ${getPersonFullName(person)}. 🙂`);

  if (person.friendship >= 60 && Math.random() < 0.35) {
    addEvent(`${getPersonFullName(person)} considera-te um/a grande amigo/a.`);
  }

  saveGame();
  renderGame();
}

function flirtWithPerson(id) {
  const person = getSocialPerson(id);
  if (!person || !person.alive) return;

  if (game.player.age < 14 || person.age < 14) {
    showToast("As relações amorosas só estão disponíveis a partir dos 14 anos.");
    return;
  }

  if (!ageDifferenceAllowed(person)) {
    showToast("Esta pessoa não tem uma idade adequada à tua.");
    return;
  }

  if (game.player.partnerId) {
    showToast("Já estás numa relação. Resolve primeiro a tua situação amorosa.");
    return;
  }

  person.love = clamp(person.love + randomNumber(8, 18));

  if (Math.random() < person.compatibility / 150) {
    addEvent(`Houve química entre ti e ${getPersonFullName(person)}. ❤️`);
    showToast("Parece que existe química!");
  } else {
    person.love = clamp(person.love - 5);
    addEvent(`Tentaste aproximar-te de ${getPersonFullName(person)}, mas não correu muito bem.`);
    showToast("Não parece ter havido grande química.");
  }

  saveGame();
  renderRelationships();
}

function askForRelationship(id) {
  const person = getSocialPerson(id);
  if (!person || !person.alive) return;

  if (game.player.age < 14 || person.age < 14) {
    showToast("Tens de ter pelo menos 14 anos.");
    return;
  }

  if (!ageDifferenceAllowed(person)) {
    showToast("A diferença de idades não é adequada.");
    return;
  }

  if (game.player.partnerId) {
    showToast("Já estás numa relação.");
    return;
  }

  if (person.love < 35) {
    showToast("Ainda precisam de se conhecer melhor.");
    return;
  }

  const chance = clamp(
    25 + person.love * 0.55 + person.compatibility * 0.2,
    10,
    95
  );

  if (Math.random() * 100 <= chance) {
    game.player.partnerId = person.id;
    game.player.relationshipStatus = "Namoro";

    person.partnerId = game.player.id;
    person.relationshipStatus = "Namoro";
    person.status = "Namorado/a";

    addEvent(`Começaste a namorar com ${getPersonFullName(person)}! ❤️`);
    showToast("Parabéns! Estás numa relação.");
  } else {
    person.love = clamp(person.love - 10);
    addEvent(`${getPersonFullName(person)} não aceitou o teu pedido de namoro.`);
    showToast("Desta vez recebeste um não.");
  }

  saveGame();
  renderGame();
}

function proposeMarriage() {
  const partner = getPlayerPartner();

  if (!partner || !partner.alive) {
    showToast("Não tens um/a companheiro/a.");
    return;
  }

  if (game.player.age < 18 || partner.age < 18) {
    showToast("Só podes casar quando ambos tiverem pelo menos 18 anos.");
    return;
  }

  if (game.player.relationshipStatus !== "Namoro") {
    showToast("Tens de estar numa relação de namoro.");
    return;
  }

  const chance = clamp(
    25 + partner.love * 0.55 + partner.compatibility * 0.2,
    10,
    98
  );

  if (Math.random() * 100 <= chance) {
    game.player.relationshipStatus = "Casado/a";
    game.player.marriageAge = game.player.age;

    partner.relationshipStatus = "Casado/a";
    partner.marriageAge = partner.age;

    addEvent(`💍 Pediste ${getPersonFullName(partner)} em casamento e a resposta foi SIM! Casaram-se!`);
    showToast("Parabéns pelo casamento! 💍");
  } else {
    partner.love = clamp(partner.love - 8);
    addEvent(`${getPersonFullName(partner)} recusou o teu pedido de casamento.`);
    showToast("O pedido foi recusado...");
  }

  saveGame();
  renderGame();
}

function breakUp() {
  const partner = getPlayerPartner();
  if (!partner) return;

  if (!confirm(`Queres terminar a relação com ${getPersonFullName(partner)}?`)) {
    return;
  }

  const wasMarried = game.player.relationshipStatus === "Casado/a";

  game.player.partnerId = null;
  game.player.relationshipStatus = wasMarried ? "Divorciado/a" : "Solteiro/a";

  partner.partnerId = null;
  partner.relationshipStatus = wasMarried ? "Divorciado/a" : "Solteiro/a";
  partner.status = "Ex-companheiro/a";

  addEvent(
    wasMarried
      ? `Tu e ${getPersonFullName(partner)} divorciaram-se. 💔`
      : `Tu e ${getPersonFullName(partner)} terminaram o namoro. 💔`,
    "negative"
  );

  saveGame();
  renderGame();
}

function haveChild() {
  const partner = getPlayerPartner();

  if (!partner || !partner.alive) {
    showToast("Precisas de ter um/a companheiro/a.");
    return;
  }

  if (game.player.age < 18 || partner.age < 18) {
    showToast("Só podes ter filhos a partir dos 18 anos.");
    return;
  }

  if (game.player.age > 50 || partner.age > 50) {
    showToast("A idade já não permite esta opção no jogo.");
    return;
  }

  if (!confirm("Queres tentar ter um filho com esta pessoa?")) return;

  if (Math.random() > 0.65) {
    const sex = randomFrom(["Masculino", "Feminino"]);

    const child = createFamilyMember({
      name: generateName(sex),
      surname: game.player.surname,
      relation: sex === "Feminino" ? "Filha" : "Filho",
      age: 0,
      sex
    });

    child.biologicalParentIds = [game.player.id];
    child.otherParentName = getPersonFullName(partner);

    game.family.push(child);

    game.player.childrenCount = (game.player.childrenCount || 0) + 1;
    partner.childrenCount = (partner.childrenCount || 0) + 1;

    game.player.happiness = clamp(game.player.happiness + 12);

    addEvent(
      `👶 Tiveste ${sex === "Feminino" ? "uma filha" : "um filho"} com ${getPersonFullName(partner)}: ${getPersonFullName(child)}!`
    );

    showToast("A família cresceu! 👶");
  } else {
    addEvent("Tentaste aumentar a família, mas não aconteceu desta vez.");
    showToast("Não aconteceu desta vez. Podes tentar noutro ano.");
  }

  saveGame();
  renderGame();
}

function adoptChild() {
  const partner = getPlayerPartner();

  if (game.player.age < 18) {
    showToast("A adoção só está disponível a partir dos 18 anos.");
    return;
  }

  if (!confirm("Queres iniciar um processo de adoção?")) return;

  if (Math.random() > 0.25) {
    const sex = randomFrom(["Masculino", "Feminino"]);
    const age = randomNumber(0, 8);

    const child = createFamilyMember({
      name: generateName(sex),
      surname: game.player.surname,
      relation: sex === "Feminino" ? "Filha" : "Filho",
      age,
      sex
    });

    child.adoptiveParentIds = [game.player.id];

    if (partner) {
      child.otherAdoptiveParentName = getPersonFullName(partner);
    }

    game.family.push(child);
    game.player.childrenCount = (game.player.childrenCount || 0) + 1;

    addEvent(`❤️ O processo de adoção foi aprovado! ${getPersonFullName(child)} passou a fazer parte da tua família.`);
    showToast("Adoção aprovada!");
  } else {
    addEvent("O processo de adoção ainda não foi aprovado.");
    showToast("A adoção não foi aprovada desta vez.");
  }

  saveGame();
  renderGame();
}

/* =========================================
   EVOLUÇÃO DAS PERSONAGENS CONHECIDAS
========================================= */

function processSocialLife() {
  if (!game) return;

  game.socialPeople.forEach(person => {
    if (!person.alive) return;

    person.age += 1;

    if (person.age >= 100 && Math.random() < 0.15) {
      person.alive = false;
      addEvent(`${getPersonFullName(person)} faleceu aos ${person.age} anos.`, "negative");

      if (game.player.partnerId === person.id) {
        game.player.partnerId = null;
        game.player.relationshipStatus = "Viúvo/a";
        addEvent("Ficaste viúvo/a após a morte do/a teu/tua companheiro/a.", "negative");
      }

      return;
    }

    if (person.age >= 80 && Math.random() < 0.04) {
      person.alive = false;
      addEvent(`${getPersonFullName(person)} faleceu aos ${person.age} anos.`, "negative");

      if (game.player.partnerId === person.id) {
        game.player.partnerId = null;
        game.player.relationshipStatus = "Viúvo/a";
      }

      return;
    }

    // Relações entre personagens independentes.
    if (
      person.partnerId &&
      person.partnerId !== game.player.id
    ) {
      const other = getSocialPerson(person.partnerId);

      if (other && !other.alive) {
        person.partnerId = null;
        person.relationshipStatus = "Viúvo/a";
      } else if (other && Math.random() < 0.015) {
        person.partnerId = null;
        person.relationshipStatus = "Separado/a";
        other.partnerId = null;
        other.relationshipStatus = "Separado/a";

        addEvent(`${getPersonFullName(person)} e ${getPersonFullName(other)} terminaram a relação.`);
      }
    }
  });

  // Atualiza o estado amoroso do jogador se o parceiro morreu.
  const partner = getPlayerPartner();

  if (partner && !partner.alive) {
    game.player.partnerId = null;
    game.player.relationshipStatus = "Viúvo/a";
  }
}

function updateSocialJobs() {
  if (!game) return;

  game.socialPeople.forEach(person => {
    if (!person.alive || person.age < 18) return;

    if (!person.job && Math.random() < 0.12) {
      const job = randomFrom(familyJobs);
      person.job = job.name;
      person.salary = job.salary;
    }
  });
}

function ensureSocialPeople() {
  if (!game || game.player.age < 10) return;

  const alivePeople = game.socialPeople.filter(person =>
    person.alive &&
    person.status !== "Ex-companheiro/a"
  );

  const target = game.player.age < 18 ? 6 : 8;

  if (alivePeople.length >= target) return;

  const missing = target - alivePeople.length;

  for (let i = 0; i < missing; i++) {
    let age;

    if (game.player.age < 18) {
      age = clamp(game.player.age + randomNumber(-2, 2), 10, 17);
    } else {
      age = clamp(game.player.age + randomNumber(-8, 8), 18, 75);
    }

    game.socialPeople.push(createSocialPerson({ age }));
  }
}

/* =========================================
   INTERFACE DE RELAÇÕES
========================================= */

function installRelationshipsUI() {
  if ($("relationshipsTab")) return;

  const nav = $("bottomNav");
  const profileTab = $("profileTab");

  const navButton = document.createElement("button");
  navButton.className = "nav-btn";
  navButton.dataset.tab = "relationshipsTab";
  navButton.innerHTML = "❤️<span>Relações</span>";

  const profileButton = nav.querySelector('[data-tab="profileTab"]');
  nav.insertBefore(navButton, profileButton);

  const section = document.createElement("section");
  section.id = "relationshipsTab";
  section.className = "tab-content hidden";

  section.innerHTML = `
    <div class="panel">
      <p class="eyebrow">Vida social</p>
      <h2>❤️ Relações</h2>
      <p class="muted">Conhece pessoas, cria amizades e encontra alguém especial.</p>
      <button id="meetPeopleBtn" class="primary-btn full-width">
        + Conhecer pessoas
      </button>
      <p class="small-note">As pessoas que conheces têm idade, personalidade e vida próprias.</p>
    </div>

    <div id="currentRelationshipPanel"></div>

    <div class="panel">
      <h3>Os teus amigos e conhecidos</h3>
      <div id="socialPeopleList" class="people-list"></div>
    </div>

    <div class="panel">
      <h3>Família e filhos</h3>
      <div id="relationshipFamilySummary"></div>
    </div>
  `;

  profileTab.parentNode.insertBefore(section, profileTab);

  $("meetPeopleBtn").addEventListener("click", createNewAcquaintances);

  section.addEventListener("click", event => {
    const button = event.target.closest("[data-social-action]");
    if (!button) return;

    const action = button.dataset.socialAction;
    const id = button.dataset.personId;

    if (action === "talk") talkToPerson(id);
    if (action === "flirt") flirtWithPerson(id);
    if (action === "date") askForRelationship(id);
    if (action === "marry") proposeMarriage();
    if (action === "breakup") breakUp();
    if (action === "child") haveChild();
    if (action === "adopt") adoptChild();
  });
}

function renderRelationships() {
  if (!game) return;

  installRelationshipsUI();

  const player = game.player;
  const partner = getPlayerPartner();

  const currentPanel = $("currentRelationshipPanel");
  const peopleContainer = $("socialPeopleList");
  const familySummary = $("relationshipFamilySummary");

  if (partner && partner.alive) {
    const isMarried = player.relationshipStatus === "Casado/a";

    currentPanel.innerHTML = `
      <div class="panel">
        <p class="eyebrow">A tua relação</p>
        <h3>${isMarried ? "💍 Casamento" : "❤️ Namoro"}</h3>
        <div class="person-card">
          <div class="person-info">
            <strong>${escapeHTML(getPersonFullName(partner))}</strong>
            <small>${partner.age} anos · ${escapeHTML(partner.personality)}</small>
            <small>Compatibilidade: ${partner.compatibility}%</small>
            <small>Amor: ${partner.love}%</small>
            <small>Profissão: ${escapeHTML(partner.job || "Sem profissão")}</small>
            <small>Interesses: ${escapeHTML((partner.interests || []).join(", "))}</small>
            <small>Filhos: ${partner.childrenCount || 0}</small>
          </div>
        </div>

        ${!isMarried && player.age >= 18 && partner.age >= 18 ? `
          <button class="primary-btn full-width" data-social-action="marry">
            💍 Pedir em casamento
          </button>
        ` : ""}

        ${player.age >= 18 && partner.age >= 18 ? `
          <button class="secondary-btn full-width" data-social-action="child">
            👶 Tentar ter um filho
          </button>
        ` : ""}

        ${player.age >= 18 ? `
          <button class="secondary-btn full-width" data-social-action="adopt">
            ❤️ Adotar uma criança
          </button>
        ` : ""}

        <button class="danger-btn full-width" data-social-action="breakup">
          ${isMarried ? "Terminar casamento / Divórcio" : "Terminar relação"}
        </button>
      </div>
    `;
  } else {
    currentPanel.innerHTML = `
      <div class="panel">
        <h3>💔 Estado amoroso</h3>
        <p>${escapeHTML(player.relationshipStatus || "Solteiro/a")}</p>
        <p class="muted">
          ${player.age < 14
            ? "Podes começar a conhecer pessoas e fazer amizades. As relações amorosas estarão disponíveis a partir dos 14 anos."
            : "Ainda não tens uma relação. Conhece pessoas e vê se encontras alguém especial."}
        </p>
      </div>
    `;
  }

  peopleContainer.innerHTML = "";

  const availablePeople = game.socialPeople.filter(person =>
    person.alive &&
    person.id !== player.partnerId
  );

  if (!availablePeople.length) {
    peopleContainer.innerHTML = `
      <p class="muted">Ainda não conheces ninguém. Carrega em "Conhecer pessoas" para começares.</p>
    `;
  }

  availablePeople.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";

    const isFriend = person.friendship >= 60;
    const canDate = player.age >= 14 &&
      person.age >= 14 &&
      ageDifferenceAllowed(person) &&
      !player.partnerId;

    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${person.age} anos · ${escapeHTML(person.personality)}</small>
        <small>${escapeHTML(person.status || "Conhecido/a")}</small>
        <small>Amizade: ${person.friendship}%</small>
        <small>Interesses: ${escapeHTML((person.interests || []).join(", "))}</small>
        ${person.love > 0 ? `<small>Química: ${person.love}%</small>` : ""}
      </div>

      <div class="person-actions">
        <button class="small-btn" data-social-action="talk" data-person-id="${person.id}">
          Conversar
        </button>

        ${canDate ? `
          <button class="small-btn" data-social-action="flirt" data-person-id="${person.id}">
            ❤️ Aproximar
          </button>
        ` : ""}

        ${canDate && person.love >= 35 ? `
          <button class="small-btn" data-social-action="date" data-person-id="${person.id}">
            Namorar
          </button>
        ` : ""}
      </div>
    `;

    peopleContainer.appendChild(card);
  });

  const children = game.family.filter(person =>
    (person.biologicalParentIds || []).includes(player.id) ||
    (person.adoptiveParentIds || []).includes(player.id)
  );

  familySummary.innerHTML = `
    <div class="info-row">
      <span>Estado amoroso</span>
      <strong>${escapeHTML(player.relationshipStatus || "Solteiro/a")}</strong>
    </div>
    <div class="info-row">
      <span>Amigos</span>
      <strong>${game.socialPeople.filter(person => person.friendship >= 60).length}</strong>
    </div>
    <div class="info-row">
      <span>Filhos registados</span>
      <strong>${children.length}</strong>
    </div>
  `;
}

/* =========================================
   CRIAÇÃO E INÍCIO DO JOGO
========================================= */

function validateStart() {
  const fields = [
    $("playerName").value.trim(),
    $("playerSurname").value.trim(),
    $("playerSex").value,
    $("playerCountry").value.trim(),
    $("playerCity").value.trim()
  ];

  if (fields.some(value => !value)) {
    showToast("Preenche todos os campos para começares a jogar.");
    return false;
  }

  return true;
}

function startGame() {
  if (!validateStart()) return;

  const player = {
    id: createId(),
    name: $("playerName").value.trim(),
    surname: $("playerSurname").value.trim(),
    sex: $("playerSex").value,
    country: $("playerCountry").value.trim(),
    city: $("playerCity").value.trim(),
    age: 0,
    alive: true,
    health: 100,
    happiness: 80,
    education: "Sem escolaridade",
    educationLevel: 0,
    job: "",
    salary: 0,
    bank: 1000,
    debt: 0,
    expenses: 0,
    biologicalParentIds: [],
    adoptiveParentIds: [],
    socialParentIds: [],
    partnerId: null,
    relationshipStatus: "Solteiro/a",
    marriageAge: null,
    childrenCount: 0,
    friends: []
  };

  game = {
    player,
    family: [],
    socialPeople: [],
    events: [],
    financeHistory: [],
    businesses: [],
    year: new Date().getFullYear(),
    started: true
  };

  if (initialFamily.length === 0) {
    const parents = createAutomaticFamily();

    addEvent(
      `Nasceste! A tua mãe, ${getPersonFullName(parents.mother)}, tem ${parents.mother.age} anos e o teu pai, ${getPersonFullName(parents.father)}, tem ${parents.father.age} anos.`
    );
  } else {
    game.family = initialFamily.map(person => ({
      ...createFamilyMember(person),
      ...person,
      id: createId(),
      partnerId: null,
      relationshipStatus: "Solteiro/a",
      marriageAge: null,
      childrenCount: 0
    }));

    connectInitialParents();
    addEvent("Nasceste! A tua família foi criada com os familiares que adicionaste.");
  }

  addFinanceEvent(`Começaste a vida com ${money(player.bank)} na conta bancária.`);

  saveGame();
  showGame();
  renderGame();
  showToast("A tua vida no StarLife começou!");
}

function showGame() {
  $("setupScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");
  $("gameStatus").textContent = "Em jogo";

  installRelationshipsUI();
  showTab("homeTab");
}

function showSetup() {
  $("gameScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");
  $("setupScreen").classList.remove("hidden");
  $("gameStatus").textContent = "Nova vida";
  updateContinuePanel();
}

/* =========================================
   PASSAGEM DO TEMPO
========================================= */

function advanceYear() {
  if (!game || !game.player.alive) return;

  const player = game.player;

  player.age += 1;
  game.year += 1;

  game.family.forEach(person => {
    if (!person.alive) return;

    person.age += 1;

    const risk = person.age < 60
      ? 0.001
      : person.age < 75
        ? 0.008
        : person.age < 85
          ? 0.025
          : person.age < 95
            ? 0.07
            : 0.16;

    if (Math.random() < risk) {
      person.alive = false;

      addEvent(
        `${getPersonFullName(person)} faleceu aos ${person.age} anos.`,
        "negative"
      );

      player.happiness = clamp(player.happiness - 12);
    }
  });

  processFamilyLife();

  // Evolução das personagens conhecidas.
  processSocialLife();
  updateSocialJobs();

  // Saúde e felicidade.
  player.health = clamp(player.health + (Math.random() * 4 - 2));
  player.happiness = clamp(player.happiness + (Math.random() * 6 - 3));

  // Escolaridade.
  if (player.age === 3) {
    addEvent("Começaste a descobrir o mundo e a desenvolver novas capacidades.");
  }

  if (player.age === 6) {
    player.education = "Ensino básico";
    player.educationLevel = 1;
    addEvent("Começaste a escola primária! 🎒");
  }

  if (player.age === 10) {
    addEvent("Estás a crescer e a aprender cada vez mais.");
  }

  if (player.age === 15) {
    addEvent("Estás a aproximar-te de uma nova fase da tua vida.");
  }

  if (player.age === 16) {
    addEvent("Já tens idade para procurar algumas oportunidades de trabalho.");
  }

  if (player.age === 18) {
    player.education = "Ensino secundário";
    player.educationLevel = Math.max(player.educationLevel, 2);
    addEvent("Fizeste 18 anos! Entraste na idade adulta. 🎉");
    addEvent("A partir de agora podes casar, criar um negócio e tomar decisões de adulto/a.");
  }

  // Geração de pessoas novas ao longo da vida.
  ensureSocialPeople();

  // Relação amorosa.
  const partner = getPlayerPartner();

  if (partner && partner.alive) {
    if (player.relationshipStatus === "Namoro" && Math.random() < 0.015) {
      partner.love = clamp(partner.love - 10);
      addEvent(`Tiveste uma discussão com ${getPersonFullName(partner)}.`, "negative");
    } else {
      partner.love = clamp(partner.love + randomNumber(-2, 5));
    }

    if (partner.love < 15 && Math.random() < 0.25) {
      addEvent(`${getPersonFullName(partner)} está a pensar no futuro da vossa relação.`);
    }
  }

  // Rendimentos e despesas.
  let income = player.salary || 0;

  game.businesses.forEach(business => {
    income += business.yearlyProfit || 0;
  });

  if (player.age >= 18) {
    const livingCosts = 1200 + (player.age * 15);
    player.expenses = livingCosts;

    const balance = income - livingCosts;
    player.bank += balance;

    addFinanceEvent(
      `Recebeste ${money(income)} e gastaste ${money(livingCosts)}. Saldo: ${money(balance)}.`
    );

    if (player.bank < 0) {
      player.debt += Math.abs(player.bank);
      player.bank = 0;
      addEvent("Ficaste sem dinheiro e começaste a acumular dívidas.", "negative");
    }
  } else {
    player.expenses = 0;
  }

  if (player.age === 1) {
    addEvent("Completaste o teu primeiro ano de vida! 🎂");
  } else if (player.age > 1 && player.age % 5 === 0) {
    addEvent(`Fizeste ${player.age} anos. Mais um capítulo da tua história! 🎂`);
  }

  if (player.age >= 110) {
    player.alive = false;
    addEvent("A tua vida chegou ao fim. A tua história ficará para sempre registada.", "negative");
    showToast("A tua personagem faleceu.");
  }

  saveGame();
  renderGame();
}

/* =========================================
   CARREIRA E EDUCAÇÃO
========================================= */

const jobs = [
  { name: "Empregado de supermercado", minimumAge: 16, salary: 950, education: 0 },
  { name: "Assistente de loja", minimumAge: 16, salary: 1000, education: 0 },
  { name: "Barbeiro", minimumAge: 18, salary: 14000, education: 1 },
  { name: "Cozinheiro", minimumAge: 18, salary: 15000, education: 1 },
  { name: "Técnico especializado", minimumAge: 20, salary: 22000, education: 2 },
  { name: "Professor", minimumAge: 22, salary: 26000, education: 3 }
];

function applyForJob(index) {
  const job = jobs[index];
  const player = game.player;

  if (player.age < job.minimumAge) {
    showToast(`Precisas de ter pelo menos ${job.minimumAge} anos.`);
    return;
  }

  if (player.educationLevel < job.education) {
    showToast("Ainda não tens a escolaridade necessária.");
    return;
  }

  player.job = job.name;
  player.salary = job.salary;

  addEvent(`Conseguiste um emprego como ${job.name}!`);
  addFinanceEvent(`Começaste a trabalhar como ${job.name}, com um salário anual de ${money(job.salary)}.`);

  saveGame();
  renderGame();
  showToast("Conseguiste um novo emprego!");
}

function startEducation(level, name, minimumAge) {
  const player = game.player;

  if (player.age < minimumAge) {
    showToast(`Esta opção está disponível a partir dos ${minimumAge} anos.`);
    return;
  }

  if (player.educationLevel >= level) {
    showToast("Já tens este nível de escolaridade ou superior.");
    return;
  }

  player.education = name;
  player.educationLevel = level;

  addEvent(`Concluíste uma etapa de educação: ${name}.`);

  saveGame();
  renderGame();
  showToast("Educação atualizada!");
}

function renderCareer() {
  const player = game.player;

  $("careerJob").textContent = player.job || "Nenhuma";
  $("careerSalary").textContent = money(player.salary || 0);
  $("careerEducation").textContent = player.education;

  $("careerDescription").textContent = player.job
    ? `Trabalhas como ${player.job}. Continua a desenvolver a tua carreira.`
    : "Ainda não tens uma profissão. Podes procurar oportunidades quando tiveres idade.";

  const jobContainer = $("jobOptions");
  jobContainer.innerHTML = "";

  jobs.forEach((job, index) => {
    const button = document.createElement("button");
    button.className = "secondary-btn";
    button.textContent = `${job.name} · ${money(job.salary)}/ano · ${job.minimumAge}+`;
    button.disabled = player.age < job.minimumAge ||
      player.educationLevel < job.education;

    button.addEventListener("click", () => applyForJob(index));
    jobContainer.appendChild(button);
  });

  const educationContainer = $("educationOptions");
  educationContainer.innerHTML = "";

  [
    { level: 1, name: "Ensino básico", age: 6 },
    { level: 2, name: "Ensino secundário", age: 15 },
    { level: 3, name: "Ensino superior", age: 18 }
  ].forEach(choice => {
    const button = document.createElement("button");
    button.className = "secondary-btn";
    button.textContent = `${choice.name} · ${choice.age}+ anos`;
    button.disabled = player.age < choice.age ||
      player.educationLevel >= choice.level;

    button.addEventListener("click", () => {
      startEducation(choice.level, choice.name, choice.age);
    });

    educationContainer.appendChild(button);
  });
}

/* =========================================
   NEGÓCIOS
========================================= */

function createBusiness() {
  if (game.player.age < 18) {
    showToast("Tens de ter pelo menos 18 anos para criar um negócio.");
    return;
  }

  const name = prompt("Qual será o nome do teu negócio?");
  if (!name || !name.trim()) return;

  const investmentText = prompt("Quanto queres investir inicialmente? (mínimo 500 €)");
  if (investmentText === null) return;

  const investment = Number(investmentText);

  if (!Number.isFinite(investment) || investment < 500) {
    showToast("O investimento mínimo é de 500 €.");
    return;
  }

  if (game.player.bank < investment) {
    showToast("Não tens dinheiro suficiente na conta bancária.");
    return;
  }

  game.player.bank -= investment;

  const business = {
    id: createId(),
    name: name.trim(),
    investment,
    yearlyProfit: Math.round(investment * 0.15),
    createdAtAge: game.player.age
  };

  game.businesses.push(business);

  addEvent(`Abriste o negócio "${business.name}"!`);
  addFinanceEvent(`Investiste ${money(investment)} na criação de "${business.name}".`);

  saveGame();
  renderGame();
  showToast("Negócio criado!");
}

function renderBusinesses() {
  const container = $("businessList");
  container.innerHTML = "";

  if (!game.businesses.length) {
    container.innerHTML = "<p class='muted'>Ainda não tens negócios. Cria o teu primeiro negócio!</p>";
    return;
  }

  game.businesses.forEach(business => {
    const card = document.createElement("div");
    card.className = "business-card";

    card.innerHTML = `
      <strong>${escapeHTML(business.name)}</strong>
      <p>Investimento inicial: ${money(business.investment)}</p>
      <p>Lucro anual estimado: <strong>${money(business.yearlyProfit)}</strong></p>
    `;

    container.appendChild(card);
  });
}

/* =========================================
   PATRIMÓNIO E PERFIL
========================================= */

function calculateWealth() {
  const businessValue = game.businesses.reduce(
    (total, business) => total + business.investment,
    0
  );

  return game.player.bank + businessValue - game.player.debt;
}

function renderPatrimony() {
  const player = game.player;

  $("totalWealth").textContent = money(calculateWealth());
  $("bankBalance").textContent = money(player.bank);
  $("annualSalary").textContent = money(player.salary);
  $("annualExpenses").textContent = money(player.expenses);
  $("debtValue").textContent = money(player.debt);

  const container = $("financeHistory");
  container.innerHTML = "";

  if (!game.financeHistory.length) {
    container.innerHTML = "<p class='muted'>Ainda não existem movimentos financeiros.</p>";
    return;
  }

  game.financeHistory.forEach(item => {
    const element = document.createElement("div");
    element.className = "event-item neutral";
    element.innerHTML = `
      ${escapeHTML(item.message)}
      <small>Idade: ${item.age} anos</small>
    `;
    container.appendChild(element);
  });
}

function renderProfile() {
  const player = game.player;

  $("profileDetails").innerHTML = `
    <div class="info-row"><span>Nome</span><strong>${escapeHTML(getPersonFullName(player))}</strong></div>
    <div class="info-row"><span>Sexo</span><strong>${escapeHTML(player.sex)}</strong></div>
    <div class="info-row"><span>Idade</span><strong>${player.age} anos</strong></div>
    <div class="info-row"><span>País</span><strong>${escapeHTML(player.country)}</strong></div>
    <div class="info-row"><span>Cidade</span><strong>${escapeHTML(player.city)}</strong></div>
    <div class="info-row"><span>Estado</span><strong>${player.alive ? "Vivo/a" : "Falecido/a"}</strong></div>
    <div class="info-row"><span>Profissão</span><strong>${escapeHTML(player.job || "Nenhuma")}</strong></div>
    <div class="info-row"><span>Estado amoroso</span><strong>${escapeHTML(player.relationshipStatus || "Solteiro/a")}</strong></div>
    <div class="info-row"><span>Património</span><strong>${money(calculateWealth())}</strong></div>
  `;
}

/* =========================================
   ECRÃ INICIAL E ACONTECIMENTOS
========================================= */

function renderHome() {
  const player = game.player;

  $("homePlayerName").textContent = getPersonFullName(player);
  $("homePlayerLocation").textContent = `${player.city}, ${player.country}`;
  $("homeAge").textContent = player.age;

  $("healthValue").textContent = `${Math.round(player.health)}%`;
  $("happinessValue").textContent = `${Math.round(player.happiness)}%`;

  $("healthBar").style.width = `${player.health}%`;
  $("happinessBar").style.width = `${player.happiness}%`;

  $("educationValue").textContent = player.education;
  $("jobValue").textContent = player.job || "Sem profissão";

  if (!player.alive) {
    $("lifeSummary").textContent = "A tua personagem já faleceu. Podes consultar a história e começar uma nova vida nas Definições.";
    $("advanceYearBtn").disabled = true;
  } else {
    $("advanceYearBtn").disabled = false;

    if (player.age === 0) {
      $("lifeSummary").textContent = "Acabaste de nascer. A tua aventura começa agora!";
    } else if (player.age < 6) {
      $("lifeSummary").textContent = "Estás a viver os primeiros anos da tua infância.";
    } else if (player.age < 13) {
      $("lifeSummary").textContent = "Estás na infância, a crescer e a descobrir o mundo.";
    } else if (player.age < 18) {
      $("lifeSummary").textContent = "Estás na adolescência. Muitas decisões importantes aproximam-se.";
    } else if (player.age < 30) {
      $("lifeSummary").textContent = "És adulto/a e estás a construir o teu próprio caminho.";
    } else {
      $("lifeSummary").textContent = "A tua vida continua a evoluir. Cada decisão pode mudar o teu futuro.";
    }
  }

  const eventsContainer = $("recentEvents");
  eventsContainer.innerHTML = "";

  if (!game.events.length) {
    eventsContainer.innerHTML = "<p class='muted'>Ainda não existem acontecimentos.</p>";
  } else {
    game.events.slice(0, 8).forEach(event => {
      const element = document.createElement("div");
      element.className = `event-item ${event.type || "neutral"}`;
      element.innerHTML = `
        ${escapeHTML(event.message)}
        <small>Idade: ${event.age} anos</small>
      `;
      eventsContainer.appendChild(element);
    });
  }
}

/* =========================================
   RENDERIZAÇÃO GERAL
========================================= */

function renderGame() {
  if (!game) return;

  installRelationshipsUI();

  renderHome();
  renderPatrimony();
  renderCareer();
  renderBusinesses();
  renderPeople();
  renderFamilyTree();
  renderProfile();
  renderFamilyEditor();
  renderRelationships();

  $("gameStatus").textContent = game.player.alive
    ? `${game.player.age} anos`
    : "Vida terminada";
}

/* =========================================
   NAVEGAÇÃO
========================================= */

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.add("hidden");
  });

  const selected = $(tabId);
  if (selected) selected.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================
   FAMÍLIA INICIAL
========================================= */

function addInitialFamilyMember() {
  const name = $("initialFamilyName").value.trim();
  const relation = $("initialFamilyRelation").value;
  const ageText = $("initialFamilyAge").value;
  const sex = $("initialFamilySex").value;

  if (!name || ageText === "") {
    showToast("Indica o nome e a idade do familiar.");
    return;
  }

  const age = Number(ageText);

  if (!Number.isFinite(age) || age < 0 || age > 110) {
    showToast("A idade tem de estar entre 0 e 110 anos.");
    return;
  }

  initialFamily.push({
    name,
    surname: "",
    relation,
    age: Math.floor(age),
    sex
  });

  $("initialFamilyName").value = "";
  $("initialFamilyAge").value = "";

  renderInitialFamily();
  showToast("Familiar adicionado!");
}

function renderInitialFamily() {
  const container = $("initialFamilyList");
  container.innerHTML = "";

  initialFamily.forEach((person, index) => {
    const item = document.createElement("div");
    item.className = "family-item";

    item.innerHTML = `
      <div>
        <strong>${escapeHTML(person.name)}</strong>
        <small>${escapeHTML(person.relation)} · ${person.age} anos</small>
      </div>
      <button class="small-btn" data-remove-initial="${index}">Remover</button>
    `;

    container.appendChild(item);
  });

  container.querySelectorAll("[data-remove-initial]").forEach(button => {
    button.addEventListener("click", () => {
      initialFamily.splice(Number(button.dataset.removeInitial), 1);
      renderInitialFamily();
    });
  });
}

/* =========================================
   DEFINIÇÕES E GRAVAÇÕES
========================================= */

function openFamilyEditor() {
  $("familyEditor").classList.remove("hidden");
  renderFamilyEditor();
  $("familyEditor").scrollIntoView({ behavior: "smooth" });
}

function newLife() {
  if (!confirm("Tens a certeza de que queres começar uma nova vida? A gravação atual será substituída.")) {
    return;
  }

  game = null;
  initialFamily = [];

  localStorage.removeItem(SAVE_KEY);

  $("startForm").reset();
  $("playerCountry").value = "Portugal";
  $("initialFamilyList").innerHTML = "";
  $("familyEditor").classList.add("hidden");

  showSetup();
  showToast("Podes criar uma nova personagem.");
}

function exportSave() {
  if (!game) return;

  const data = JSON.stringify(game, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "starlife-gravacao.json";
  link.click();

  URL.revokeObjectURL(url);
  showToast("Gravação exportada!");
}

function migrateGameData() {
  if (!game) return;

  const player = game.player;

  player.health ??= 100;
  player.happiness ??= 80;
  player.bank ??= 0;
  player.debt ??= 0;
  player.salary ??= 0;
  player.expenses ??= 0;
  player.education ??= "Sem escolaridade";
  player.educationLevel ??= 0;

  player.biologicalParentIds ??= [];
  player.adoptiveParentIds ??= [];
  player.socialParentIds ??= [];

  player.partnerId ??= null;
  player.relationshipStatus ??= "Solteiro/a";
  player.marriageAge ??= null;
  player.childrenCount ??= 0;
  player.friends ??= [];

  game.events ??= [];
  game.financeHistory ??= [];
  game.businesses ??= [];
  game.socialPeople ??= [];

  game.family.forEach(person => {
    person.biologicalParentIds ??= [];
    person.adoptiveParentIds ??= [];
    person.socialParentIds ??= [];
    person.relationship ??= 70;
    person.alive ??= true;
    person.partnerId ??= null;
    person.relationshipStatus ??= "Solteiro/a";
    person.marriageAge ??= null;
    person.childrenCount ??= 0;
    person.job ??= "";
    person.salary ??= 0;
  });

  game.socialPeople.forEach(person => {
    person.alive ??= true;
    person.personality ??= randomFrom(personalities);
    person.interests ??= [randomFrom(interests)];
    person.compatibility ??= randomNumber(35, 95);
    person.friendship ??= 0;
    person.love ??= 0;
    person.status ??= "Conhecido/a";
    person.partnerId ??= null;
    person.relationshipStatus ??= "Solteiro/a";
    person.job ??= "";
    person.salary ??= 0;
    person.childrenCount ??= 0;
  });
}

function importSave(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);

      if (!imported.player || !Array.isArray(imported.family)) {
        throw new Error("Ficheiro inválido");
      }

      game = imported;
      migrateGameData();

      saveGame();
      showGame();
      renderGame();
      showToast("Gravação importada com sucesso!");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível importar este ficheiro.");
    }
  };

  reader.readAsText(file);
}

/* =========================================
   EVENTOS E INICIALIZAÇÃO
========================================= */

function boot() {
  $("startForm").addEventListener("submit", event => {
    event.preventDefault();
    startGame();
  });

  $("addInitialFamilyBtn").addEventListener("click", addInitialFamilyMember);

  $("continueGameBtn").addEventListener("click", () => {
    const saved = loadGame();

    if (!saved) {
      showToast("Não existe nenhuma gravação válida.");
      return;
    }

    game = saved;
    migrateGameData();

    saveGame();
    showGame();
    renderGame();
  });

  $("deleteSaveBtn").addEventListener("click", () => {
    if (!confirm("Queres apagar a gravação guardada?")) return;

    localStorage.removeItem(SAVE_KEY);
    updateContinuePanel();
    showToast("Gravação apagada.");
  });

  $("advanceYearBtn").addEventListener("click", advanceYear);
  $("createBusinessBtn").addEventListener("click", createBusiness);
  $("showFamilyEditorBtn").addEventListener("click", openFamilyEditor);

  $("closeFamilyEditorBtn").addEventListener("click", () => {
    $("familyEditor").classList.add("hidden");
  });

  $("familyForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("familyName").value.trim();
    const surname = $("familySurname").value.trim();
    const relation = $("familyRelation").value;
    const age = Number($("familyAge").value);
    const sex = $("familySex").value;
    const linkType = $("familyLinkType").value;

    if (!name || !Number.isFinite(age) || age < 0 || age > 110) {
      showToast("Preenche corretamente os dados do familiar.");
      return;
    }

    addFamilyMember({
      name,
      surname,
      relation,
      age,
      sex
    }, linkType);

    $("familyForm").reset();
  });

  $("newLifeBtn").addEventListener("click", newLife);
  $("exportSaveBtn").addEventListener("click", exportSave);

  $("importSaveInput").addEventListener("change", event => {
    importSave(event.target.files[0]);
    event.target.value = "";
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      showTab(button.dataset.tab);
    });
  });

  updateContinuePanel();

  const saved = loadGame();

  if (saved) {
    $("continuePanel").classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", boot);
