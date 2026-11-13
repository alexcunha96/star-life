
"use strict";

/* =========================
   STARLIFE - FASE 2
   Família e árvore genealógica
========================= */

const SAVE_KEY = "starlife_save_v2";

let game = null;
let activeTab = "home";
let editingFamilyId = null;
let initialFamily = [];

const $ = (id) => document.getElementById(id);

const money = (value) => new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: game?.currency || "EUR",
  maximumFractionDigits: 0
}).format(value || 0);

const makeId = () => "p_" + Date.now().toString(36) + "_" +
  Math.random().toString(36).slice(2, 8);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function saveGame() {
  if (!game) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.player || !Array.isArray(data.family)) return null;

    data.family = data.family.map(person => ({
      ...person,
      biologicalParentIds: Array.isArray(person.biologicalParentIds)
        ? person.biologicalParentIds : [],
      adoptiveParentIds: Array.isArray(person.adoptiveParentIds)
        ? person.adoptiveParentIds : [],
      socialParentIds: Array.isArray(person.socialParentIds)
        ? person.socialParentIds : []
    }));

    data.notifications ||= [];
    data.businesses ||= [];
    data.year ||= new Date().getFullYear();
    data.player.money ??= 1000;
    data.player.health ??= 100;
    data.player.happiness ??= 80;
    data.player.age ??= 18;
    data.player.job ||= "Desempregado";
    data.player.salary ??= 0;
    data.player.education ||= "Ensino básico";
    data.player.firstName ||= "";
    data.player.lastName ||= "";
    data.player.id ||= "player";
    return data;
  } catch (error) {
    console.error("Erro ao carregar gravação:", error);
    return null;
  }
}

function notify(message) {
  if (!game) return;
  game.notifications.unshift({
    id: makeId(),
    year: game.year,
    message
  });
  game.notifications = game.notifications.slice(0, 40);
  saveGame();
}

function allPeople() {
  if (!game) return [];
  return [{
    id: game.player.id,
    name: `${game.player.firstName} ${game.player.lastName}`.trim(),
    sex: game.player.sex,
    age: game.player.age,
    relation: "Jogador",
    isPlayer: true,
    biologicalParentIds: game.player.biologicalParentIds || [],
    adoptiveParentIds: game.player.adoptiveParentIds || [],
    socialParentIds: game.player.socialParentIds || []
  }, ...game.family];
}

function getPerson(id) {
  return allPeople().find(person => person.id === id);
}

function personName(id) {
  const person = getPerson(id);
  return person ? person.name : "Pessoa desconhecida";
}

function relationLabel(person) {
  const labels = {
    father: "Pai",
    mother: "Mãe",
    brother: "Irmão",
    sister: "Irmã",
    halfSibling: "Meio-irmão / meia-irmã",
    stepfather: "Padrasto",
    stepmother: "Madrasta",
    son: "Filho",
    daughter: "Filha",
    grandfather: "Avô",
    grandmother: "Avó",
    uncle: "Tio",
    aunt: "Tia",
    cousin: "Primo / prima",
    partner: "Companheiro(a)",
    friend: "Amigo(a)",
    other: "Outro familiar"
  };
  return labels[person.relation] || person.customRelation || "Familiar";
}

function sexEmoji(sex) {
  if (sex === "Feminino") return "👩";
  if (sex === "Masculino") return "👨";
  return "🧑";
}

/* =========================
   CRIAÇÃO DE PERSONAGEM
========================= */

function validateStart() {
  const first = $("playerFirstName").value.trim();
  const last = $("playerLastName").value.trim();
  const sex = $("playerSex").value;
  const age = Number($("playerAge").value);
  const country = $("playerCountry").value.trim();
  const city = $("playerCity").value.trim();

  const valid = first && last && sex && Number.isInteger(age) &&
    age >= 0 && age <= 100 && country && city;

  $("startButton").disabled = !valid;
  $("startError").textContent = valid
    ? ""
    : "Preenche todos os campos obrigatórios para começares a tua vida.";
}

["playerFirstName", "playerLastName", "playerSex", "playerAge",
  "playerCountry", "playerCity"].forEach(id => {
  $(id).addEventListener("input", validateStart);
  $(id).addEventListener("change", validateStart);
});

