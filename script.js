"use strict";

/* =========================================
   STARLIFE - SCRIPT PROFISSIONAL CORRIGIDO
========================================= */

const SAVE_KEY = "starlife_v2_stable";

let game = null;
let initialFamily = [];
let toastTimer = null;

const $ = id => document.getElementById(id);

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
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function saveGame() {
  if (!game) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    updateContinuePanel();
  } catch (error) {
    console.error("Erro ao guardar:", error);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    const loaded = JSON.parse(saved);
    if (!loaded || !loaded.player || !Array.isArray(loaded.family)) return null;
    loaded.player.hasDrivingLicense ??= false;
    loaded.vehicles ??= [];
    loaded.player.illness ??= null;
    loaded.player.maxAge ??= randomNumber(75, 105);
    return loaded;
  } catch (error) {
    return null;
  }
}

function deleteSave() {
  if (!confirm("Tens a certeza de que queres apagar o jogo guardado?")) return;
  localStorage.removeItem(SAVE_KEY);
  game = null;
  updateContinuePanel();
  showSetup();
  showToast("Jogo guardado apagado.");
}

function updateContinuePanel() {
  const saved = loadGame();
  if ($("continuePanel")) {
    $("continuePanel").classList.toggle("hidden", !saved);
  }
}

function addEvent(message, type = "neutral") {
  if (!game) return;
  game.events.unshift({ message, type, age: game.player.age });
  game.events = game.events.slice(0, 60);
}

function addFinanceEvent(message) {
  if (!game) return;
  game.financeHistory.unshift({ message, age: game.player.age });
  game.financeHistory = game.financeHistory.slice(0, 50);
}

/* =========================================
   DADOS E EVENTOS
========================================= */

const femaleNames = ["Maria", "Ana", "Beatriz", "Inês", "Sofia", "Matilde", "Leonor", "Carolina", "Mariana", "Margarida", "Catarina", "Joana", "Rita", "Francisca", "Marta", "Laura", "Alice", "Diana", "Cláudia", "Raquel", "Teresa", "Isabel", "Helena", "Andreia", "Patrícia", "Eva", "Luísa", "Daniela", "Filipa"];
const maleNames = ["João", "Pedro", "Miguel", "Francisco", "Tiago", "Diogo", "André", "Rafael", "Gonçalo", "Martim", "Afonso", "Tomás", "Duarte", "Bruno", "Ricardo", "Daniel", "António", "Manuel", "Luís", "Gabriel", "David", "Nuno", "Hugo", "Filipe", "Eduardo", "José", "Rodrigo", "Vasco", "Guilherme"];
const surnames = ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Sousa", "Gomes", "Lopes", "Almeida", "Ribeiro", "Carvalho", "Moreira", "Mendes", "Teixeira", "Nunes", "Correia", "Monteiro"];

const tombstoneQuotes = [
  "Viveu intensamente, partiu em paz.",
  "Deixou saudades em todos os que cruzaram o seu caminho.",
  "Descansa em paz. A jornada foi longa e bela.",
  "Amou, riu, aprendeu e agora descansa.",
  "Uma lenda nunca morre, apenas descansa.",
  "Fez do mundo um lugar um pouco melhor."
];

const commonIllnesses = [
  { name: "Gripe Sazonal", severity: "Baixa", cost: 50, healthImpact: 5 },
  { name: "Hipertensão Arterial", severity: "Média", cost: 350, healthImpact: 12 },
  { name: "Depressão Crónica", severity: "Média", cost: 500, healthImpact: 15 },
  { name: "Cancro em Estádio Inicial", severity: "Alta", cost: 6000, healthImpact: 35 },
  { name: "Doença Cardíaca", severity: "Alta", cost: 4500, healthImpact: 30 }
];

function generateName(sex) {
  if (sex === "Feminino") return randomFrom(femaleNames);
  if (sex === "Masculino") return randomFrom(maleNames);
  return randomFrom([...femaleNames, ...maleNames]);
}