function startGame() {
  validateStart();
  if ($("startButton").disabled) return;

  const currentYear = new Date().getFullYear();
  const playerAge = Number($("playerAge").value);

  game = {
    version: 2,
    year: currentYear,
    currency: "EUR",
    player: {
      id: "player",
      firstName: $("playerFirstName").value.trim(),
      lastName: $("playerLastName").value.trim(),
      sex: $("playerSex").value,
      age: playerAge,
      country: $("playerCountry").value.trim(),
      city: $("playerCity").value.trim(),
      money: 1000,
      health: 100,
      happiness: 80,
      job: "Desempregado",
      salary: 0,
      education: "Ensino básico",
      biologicalParentIds: [],
      adoptiveParentIds: [],
      socialParentIds: []
    },
    family: initialFamily,
    businesses: [],
    notifications: [],
    createdAt: Date.now()
  };

  initialFamily.forEach(person => {
    person.biologicalParentIds ||= [];
    person.adoptiveParentIds ||= [];
    person.socialParentIds ||= [];
  });

  $("startScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");

  notify("A tua história no StarLife começou!");
  activeTab = "home";
  render();
}

$("startButton").addEventListener("click", startGame);

/* =========================
   MODAL
========================= */

function openModal(title, content) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = content;
  $("modal").classList.remove("hidden");
}

function closeModal() {
  $("modal").classList.add("hidden");
  editingFamilyId = null;
}

$("closeModal").addEventListener("click", closeModal);
document.querySelector("[data-close-modal]").addEventListener("click", closeModal);

function parentOptions(selected = []) {
  return allPeople()
    .filter(person => !person.isPlayer || !game.player.isDeceased)
    .map(person => `
      <option value="${escapeHTML(person.id)}"
        ${selected.includes(person.id) ? "selected" : ""}>
        ${escapeHTML(person.name)}
      </option>
    `).join("");
}

/* =========================
   ADICIONAR / EDITAR FAMILIA
========================= */

function familyForm(person = null) {
  const editing = !!person;
  const biological = person?.biologicalParentIds || [];
  const adoptive = person?.adoptiveParentIds || [];
  const social = person?.socialParentIds || [];

  return `
    <form id="familyForm">
      <label>Nome completo
        <input id="familyName" maxlength="60" required
          value="${escapeHTML(person?.name || "")}" placeholder="Nome do familiar">
      </label>

      <label>Sexo
        <select id="familySex" required>
          <option value="">Selecionar</option>
          <option ${person?.sex === "Masculino" ? "selected" : ""}>Masculino</option>
          <option ${person?.sex === "Feminino" ? "selected" : ""}>Feminino</option>
          <option ${person?.sex === "Outro" ? "selected" : ""}>Outro</option>
        </select>
      </label>

      <label>Parentesco
        <select id="familyRelation" required>
          ${[
            ["father", "Pai"], ["mother", "Mãe"],
            ["brother", "Irmão"], ["sister", "Irmã"],
            ["halfSibling", "Meio-irmão / meia-irmã"],
            ["stepfather", "Padrasto"], ["stepmother", "Madrasta"],
            ["son", "Filho"], ["daughter", "Filha"],
            ["grandfather", "Avô"], ["grandmother", "Avó"],
            ["uncle", "Tio"], ["aunt", "Tia"],
            ["cousin", "Primo / prima"],
            ["partner", "Companheiro(a)"],
            ["friend", "Amigo(a)"], ["other", "Outro"]
          ].map(([value, label]) => `
            <option value="${value}"
              ${person?.relation === value ? "selected" : ""}>
              ${label}
            </option>
          `).join("")}
        </select>
      </label>

      <label>Ou especifica o parentesco
        <input id="customRelation" maxlength="40"
          value="${escapeHTML(person?.customRelation || "")}"
          placeholder="Ex.: bisavó, sobrinho, cunhado...">
      </label>

      <label>Idade
        <input id="familyAge" type="number" min="0" max="120"
          required value="${person?.age ?? 30}">
      </label>

      <label>Relação biológica — progenitores
        <select id="biologicalParents" multiple size="4">
          ${parentOptions(biological)}
        </select>
        <small class="muted">Podes selecionar até duas pessoas. No iPhone, mantém o toque para selecionar várias.</small>
      </label>

      <label>Relação adotiva — progenitores
        <select id="adoptiveParents" multiple size="4">
          ${parentOptions(adoptive)}
        </select>
      </label>

      <label>Relação social — padrasto, madrasta ou figura parental
        <select id="socialParents" multiple size="4">
          ${parentOptions(social)}
        </select>
      </label>

      <div class="form-actions">
        <button type="button" id="cancelFamily">Cancelar</button>
        <button type="submit" class="primary">${editing ? "Guardar alterações" : "Adicionar familiar"}</button>
      </div>
    </form>
  `;
}

function selectedValues(selectId) {
  return Array.from($(selectId).selectedOptions).map(option => option.value);
}

function wouldCreateCycle(personId, proposedParents) {
  function reaches(startId, targetId, visited = new Set()) {
    if (startId === targetId) return true;
    if (visited.has(startId)) return false;
    visited.add(startId);

    const person = getPerson(startId);
    if (!person) return false;

    const parents = [
      ...(person.biologicalParentIds || []),
      ...(person.adoptiveParentIds || []),
      ...(person.socialParentIds || [])
    ];

    return parents.some(id => reaches(id, targetId, visited));
  }

  return proposedParents.some(parentId =>
    parentId === personId || reaches(parentId, personId)
  );
}

function showFamilyForm(person = null) {
  editingFamilyId = person?.id || null;
  openModal(person ? "Editar familiar" : "Adicionar familiar", familyForm(person));

  $("cancelFamily").addEventListener("click", closeModal);

  $("familyForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("familyName").value.trim();
    const sex = $("familySex").value;
    const relation = $("familyRelation").value;
    const customRelation = $("customRelation").value.trim();
    const age = Number($("familyAge").value);

    if (!name || !sex || !Number.isInteger(age) || age < 0 || age > 120) {
      alert("Confirma o nome, sexo e idade.");
      return;
    }

    const biologicalParentIds = selectedValues("biologicalParents");
    const adoptiveParentIds = selectedValues("adoptiveParents");
    const socialParentIds = selectedValues("socialParents");

    if (biologicalParentIds.length > 2) {
      alert("Uma pessoa pode ter no máximo dois progenitores biológicos.");
      return;
    }

    const allParents = [
      ...biologicalParentIds,
      ...adoptiveParentIds,
      ...socialParentIds
    ];

    if (new Set(allParents).size !== allParents.length) {
      alert("A mesma pessoa não pode estar repetida em diferentes tipos de ligação parental.");
      return;
    }

    const id = person?.id || makeId();

    if (wouldCreateCycle(id, allParents)) {
      alert("Esta ligação criaria um ciclo na árvore genealógica. Verifica os progenitores selecionados.");
      return;
    }

    const updated = {
      id,
      name,
      sex,
      age,
      relation,
      customRelation,
      biologicalParentIds,
      adoptiveParentIds,
      socialParentIds
    };

    if (person) {
      const index = game.family.findIndex(item => item.id === id);
      if (index !== -1) game.family[index] = updated;
      notify(`${name} foi atualizado(a) na tua família.`);
    } else {
      game.family.push(updated);
      notify(`${name} foi adicionado(a) à tua família.`);
    }

    saveGame();
    closeModal();
    render();
  });
}

function removeFamilyMember(id) {
  const person = game.family.find(item => item.id === id);
  if (!person) return;

  if (!confirm(`Queres mesmo remover ${person.name} da tua família?`)) return;

  game.family = game.family.filter(item => item.id !== id);

  // Limpa as ligações que apontavam para a pessoa removida.
  game.family.forEach(item => {
    item.biologicalParentIds = item.biologicalParentIds.filter(parent => parent !== id);
    item.adoptiveParentIds = item.adoptiveParentIds.filter(parent => parent !== id);
    item.socialParentIds = item.socialParentIds.filter(parent => parent !== id);
  });

  ["biologicalParentIds", "adoptiveParentIds", "socialParentIds"].forEach(key => {
    game.player[key] = (game.player[key] || []).filter(parent => parent !== id);
  });

  notify(`${person.name} foi removido(a) da árvore familiar.`);
  saveGame();
  render();
}

/* =========================
   FAMÍLIA ANTES DO JOGO
========================= */