function createFamilyMember(data) {
  return {
    id: data.id || createId(),
    name: data.name || "Sem nome",
    surname: data.surname || "",
    relation: data.relation || "Outro",
    age: Number(data.age) || 0,
    sex: data.sex || "Outro",
    alive: true,
    job: "",
    salary: 0,
    partnerId: data.partnerId || null,
    relationshipStatus: data.relationshipStatus || "Solteiro/a"
  };
}

const lifeEventsPool = [
  { minAge: 0, maxAge: 5, text: "Deste os teus primeiros passos na sala de estar.", options: [{ text: "Sorrir", effect: () => { game.player.happiness = clamp(game.player.happiness + 5); addEvent("Os pais celebraram os teus passos.", "positive"); } }] },
  { minAge: 6, maxAge: 11, text: "Participaste numa atividade desportiva na escola.", options: [{ text: "Dar o máximo", effect: () => { game.player.health = clamp(game.player.health + 3); addEvent("Ganhaste uma medalha simbólica!", "positive"); } }] },
  { minAge: 12, maxAge: 17, text: "Tiveste um teste difícil de História e conseguiste excelente nota.", options: [{ text: "Celebrar", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 2); addEvent("O esforço nos estudos valeu a pena.", "positive"); } }] },
  { minAge: 18, maxAge: 65, text: "Fizeste horas extra no trabalho.", options: [{ text: "Aceitar", effect: () => { game.player.bank += 180; addFinanceEvent("Ganhaste 180 € extra."); addEvent("Recebeste um bónus pelo esforço.", "positive"); } }] },
  { minAge: 18, maxAge: 65, text: "Encontraste uma carteira com dinheiro no passeio.", options: [{ text: "Devolver", effect: () => { game.player.happiness = clamp(game.player.happiness + 8); game.player.bank += 40; addEvent("O dono recompensou-te com 40 €.", "positive"); } }] },
  { minAge: 66, maxAge: 110, text: "Participaste num torneio de dominó no centro de reformados.", options: [{ text: "Jogar", effect: () => { game.player.happiness = clamp(game.player.happiness + 10); addEvent("Passáste uma tarde muito agradável.", "positive"); } }] }
];