function renderInitialFamily() {
  const container = $("initialFamilyList");

  if (!initialFamily.length) {
    container.innerHTML = `<div class="empty">Ainda não adicionaste familiares.</div>`;
    return;
  }

  container.innerHTML = initialFamily.map(person => `
    <div class="person-row">
      <div class="person-main">
        <div class="avatar">${sexEmoji(person.sex)}</div>
        <div>
          <div class="person-name">${escapeHTML(person.name)}</div>
          <div class="person-sub">${escapeHTML(relationLabel(person))} · ${person.age} anos</div>
        </div>
      </div>
      <div class="row-actions">
        <button data-edit-initial="${person.id}">Editar</button>
        <button class="danger-button" data-remove-initial="${person.id}">✕</button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll("[data-edit-initial]").forEach(button => {
    button.addEventListener("click", () => {
      const person = initialFamily.find(item => item.id === button.dataset.editInitial);
      showInitialFamilyForm(person);
    });
  });

  container.querySelectorAll("[data-remove-initial]").forEach(button => {
    button.addEventListener("click", () => {
      initialFamily = initialFamily.filter(item => item.id !== button.dataset.removeInitial);
      renderInitialFamily();
    });
  });
}

function showInitialFamilyForm(person = null) {
  openModal(person ? "Editar familiar" : "Adicionar familiar", `
    <form id="initialForm">
      <label>Nome completo
        <input id="initialName" required maxlength="60"
          value="${escapeHTML(person?.name || "")}">
      </label>
      <label>Sexo
        <select id="initialSex" required>
          <option value="">Selecionar</option>
          <option ${person?.sex === "Masculino" ? "selected" : ""}>Masculino</option>
          <option ${person?.sex === "Feminino" ? "selected" : ""}>Feminino</option>
          <option ${person?.sex === "Outro" ? "selected" : ""}>Outro</option>
        </select>
      </label>
      <label>Parentesco
        <input id="initialRelation" required placeholder="Ex.: Pai, irmã, avó..."
          value="${escapeHTML(person?.customRelation || "")}">
      </label>
      <label>Idade
        <input id="initialAge" type="number" min="0" max="120" required
          value="${person?.age ?? 30}">
      </label>
      <div class="form-actions">
        <button type="button" id="cancelInitial">Cancelar</button>
        <button type="submit" class="primary">Guardar</button>
      </div>
    </form>
  `);

  $("cancelInitial").addEventListener("click", closeModal);

  $("initialForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("initialName").value.trim();
    const sex = $("initialSex").value;
    const customRelation = $("initialRelation").value.trim();
    const age = Number($("initialAge").value);

    if (!name || !sex || !customRelation || !Number.isInteger(age) || age < 0 || age > 120) {
      alert("Preenche todos os campos corretamente.");
      return;
    }

    const entry = {
      id: person?.id || makeId(),
      name, sex, age,
      relation: "other",
      customRelation,
      biologicalParentIds: [],
      adoptiveParentIds: [],
      socialParentIds: []
    };

    if (person) {
      const index = initialFamily.findIndex(item => item.id === person.id);
      if (index !== -1) initialFamily[index] = entry;
    } else {
      initialFamily.push(entry);
    }

    closeModal();
    renderInitialFamily();
  });
}

$("addInitialFamily").addEventListener("click", () => showInitialFamilyForm());

/* =========================
   NAVEGAÇÃO E RENDERIZAÇÃO
========================= */

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    render();
  });
});

function render() {
  if (!game) return;

  $("yearLabel").textContent = game.year;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });

  const pages = {
    home: renderHome,
    wealth: renderWealth,
    career: renderCareer,
    business: renderBusiness,
    people: renderPeople,
    shop: renderShop,
    profile: renderProfile,
    settings: renderSettings
  };

  $("tabContent").innerHTML = (pages[activeTab] || renderHome)();
  attachPageEvents();
}

/* =========================
   INÍCIO
========================= */

function renderHome() {
  const player = game.player;
  const latest = game.notifications.slice(0, 5);

  return `
    <h2 class="page-title">A tua vida</h2>

    <div class="panel">
      <div class="person-main">
        <div class="avatar" style="width:54px;height:54px;font-size:25px">
          ${sexEmoji(player.sex)}
        </div>
        <div>
          <strong>${escapeHTML(player.firstName)} ${escapeHTML(player.lastName)}</strong>
          <div class="person-sub">${player.age} anos · ${escapeHTML(player.city)}, ${escapeHTML(player.country)}</div>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><small>Património disponível</small><strong>${money(player.money)}</strong></div>
      <div class="stat-card"><small>Saúde</small><strong>${player.health}%</strong></div>
      <div class="stat-card"><small>Felicidade</small><strong>${player.happiness}%</strong></div>
      <div class="stat-card"><small>Profissão</small><strong>${escapeHTML(player.job)}</strong></div>
    </div>

    <div class="panel" style="margin-top:15px">
      <h3>Avançar no tempo</h3>
      <p class="muted">Cada ano traz mudanças à tua vida e à vida dos teus familiares.</p>
      <button class="primary" data-action="advance">Avançar um ano →</button>
    </div>

    <div class="panel">
      <h3>Últimos acontecimentos</h3>
      ${latest.length ? latest.map(item => `
        <div class="event-row">
          <div>
            <div>${escapeHTML(item.message)}</div>
            <div class="person-sub">Ano ${item.year}</div>
          </div>
        </div>
      `).join("") : `<div class="empty">Ainda não existem acontecimentos.</div>`}
    </div>
  `;
}

/* =========================
   PATRIMÓNIO
========================= */

function renderWealth() {
  const player = game.player;
  const businessValue = game.businesses.reduce((sum, item) => sum + item.value, 0);

  return `
    <h2 class="page-title">Património</h2>
    <div class="stat-grid">
      <div class="stat-card"><small>Dinheiro disponível</small><strong>${money(player.money)}</strong></div>
      <div class="stat-card"><small>Negócios</small><strong>${money(businessValue)}</strong></div>
      <div class="stat-card"><small>Salário anual</small><strong>${money(player.salary)}</strong></div>
      <div class="stat-card"><small>Património estimado</small><strong>${money(player.money + businessValue)}</strong></div>
    </div>
    <div class="panel" style="margin-top:15px">
      <h3>Resumo financeiro</h3>
      <div class="stat-row"><span>Profissão</span><strong>${escapeHTML(player.job)}</strong></div>
      <div class="stat-row"><span>Rendimento anual</span><strong>${money(player.salary)}</strong></div>
      <div class="stat-row"><span>Negócios ativos</span><strong>${game.businesses.length}</strong></div>
      <p class="muted">Os sistemas avançados de despesas, impostos, crédito e investimentos serão desenvolvidos nas próximas fases.</p>
    </div>
  `;
}

/* =========================
   CARREIRA
========================= */

function renderCareer() {
  return `
    <h2 class="page-title">Carreira</h2>
    <div class="panel">
      <h3>O teu percurso profissional</h3>
      <div class="stat-row"><span>Profissão atual</span><strong>${escapeHTML(game.player.job)}</strong></div>
      <div class="stat-row"><span>Salário anual</span><strong>${money(game.player.salary)}</strong></div>
      <div class="stat-row"><span>Educação</span><strong>${escapeHTML(game.player.education)}</strong></div>
    </div>
    <div class="panel">
      <h3>Oportunidades de emprego</h3>
      ${[
        ["Comércio", 12000], ["Restauração", 11000],
        ["Barbeiro", 15000], ["Programador", 26000],
        ["Professor", 19000], ["Gestor", 30000]
      ].map(([job, salary]) => `
        <div class="person-row">
          <div>
            <div class="person-name">${job}</div>
            <div class="person-sub">${money(salary)} por ano</div>
          </div>
          <button data-job="${job}" data-salary="${salary}">Candidatar</button>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================
   NEGÓCIOS
========================= */

function renderBusiness() {
  return `
    <h2 class="page-title">Negócios</h2>
    <div class="panel">
      <h3>Criar um negócio</h3>
      <p class="muted">Investe dinheiro para começar uma atividade empresarial.</p>
      <button class="primary" data-action="createBusiness">＋ Abrir negócio (5.000 €)</button>
    </div>
    <div class="panel">
      <h3>Os teus negócios</h3>
      ${game.businesses.length ? game.businesses.map(item => `
        <div class="person-row">
          <div>
            <div class="person-name">${escapeHTML(item.name)}</div>
            <div class="person-sub">Valor: ${money(item.value)} · Lucro anual: ${money(item.profit)}</div>
          </div>
        </div>
      `).join("") : `<div class="empty">Ainda não tens negócios.</div>`}
    </div>
  `;
}

/* =========================
   PESSOAS E ÁRVORE
========================= */

function renderPeople() {
  const family = game.family;

  return `
    <h2 class="page-title">Pessoas</h2>
    <div class="panel">
      <div class="panel-heading">
        <h3>A tua família</h3>
        <span class="muted">${family.length} pessoas</span>
      </div>
      ${family.length ? family.map(person => `
        <div class="person-row">
          <div class="person-main">
            <div class="avatar">${sexEmoji(person.sex)}</div>
            <div>
              <div class="person-name">${escapeHTML(person.name)}</div>
              <div class="person-sub">${escapeHTML(relationLabel(person))} · ${person.age} anos</div>
            </div>
          </div>
        </div>
      `).join("") : `<div class="empty">Ainda não adicionaste familiares. Podes fazê-lo nas Definições.</div>`}
    </div>

    <div class="panel">
      <h3>Árvore genealógica</h3>
      <p class="muted">Consulta as ligações familiares. Desliza horizontalmente se a árvore for maior do que o ecrã.</p>
      ${renderFamilyTree()}
    </div>
  `;
}

function renderFamilyTree() {
  const people = allPeople();
  const player = people.find(person => person.isPlayer);

  if (people.length === 1) {
    return `<div class="empty">Adiciona familiares para começares a construir a tua árvore.</div>`;
  }

  const generations = new Map();
  const visiting = new Set();

  function getGeneration(person, depth = 0) {
    if (depth > 12 || visiting.has(person.id)) return 0;
    visiting.add(person.id);

    const parents = [
      ...(person.biologicalParentIds || []),
      ...(person.adoptiveParentIds || [])
    ].map(id => people.find(p => p.id === id)).filter(Boolean);

    let result = 0;
    if (parents.length) {
      result = Math.max(...parents.map(parent => getGeneration(parent, depth + 1))) + 1;
    }

    visiting.delete(person.id);
    return result;
  }

  people.forEach(person => {
    const generation = getGeneration(person);
    if (!generations.has(generation)) generations.set(generation, []);
    generations.get(generation).push(person);
  });

  const ordered = [...generations.entries()].sort((a, b) => a[0] - b[0]);

  return `
    <div class="tree-wrap">
      <div class="tree">
        ${ordered.map(([generation, members]) => `
          <div>
            <div class="muted" style="text-align:center;margin-bottom:8px">
              ${generation === 0 ? "Geração dos descendentes" :
                generation === 1 ? "Geração dos progenitores" :
                `Geração ${generation + 1}`}
            </div>
            <div class="tree-generation">
              ${members.map(person => `
                <div class="tree-node ${person.isPlayer ? "player-node" : ""}">
                  <strong>${sexEmoji(person.sex)} ${escapeHTML(person.name)}</strong>
                  <small>${person.isPlayer ? "Personagem principal" : escapeHTML(relationLabel(person))}</small>
                  <small>${person.age} anos</small>
                </div>
              `).join("")}
            </div>
          </div>
          ${generation !== ordered[ordered.length - 1][0] ? `<div class="tree-connector">↓</div>` : ""}
        `).join("")}
      </div>
    </div>
    <p class="muted">As gerações são organizadas pelas ligações de progenitores registadas. Esta primeira apresentação é simplificada: ainda não desenha linhas individuais entre cada casal e cada filho.</p>
  `;
}

/* =========================
   LOJA
========================= */

function renderShop() {
  const items = [
    ["Telemóvel", 800],
    ["Computador", 1200],
    ["Bicicleta", 500],
    ["Relógio", 300]
  ];

  return `
    <h2 class="page-title">Loja</h2>
    <div class="panel">
      <h3>Artigos disponíveis</h3>
      ${items.map(([name, price]) => `
        <div class="person-row">
          <div>
            <div class="person-name">${name}</div>
            <div class="person-sub">${money(price)}</div>
          </div>
          <button data-buy="${name}" data-price="${price}">Comprar</button>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================
   PERFIL
========================= */

function renderProfile() {
  const player = game.player;

  return `
    <h2 class="page-title">Perfil</h2>
    <div class="panel">
      <div class="person-main">
        <div class="avatar" style="width:55px;height:55px;font-size:25px">${sexEmoji(player.sex)}</div>
        <div>
          <strong>${escapeHTML(player.firstName)} ${escapeHTML(player.lastName)}</strong>
          <div class="person-sub">${player.age} anos</div>
        </div>
      </div>
      <div class="stat-row"><span>Sexo</span><strong>${escapeHTML(player.sex)}</strong></div>
      <div class="stat-row"><span>País</span><strong>${escapeHTML(player.country)}</strong></div>
      <div class="stat-row"><span>Cidade</span><strong>${escapeHTML(player.city)}</strong></div>
      <div class="stat-row"><span>Educação</span><strong>${escapeHTML(player.education)}</strong></div>
      <div class="stat-row"><span>Profissão</span><strong>${escapeHTML(player.job)}</strong></div>
    </div>
  `;
}

/* =========================
   DEFINIÇÕES
========================= */

function renderSettings() {
  return `
    <h2 class="page-title">Definições</h2>

    <div class="panel">
      <h3>Gestão do jogo</h3>
      <div class="setting-row">
        <div>
          <strong>Editar família</strong>
          <div class="person-sub">Adicionar, editar e remover familiares.</div>
        </div>
        <button data-action="editFamily">Abrir</button>
      </div>
      <div class="setting-row">
        <div>
          <strong>Guardar jogo</strong>
          <div class="person-sub">Gravar o progresso neste dispositivo.</div>
        </div>
        <button data-action="save">Guardar</button>
      </div>
      <div class="setting-row">
        <div>
          <strong>Exportar gravação</strong>
          <div class="person-sub">Descarregar uma cópia dos teus dados.</div>
        </div>
        <button data-action="export">Exportar</button>
      </div>
      <div class="setting-row">
        <div>
          <strong>Importar gravação</strong>
          <div class="person-sub">Carregar uma cópia anterior.</div>
        </div>
        <button data-action="import">Importar</button>
      </div>
      <div class="setting-row">
        <div>
          <strong>Nova vida</strong>
          <div class="person-sub">Começar uma nova personagem.</div>
        </div>
        <button class="danger-button" data-action="newGame">Recomeçar</button>
      </div>
    </div>

    <div class="panel">
      <h3>Sobre o StarLife</h3>
      <p class="muted">Versão de desenvolvimento · Fase 2 — Família e árvore genealógica.</p>
    </div>
  `;
}

function renderFamilyManagement() {
  const list = game.family.map(person => `
    <div class="person-row">
      <div class="person-main">
        <div class="avatar">${sexEmoji(person.sex)}</div>
        <div>
          <div class="person-name">${escapeHTML(person.name)}</div>
          <div class="person-sub">${escapeHTML(relationLabel(person))} · ${person.age} anos</div>
        </div>
      </div>
      <div class="row-actions">
        <button data-edit-family="${person.id}">Editar</button>
        <button class="danger-button" data-delete-family="${person.id}">✕</button>
      </div>
    </div>
  `).join("");

  openModal("Editar família", `
    <p class="muted">Aqui podes gerir todas as pessoas da tua família.</p>
    ${list || `<div class="empty">Ainda não existem familiares.</div>`}
    <button class="primary" id="addFamilyFromSettings">＋ Adicionar familiar</button>
  `);

  $("addFamilyFromSettings").addEventListener("click", () => showFamilyForm());

  document.querySelectorAll("[data-edit-family]").forEach(button => {
    button.addEventListener("click", () => {
      const person = game.family.find(item => item.id === button.dataset.editFamily);
      if (person) showFamilyForm(person);
    });
  });

  document.querySelectorAll("[data-delete-family]").forEach(button => {
    button.addEventListener("click", () => removeFamilyMember(button.dataset.deleteFamily));
  });
}

/* =========================
   AÇÕES DAS PÁGINAS
========================= */

function attachPageEvents() {
  document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "advance") advanceYear();
      if (action === "editFamily") renderFamilyManagement();
      if (action === "save") {
        saveGame();
        alert("Jogo guardado!");
      }
      if (action === "export") exportSave();
      if (action === "import") importSave();
      if (action === "newGame") newGame();
      if (action === "createBusiness") createBusiness();
    });
  });

  document.querySelectorAll("[data-job]").forEach(button => {
    button.addEventListener("click", () => {
      const salary = Number(button.dataset.salary);
      const job = button.dataset.job;

      if (!confirm(`Queres candidatar-te a ${job}?`)) return;

      game.player.job = job;
      game.player.salary = salary;
      notify(`Conseguiste um emprego como ${job}.`);
      saveGame();
      render();
    });
  });

  document.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => {
      const price = Number(button.dataset.price);
      const name = button.dataset.buy;

      if (game.player.money < price) {
        alert("Não tens dinheiro suficiente.");
        return;
      }

      game.player.money -= price;
      notify(`Compraste: ${name}.`);
      saveGame();
      render();
    });
  });
}

/* =========================
   AVANÇAR UM ANO
========================= */

function advanceYear() {
  if (game.player.isDeceased) {
    alert("A tua personagem já faleceu. Terás de iniciar uma nova vida.");
    return;
  }

  game.year++;
  game.player.age++;

  if (game.player.salary > 0) {
    game.player.money += game.player.salary;
  }

  game.player.happiness = Math.max(0, Math.min(100,
    game.player.happiness + Math.floor(Math.random() * 7) - 3));

  // Envelhecimento simples dos familiares.
  game.family.forEach(person => {
    person.age++;

    // Mortalidade simplificada: não representa ainda um modelo médico realista.
    const risk = person.age < 60 ? 0.001 :
      person.age < 75 ? 0.008 :
      person.age < 85 ? 0.025 :
      person.age < 95 ? 0.07 : 0.18;

    if (!person.isDeceased && Math.random() < risk) {
      person.isDeceased = true;
      notify(`${person.name} faleceu aos ${person.age} anos.`);
    }
  });

  game.businesses.forEach(business => {
    game.player.money += business.profit;
    business.value = Math.max(0, business.value + business.profit * 0.2);
  });

  const playerRisk = game.player.age < 60 ? 0.001 :
    game.player.age < 75 ? 0.008 :
    game.player.age < 85 ? 0.025 :
    game.player.age < 95 ? 0.07 : 0.18;

  if (Math.random() < playerRisk) {
    game.player.isDeceased = true;
    notify("A tua personagem faleceu. A tua história chegou ao fim.");
  } else {
    notify(`Fizeste ${game.player.age} anos. Um novo ano começou.`);
  }

  saveGame();
  render();
}

/* =========================
   NEGÓCIO
========================= */

function createBusiness() {
  const cost = 5000;

  if (game.player.money < cost) {
    alert("Precisas de 5.000 € para abrir um negócio.");
    return;
  }

  const name = prompt("Que nome queres dar ao teu negócio?");
  if (!name || !name.trim()) return;

  game.player.money -= cost;
  game.businesses.push({
    id: makeId(),
    name: name.trim(),
    value: cost,
    profit: 1000
  });

  notify(`Abriste o negócio ${name.trim()}.`);
  saveGame();
  render();
}

/* =========================
   EXPORTAR / IMPORTAR
========================= */

function exportSave() {
  const blob = new Blob([JSON.stringify(game, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "starlife-gravacao.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importSave() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);

        if (!imported.player || !Array.isArray(imported.family)) {
          throw new Error("Formato inválido");
        }

        game = imported;
        game.player.id ||= "player";
        game.family = game.family.map(person => ({
          ...person,
          biologicalParentIds: person.biologicalParentIds || [],
          adoptiveParentIds: person.adoptiveParentIds || [],
          socialParentIds: person.socialParentIds || []
        }));

        game.player.biologicalParentIds ||= [];
        game.player.adoptiveParentIds ||= [];
        game.player.socialParentIds ||= [];
        game.notifications ||= [];
        game.businesses ||= [];
        game.year ||= new Date().getFullYear();

        saveGame();
        closeModal();
        $("startScreen").classList.add("hidden");
        $("gameScreen").classList.remove("hidden");
        $("bottomNav").classList.remove("hidden");
        activeTab = "home";
        render();
        alert("Gravação importada com sucesso!");
      } catch (error) {
        alert("Não foi possível importar este ficheiro. Confirma se é uma gravação StarLife válida.");
      }
    };

    reader.readAsText(file);
  });

  input.click();
}

/* =========================
   NOVA VIDA
========================= */

function newGame() {
  if (!confirm("Tens a certeza? A gravação atual será substituída por uma nova vida.")) return;

  localStorage.removeItem(SAVE_KEY);
  game = null;
  initialFamily = [];
  activeTab = "home";

  $("gameScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");
  $("startScreen").classList.remove("hidden");

  $("playerFirstName").value = "";
  $("playerLastName").value = "";
  $("playerSex").value = "";
  $("playerAge").value = "18";
  $("playerCountry").value = "Portugal";
  $("playerCity").value = "";

  renderInitialFamily();
  validateStart();
}

/* =========================
   ARRANQUE
========================= */

function boot() {
  $("playerCountry").value = "Portugal";
  renderInitialFamily();
  validateStart();

  const saved = loadGame();

  if (saved) {
    game = saved;
    $("startScreen").classList.add("hidden");
    $("gameScreen").classList.remove("hidden");
    $("bottomNav").classList.remove("hidden");
    render();
  }
}

boot();