function triggerRandomEvent() {
  if (!game || !game.player.alive) return;
  const age = game.player.age;
  const validEvents = lifeEventsPool.filter(ev => age >= ev.minAge && age <= ev.maxAge);
  if (validEvents.length === 0 || Math.random() > 0.4) return;
  const ev = randomFrom(validEvents);
  
  let modal = $("eventModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "eventModal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <h3>⚠️ Acontecimento</h3>
      <p>${escapeHTML(ev.text)}</p>
      <div class="modal-buttons" id="eventOptionsContainer"></div>
    </div>
  `;
  modal.classList.remove("hidden");

  const btnContainer = $("eventOptionsContainer");
  btnContainer.innerHTML = "";
  ev.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "primary-btn full-width";
    btn.textContent = opt.text;
    btn.addEventListener("click", () => {
      opt.effect();
      modal.classList.add("hidden");
      saveGame();
      renderGame();
    });
    btnContainer.appendChild(btn);
  });
}

function checkRandomIllness() {
  const player = game.player;
  if (player.illness || player.age < 12) return;
  const chance = 0.06 + (player.age * 0.001) - ((player.health - 50) * 0.001);
  if (Math.random() < chance) {
    const ill = randomFrom(commonIllnesses);
    player.illness = { ...ill };
    addEvent(`⚠️ Foi-te diagnosticado/a: ${ill.name}.`, "negative");
  }
}

function executeHealthAction(type) {
  const player = game.player;
  if (type === "checkup") {
    if (player.bank < 40) { showToast("Sem dinheiro."); return; }
    player.bank -= 40;
    player.health = clamp(player.health + 3);
    showToast(player.illness ? `Atenção: Tens ${player.illness.name}!` : "Check-up limpo!");
  } else if (type === "urgency") {
    if (player.bank < 100) { showToast("Sem dinheiro."); return; }
    player.bank -= 100;
    player.health = clamp(player.health + 12);
    showToast("Tratamento de urgência efetuado.");
  } else if (type === "oncology" || type === "specialist") {
    if (player.illness) {
      const cost = player.illness.cost;
      if (player.bank < cost) { showToast(`Precisas de ${money(cost)}.`); return; }
      player.bank -= cost;
      addEvent(`Curaste com sucesso: ${player.illness.name}! 🎉`, "positive");
      player.illness = null;
      player.health = clamp(player.health + 20);
    } else {
      if (player.bank < 150) { showToast("Sem dinheiro."); return; }
      player.bank -= 150;
      player.health = clamp(player.health + 8);
      showToast("Consulta concluída.");
    }
  }
  saveGame();
  renderGame();
}

/* =========================================
   ESCOLA E UNIVERSIDADE (RESTAURADO)
========================================= */

const educationStages = [
  { name: "Creche", start: 0, end: 2, level: 0 },
  { name: "Jardim de infância", start: 3, end: 5, level: 0 },
  { name: "1.º Ciclo do Ensino Básico", start: 6, end: 9, level: 1 },
  { name: "2.º Ciclo do Ensino Básico", start: 10, end: 11, level: 1 },
  { name: "3.º Ciclo do Ensino Básico", start: 12, end: 14, level: 1 },
  { name: "Ensino Secundário", start: 15, end: 17, level: 2 }
];

const universityCourses = [
  { name: "Medicina", cost: 3500, duration: 6, salary: 42000 },
  { name: "Direito", cost: 2500, duration: 4, salary: 35000 },
  { name: "Engenharia", cost: 2800, duration: 5, salary: 32000 },
  { name: "Gestão", cost: 2300, duration: 3, salary: 30000 }
];

function getCurrentEducationStage(age) {
  return educationStages.find(stage => age >= stage.start && age <= stage.end) || null;
}

function initializeEducation(player) {
  player.intelligence ??= randomNumber(35, 85);
  player.schoolGrade ??= 12;
  player.schoolStatus ??= "A frequentar";
  player.education ??= "Sem escolaridade";
  player.educationLevel ??= 0;
  player.universityCourse ??= null;
  player.universityProgress ??= 0;
}

function processSchoolYear() {
  const player = game.player;
  const stage = getCurrentEducationStage(player.age);
  if (!stage || player.age > 17) return;
  player.schoolGrade = clamp(Math.round(12 + randomNumber(-2, 3)), 5, 20);
  if (player.age === 14) { player.education = "Ensino básico"; player.educationLevel = 1; }
  if (player.age === 17) { player.education = "Ensino secundário"; player.educationLevel = 2; }
}

function studyHarder() {
  const player = game.player;
  player.intelligence = clamp(player.intelligence + 2);
  player.schoolGrade = clamp(player.schoolGrade + 1, 0, 20);
  addEvent("Estudaste com afinco. 📖");
  saveGame();
  renderGame();
}

function enrollUniversity(index, fundingType) {
  const player = game.player;
  const course = universityCourses[index];
  if (player.universityCourse) { showToast("Já estás na universidade."); return; }
  player.universityCourse = course.name;
  player.universityProgress = 0;
  player.universityFunding = fundingType;
  addEvent(`Entraste na Universidade para estudar ${course.name}! 🎓`);
  saveGame();
  renderGame();
}

function processFurtherEducation() {
  const player = game.player;
  if (player.universityCourse) {
    player.universityProgress++;
    const course = universityCourses.find(c => c.name === player.universityCourse);
    if (player.universityProgress >= (course?.duration || 4)) {
      player.education = `Licenciatura em ${player.universityCourse}`;
      player.educationLevel = 3;
      player.salary = course?.salary || 30000;
      player.universityCourse = null;
      addEvent(`🎓 Licenciatura concluída em ${course?.name}!`);
    }
  }
}

function renderSchoolAndUniversitySubmenu() {
  const player = game.player;
  const container = $("schoolSectionContainer");
  if (!container) return;
  const stage = getCurrentEducationStage(player.age);

  let html = `
    <div class="panel" style="margin-top: 16px;">
      <h3>📚 Estatísticas Escolares</h3>
      <div class="info-row"><span>Etapa atual</span><strong>${escapeHTML(stage?.name || player.education)}</strong></div>
      <div class="info-row"><span>Média</span><strong>${player.schoolGrade}/20</strong></div>
      <div class="info-row"><span>Inteligência</span><strong>${player.intelligence}%</strong></div>
    </div>
  `;

  if (player.age >= 6 && player.age <= 18) {
    html += `
      <div class="panel">
        <h3>Atividades de Estudante</h3>
        <button class="primary-btn full-width" id="studyBtn">📖 Estudar Mais</button>
      </div>
    `;
  }

  if (player.age >= 18 && player.educationLevel >= 2) {
    html += `
      <div class="panel">
        <h3>🏛️ Ensino Superior (Universidade)</h3>
        ${player.universityCourse ? `<p>Curso atual: <strong>${player.universityCourse}</strong> (${player.universityProgress} anos concl.)</p>` : `<p class="muted">Escolhe um curso superior:</p>`}
        ${universityCourses.map((c, idx) => `
          <div style="margin-top: 8px; padding: 8px; background: var(--panel-light); border-radius: 8px;">
            <strong>${escapeHTML(c.name)}</strong> (${money(c.cost)}/ano)
            ${!player.universityCourse ? `<button class="small-btn full-width" style="margin-top:6px;" data-uni-idx="${idx}">Inscrever-se</button>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  container.innerHTML = html;

  if ($("studyBtn")) $("studyBtn").onclick = studyHarder;
  container.querySelectorAll("[data-uni-idx]").forEach(b => {
    b.onclick = () => enrollUniversity(Number(b.dataset.uniIdx), "savings");
  });
}

/* =========================================
   CARTA E VEÍCULOS
========================================= */

const DRIVING_LICENSE_COST = 650;
const availableVehicles = [
  { name: "Citadino Usado", price: 2500, annualCost: 450 },
  { name: "Utilitário Compacto", price: 8500, annualCost: 650 },
  { name: "SUV Familiar", price: 25000, annualCost: 1200 }
];

function takeDrivingLicense() {
  const player = game.player;
  if (player.bank < DRIVING_LICENSE_COST) { showToast("Sem saldo."); return; }
  player.bank -= DRIVING_LICENSE_COST;
  player.hasDrivingLicense = true;
  addEvent("🚗 Tiraste a Carta de Condução!", "positive");
  saveGame();
  renderGame();
}

function buyVehicle(idx) {
  const car = availableVehicles[idx];
  const player = game.player;
  if (player.bank < car.price) { showToast("Sem saldo."); return; }
  player.bank -= car.price;
  game.vehicles.push({ id: createId(), name: car.name, value: car.price, annualCost: car.annualCost });
  addEvent(`🚘 Compraste um ${car.name}!`, "positive");
  saveGame();
  renderGame();
}

function renderVehiclesSection() {
  const container = $("vehiclesSectionContainer");
  if (!container) return;
  const player = game.player;
  let html = `<div class="panel"><h3>🚗 Condução e Veículos</h3>`;
  if (!player.hasDrivingLicense) {
    html += `<button class="primary-btn full-width" id="takeLicenseBtn">Tirar Carta (${money(DRIVING_LICENSE_COST)})</button>`;
  } else {
    html += `<p class="muted">Carta de Condução ativa.</p>`;
    game.vehicles.forEach(v => { html += `<p>• ${escapeHTML(v.name)} (${money(v.value)})</p>`; });
    availableVehicles.forEach((c, idx) => {
      html += `<button class="secondary-btn full-width" style="margin-top:6px;" data-buy-car="${idx}">Comprar ${escapeHTML(c.name)} (${money(c.price)})</button>`;
    });
  }
  html += `</div>`;
  container.innerHTML = html;

  if ($("takeLicenseBtn")) $("takeLicenseBtn").onclick = takeDrivingLicense;
  container.querySelectorAll("[data-buy-car]").forEach(b => {
    b.onclick = () => buyVehicle(Number(b.dataset.buyCar));
  });
}

/* =========================================
   MORTE E LÁPIDE
========================================= */

function triggerDeath() {
  const player = game.player;
  player.alive = false;
  saveGame();

  $("gameScreen").classList.add("hidden");
  $("deathScreen").classList.remove("hidden");

  $("tombstoneName").textContent = `${player.name} ${player.surname}`;
  $("tombstoneYears").textContent = `${game.year - player.age} - ${game.year} (${player.age} anos)`;
  $("tombstoneQuote").textContent = `"${randomFrom(tombstoneQuotes)}"`;

  $("deathReportStats").innerHTML = `
    <div class="info-row"><span>Património Final</span><strong>${money(player.bank)}</strong></div>
    <div class="info-row"><span>Profissão</span><strong>${escapeHTML(player.job || "Nenhuma")}</strong></div>
    <div class="info-row"><span>Escolaridade</span><strong>${escapeHTML(player.education)}</strong></div>
  `;

  $("newLifeBtn").onclick = () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  };
}

function advanceYear() {
  if (!game || !game.player.alive) return;
  const player = game.player;

  player.age += 1;
  game.year += 1;

  processSchoolYear();
  processFurtherEducation();
  checkRandomIllness();

  if (player.illness) {
    player.health = clamp(player.health - player.illness.healthImpact);
  }

  if (player.age >= player.maxAge || player.health <= 0) {
    triggerDeath();
    return;
  }

  triggerRandomEvent();
  saveGame();
  renderGame();
}

/* =========================================
   INICIALIZAÇÃO
========================================= */

function startGame() {
  const name = $("playerName").value.trim();
  const surname = $("playerSurname").value.trim();
  if (!name || !surname) { showToast("Preenche os campos."); return; }

  const player = {
    id: createId(), name, surname,
    sex: $("playerSex").value,
    country: $("playerCountry").value.trim(),
    city: $("playerCity").value.trim(),
    age: 0, alive: true,
    health: 100, happiness: 80,
    education: "Sem escolaridade", educationLevel: 0,
    job: "", salary: 0, bank: 1000, debt: 0, expenses: 0,
    hasDrivingLicense: false, illness: null,
    maxAge: randomNumber(78, 108)
  };

  game = {
    player, family: [], socialPeople: [], events: [], financeHistory: [], businesses: [], vehicles: [],
    year: new Date().getFullYear(), started: true
  };

  initializeEducation(player);

  if (initialFamily.length === 0) {
    const mother = createFamilyMember({ name: generateName("Feminino"), surname, relation: "Mãe", age: 30, sex: "Feminino" });
    const father = createFamilyMember({ name: generateName("Masculino"), surname, relation: "Pai", age: 33, sex: "Masculino" });
    game.family.push(mother, father);
  } else {
    game.family = initialFamily.map(f => createFamilyMember(f));
  }

  saveGame();
  showGame();
  renderGame();
}

function showGame() {
  $("setupScreen").classList.add("hidden");
  $("deathScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  showTab("homeTab");
}

function showSetup() {
  $("gameScreen").classList.add("hidden");
  $("setupScreen").classList.remove("hidden");
  updateContinuePanel();
}

function renderHome() {
  const player = game.player;
  $("homePlayerName").textContent = `${player.name} ${player.surname}`;
  $("homePlayerLocation").textContent = `${player.city}, ${player.country}`;
  $("homeAge").textContent = player.age;
  $("healthValue").textContent = `${Math.round(player.health)}%`;
  $("happinessValue").textContent = `${Math.round(player.happiness)}%`;
  $("healthBar").style.width = `${player.health}%`;
  $("happinessBar").style.width = `${player.happiness}%`;
  $("educationValue").textContent = player.education;
  $("jobValue").textContent = player.job || "Sem profissão";
  $("illnessValue").textContent = player.illness ? player.illness.name : "Nenhuma";

  const eventsContainer = $("recentEvents");
  eventsContainer.innerHTML = "";
  game.events.slice(0, 6).forEach(ev => {
    const el = document.createElement("div");
    el.className = `event-item ${ev.type || "neutral"}`;
    el.innerHTML = `${escapeHTML(ev.message)}<small>Idade: ${ev.age}</small>`;
    eventsContainer.appendChild(el);
  });
}

function renderPatrimony() {
  const player = game.player;
  $("totalWealth").textContent = money(player.bank);
  $("bankBalance").textContent = money(player.bank);
  $("annualSalary").textContent = money(player.salary);
  $("annualExpenses").textContent = money(player.expenses);
  $("debtValue").textContent = money(player.debt);
  renderVehiclesSection();
}

function renderCareer() {
  const player = game.player;
  $("careerJob").textContent = player.job || "Nenhuma";
  $("careerSalary").textContent = money(player.salary);
  $("careerEducation").textContent = player.education;

  const jobContainer = $("jobOptions");
  if (jobContainer) {
    jobContainer.innerHTML = "";
    if (player.age >= 16) {
      jobContainer.innerHTML = `
        <button class="secondary-btn" onclick="applyJob('Empregado/a', 12000)">Empregado/a · 12 000 €/ano</button>
        <button class="secondary-btn" onclick="applyJob('Assistente', 15000)">Assistente · 15 000 €/ano</button>
      `;
    } else {
      jobContainer.innerHTML = `<p class="muted">Procura emprego a partir dos 16 anos.</p>`;
    }
  }

  renderSchoolAndUniversitySubmenu();
}

function applyJob(name, salary) {
  game.player.job = name;
  game.player.salary = salary;
  addEvent(`Começaste a trabalhar como ${name}!`);
  saveGame();
  renderGame();
}

function renderPeople() {
  const container = $("peopleList");
  if (!container) return;
  container.innerHTML = "";
  game.family.forEach(f => {
    container.innerHTML += `<div class="person-card"><strong>${escapeHTML(f.name)}</strong> <small>${f.relation} · ${f.age} anos</small></div>`;
  });
}

function renderGame() {
  if (!game) return;
  renderHome();
  renderPatrimony();
  renderCareer();
  renderPeople();
}

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
  const target = $(tabId);
  if (target) target.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
}

function updateSetupFamilyUI() {
  const container = $("setupFamilyList");
  if (!container) return;
  container.innerHTML = "";
  initialFamily.forEach((f, idx) => {
    container.innerHTML += `<div class="person-card"><strong>${escapeHTML(f.name)}</strong> <small>${f.relation}</small> <button type="button" class="small-btn danger-btn" onclick="initialFamily.splice(${idx},1);updateSetupFamilyUI()">X</button></div>`;
  });
}

function boot() {
  $("addFamilyMemberBtn")?.addEventListener("click", () => {
    const name = $("famName").value.trim();
    if (!name) return;
    initialFamily.push({
      name, surname: $("playerSurname").value.trim() || "Silva",
      relation: $("famRelation").value, age: Number($("famAge").value) || 30,
      relationshipStatus: $("famMaritalStatus").value
    });
    $("famName").value = "";
    updateSetupFamilyUI();
  });

  document.querySelectorAll("[data-health]").forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.health;
      if (type === "familyDoctor") executeHealthAction("checkup");
      else if (type === "urgency") executeHealthAction("urgency");
      else if (type === "oncology") executeHealthAction("oncology");
      else executeHealthAction("specialist");
    };
  });

  $("startForm").addEventListener("submit", e => { e.preventDefault(); startGame(); });
  $("continueGameBtn")?.addEventListener("click", () => {
    const saved = loadGame();
    if (saved) { game = saved; showGame(); renderGame(); }
  });
  $("deleteSaveBtn")?.addEventListener("click", deleteSave);
  $("advanceYearBtn").addEventListener("click", advanceYear);

  $("bottomNav").addEventListener("click", e => {
    const btn = e.target.closest(".nav-btn");
    if (btn && btn.dataset.tab) showTab(btn.dataset.tab);
  });

  updateContinuePanel();
  updateSetupFamilyUI();
}

document.addEventListener("DOMContentLoaded", boot);
