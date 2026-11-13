
"use strict";

/* StarLife - versão base funcional */

const STORAGE_KEY = "starlife_save_v1";

const $ = (id) => document.getElementById(id);

let game = null;
let initialFamily = [];
let toastTimer = null;
let relativeTarget = "initial";

const jobs = [
  { name: "Empregado de loja", salary: 12000, description: "Um primeiro emprego." },
  { name: "Barbeiro", salary: 15000, description: "Trabalha numa barbearia." },
  { name: "Cozinheiro", salary: 14500, description: "Trabalha na restauração." },
  { name: "Programador", salary: 28000, description: "Desenvolvimento de software." },
  { name: "Professor", salary: 22000, description: "Trabalha na educação." },
  { name: "Médico", salary: 42000, description: "Profissão na área da saúde." }
];

const educationLevels = [
  { name: "Ensino secundário", cost: 500, years: 1 },
  { name: "Curso profissional", cost: 1200, years: 2 },
  { name: "Licenciatura", cost: 3500, years: 3 }
];

function money(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
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

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function saveGame() {
  if (!game) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    $("saveButton").textContent = "✓";
    setTimeout(() => $("saveButton").textContent = "▣", 900);
  } catch (error) {
    console.error("Erro ao guardar:", error);
    notify("Não foi possível guardar a vida neste dispositivo.");
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.player || !Array.isArray(parsed.family)) return null;
    return parsed;
  } catch (error) {
    console.error("Gravação inválida:", error);
    return null;
  }
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === screenId);
  });
}

function showTab(tabName) {
  if (!game) return;

  if (tabName === "inicio") {
    showScreen("gameScreen");
  } else {
    showScreen("tab-" + tabName);
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  if (tabName === "patrimonio") renderTransactions();
  if (tabName === "carreira") renderCareer();
  if (tabName === "negocios") renderBusinesses();
  if (tabName === "pessoas") renderPeople();
  if (tabName === "perfil") renderProfile();
}

function updateCreationValidation() {
  const required = [
    ["firstName", "Nome"],
    ["lastName", "Apelido"],
    ["playerSex", "Sexo"],
    ["playerCountry", "País"],
    ["playerCity", "Cidade"]
  ];

  const missing = required.filter(([id]) => !$ (id).value.trim());
  const age = Number($("playerAge").value);

  if (!$("playerAge").value || !Number.isInteger(age) || age < 0 || age > 100) {
    missing.push(["playerAge", "Idade válida entre 0 e 100"]);
  }

  const button = $("startGameButton");
  const errorBox = $("creationErrors");

  button.disabled = missing.length > 0;
  button.textContent = missing.length
    ? "Preenche os campos obrigatórios"
    : "✦ Começar a minha vida";

  if (missing.length) {
    errorBox.hidden = false;
    errorBox.textContent = "Falta preencher: " + missing.map(item => item[1]).join(", ") + ".";
  } else {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }
}

function renderInitialFamily() {
  const container = $("initialFamilyList");

  if (!initialFamily.length) {
    container.innerHTML = '<p class="empty-state">Ainda não adicionaste familiares.</p>';
    return;
  }

  container.innerHTML = initialFamily.map(person => `
    <div class="family-person">
      <div class="person-avatar">${escapeHTML(person.name.charAt(0).toUpperCase())}</div>
      <div class="person-info">
        <strong>${escapeHTML(person.name)}</strong>
        <small>${escapeHTML(person.relation)} · ${escapeHTML(person.sex)}</small>
      </div>
      <div class="person-actions">
        <button type="button" data-initial-edit="${person.id}">Editar</button>
        <button type="button" data-initial-delete="${person.id}">✕</button>
      </div>
    </div>
  `).join("");
}

function openRelativeDialog(target, person = null) {
  relativeTarget = target;
  $("relativeDialogTitle").textContent = person ? "Editar familiar" : "Adicionar familiar";
  $("relativeId").value = person?.id || "";
  $("relativeName").value = person?.name || "";
  $("relativeSex").value = person?.sex || "";
  $("relativeRelation").value = person?.relation || "";
  $("relativeAge").value = person?.age ?? "";
  populateParentOptions(person?.parentId || "");

  const dialog = $("relativeDialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeRelativeDialog() {
  const dialog = $("relativeDialog");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function populateParentOptions(selected = "") {
  const select = $("relativeParent");
  const people = game ? game.family : initialFamily;

  select.innerHTML = '<option value="">Não especificar</option>';

  people.forEach(person => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.name + " (" + person.relation + ")";
    if (person.id === selected) option.selected = true;
    select.appendChild(option);
  });
}

function saveRelative(event) {
  event.preventDefault();

  const name = $("relativeName").value.trim();
  const sex = $("relativeSex").value;
  const relation = $("relativeRelation").value.trim();
  const ageValue = $("relativeAge").value;
  const parentId = $("relativeParent").value;

  if (!name || !sex || !relation) {
    notify("Preenche o nome, sexo e parentesco.");
    return;
  }

  const age = ageValue === "" ? null : Number(ageValue);
  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
    notify("Introduz uma idade válida.");
    return;
  }

  const list = relativeTarget === "initial" ? initialFamily : game.family;
  const id = $("relativeId").value;

  if (parentId && parentId === id) {
    notify("Uma pessoa não pode ser sua própria progenitora.");
    return;
  }

  const data = { id: id || makeId(), name, sex, relation, age, parentId };

  if (id) {
    const index = list.findIndex(person => person.id === id);
    if (index !== -1) list[index] = data;
  } else {
    list.push(data);
  }

  closeRelativeDialog();

  if (relativeTarget === "initial") {
    renderInitialFamily();
  } else {
    renderFamilySettings();
    renderPeople();
    saveGame();
  }

  notify(id ? "Familiar atualizado." : "Familiar adicionado.");
}

function deleteInitialRelative(id) {
  initialFamily = initialFamily.filter(person => person.id !== id);
  initialFamily.forEach(person => {
    if (person.parentId === id) person.parentId = "";
  });
  renderInitialFamily();
}

function deleteRelative(id) {
  const person = game.family.find(item => item.id === id);
  if (!person) return;

  if (!confirm("Queres remover " + person.name + " da tua família?")) return;

  game.family = game.family.filter(item => item.id !== id);
  game.family.forEach(item => {
    if (item.parentId === id) item.parentId = "";
  });

  renderFamilySettings();
  renderPeople();
  saveGame();
  notify("Familiar removido.");
}

function startGame() {
  updateCreationValidation();
  if ($("startGameButton").disabled) {
    notify("Preenche todos os campos obrigatórios.");
    return;
  }

  const name = $("firstName").value.trim();
  const surname = $("lastName").value.trim();
  const age = Number($("playerAge").value);
  const currentYear = new Date().getFullYear();

  game = {
    version: 1,
    createdAt: new Date().toISOString(),
    year: currentYear,
    player: {
      id: "player",
      name,
      surname,
      fullName: name + " " + surname,
      sex: $("playerSex").value,
      age,
      birthYear: currentYear - age,
      country: $("playerCountry").value.trim(),
      city: $("playerCity").value.trim(),
      health: 100,
      happiness: 100,
      alive: true,
      job: "Desempregado",
      salary: 0,
      education: "Básica"
    },
    family: initialFamily.map(person => ({ ...person })),
    balance: 0,
    incomeTotal: 0,
    expenseTotal: 0,
    transactions: [],
    businesses: [],
    notifications: [],
    history: [],
    assets: 0
  };

  addNotification("🌟", "A tua vida começou! Tens uma história inteira para escrever.");
  saveGame();
  $("bottomNav").hidden = false;
  renderAll();
  showTab("inicio");
  notify("Bem-vindo ao StarLife!");
}

function addNotification(icon, message) {
  if (!game) return;
  game.notifications.unshift({
    id: makeId(),
    icon,
    message,
    year: game.year
  });
  game.notifications = game.notifications.slice(0, 40);
}

function renderNotifications() {
  const container = $("notifications");
  if (!game.notifications.length) {
    container.innerHTML = '<p class="empty-state">Ainda não há acontecimentos.</p>';
    return;
  }

  container.innerHTML = game.notifications.map(item => `
    <div class="notification">
      <span class="notification-icon">${escapeHTML(item.icon)}</span>
      <div>${escapeHTML(item.message)}<time>Ano ${item.year}</time></div>
    </div>
  `).join("");
}

function renderHome() {
  const p = game.player;
  $("playerHeading").textContent = p.fullName;
  $("playerDescription").textContent = `${p.age} anos · ${p.city}, ${p.country}`;
  $("ageStat").textContent = p.age;
  $("healthStat").textContent = p.health + "%";
  $("happinessStat").textContent = p.happiness + "%";
  $("moneyStat").textContent = money(game.balance);
  $("dateHeading").textContent = game.year;
  $("yearPill").textContent = "Ano " + game.year;
  $("lifeStatus").textContent = p.alive ? "Vida ativa" : "Falecido";
  $("nextYearButton").disabled = !p.alive;
  $("nextYearButton").textContent = p.alive ? "⏩ Avançar um ano" : "Fim da vida";
  $("headerSubtitle").textContent = p.fullName;

  $("lifeSummary").innerHTML = `
    <div class="summary-row"><span>🎂 Idade atual</span><strong>${p.age} anos</strong></div>
    <div class="summary-row"><span>💼 Profissão</span><strong>${escapeHTML(p.job)}</strong></div>
    <div class="summary-row"><span>🎓 Escolaridade</span><strong>${escapeHTML(p.education)}</strong></div>
    <div class="summary-row"><span>👨‍👩‍👧 Familiares registados</span><strong>${game.family.length}</strong></div>
  `;

  renderNotifications();
}

function renderTransactions() {
  $("wealthBalance").textContent = money(game.balance);
  $("wealthNetWorth").textContent = "Património líquido: " + money(game.balance + game.assets);
  $("incomeStat").textContent = money(game.incomeTotal);
  $("expenseStat").textContent = money(game.expenseTotal);

  const container = $("transactionList");
  if (!game.transactions.length) {
    container.innerHTML = '<p class="empty-state">Ainda não existem movimentos.</p>';
    return;
  }

  container.innerHTML = game.transactions.slice(0, 30).map(item => `
    <div class="list-item">
      <div class="person-info">
        <strong>${escapeHTML(item.description)}</strong>
        <small>Ano ${item.year}</small>
      </div>
      <strong style="color:${item.type === "income" ? "var(--success)" : "var(--danger)"}">
        ${item.type === "income" ? "+" : "-"}${money(item.amount)}
      </strong>
    </div>
  `).join("");
}

function addTransaction(description, amount, type) {
  if (!game || !game.player.alive) return false;
  if (!description || !Number.isFinite(amount) || amount <= 0) {
    notify("Verifica a descrição e o valor.");
    return false;
  }
  if (type === "expense" && amount > game.balance) {
    notify("Não tens saldo suficiente.");
    return false;
  }

  if (type === "income") {
    game.balance += amount;
    game.incomeTotal += amount;
  } else {
    game.balance -= amount;
    game.expenseTotal += amount;
  }

  game.transactions.unshift({
    id: makeId(), description, amount, type, year: game.year
  });

  saveGame();
  renderAll();
  return true;
}

function renderCareer() {
  const p = game.player;
  $("careerJob").textContent = p.job;
  $("careerSalary").textContent = money(p.salary);
  $("careerEducation").textContent = p.education;

  $("jobOptions").innerHTML = jobs.map((job, index) => `
    <div class="option-card">
      <div><strong>${escapeHTML(job.name)}</strong><p>${escapeHTML(job.description)} · ${money(job.salary)}/ano</p></div>
      <button class="small-button" type="button" data-job="${index}">Candidatar</button>
    </div>
  `).join("");

  $("educationOptions").innerHTML = educationLevels.map((level, index) => `
    <div class="option-card">
      <div><strong>${escapeHTML(level.name)}</strong><p>${level.years} ano(s) · ${money(level.cost)}</p></div>
      <button class="small-button" type="button" data-education="${index}">Inscrever</button>
    </div>
  `).join("");
}

function applyForJob(index) {
  const job = jobs[index];
  if (!job || !game.player.alive) return;
  if (game.player.age < 16) {
    notify("Ainda és demasiado novo para este emprego.");
    return;
  }

  game.player.job = job.name;
  game.player.salary = job.salary;
  addNotification("💼", `Conseguiste um emprego como ${job.name}.`);
  saveGame();
  renderAll();
  notify("Novo emprego conseguido!");
}

function enrollEducation(index) {
  const level = educationLevels[index];
  if (!level || !game.player.alive) return;

  if (game.balance < level.cost) {
    notify("Não tens dinheiro suficiente para esta formação.");
    return;
  }

  game.balance -= level.cost;
  game.expenseTotal += level.cost;
  game.player.education = level.name;
  game.player.happiness = Math.min(100, game.player.happiness + 5);

  game.transactions.unshift({
    id: makeId(),
    description: "Formação: " + level.name,
    amount: level.cost,
    type: "expense",
    year: game.year
  });

  addNotification("🎓", `Iniciaste formação: ${level.name}.`);
  saveGame();
  renderAll();
}

function renderBusinesses() {
  const container = $("businessList");
  if (!game.businesses.length) {
    container.innerHTML = '<p class="empty-state">Ainda não tens negócios.</p>';
    return;
  }

  container.innerHTML = game.businesses.map(business => `
    <div class="list-item">
      <div class="person-info">
        <strong>🏢 ${escapeHTML(business.name)}</strong>
        <small>Investimento inicial: ${money(business.investment)} · Lucro anual estimado: ${money(business.profit)}</small>
      </div>
      <strong>${money(business.value)}</strong>
    </div>
  `).join("");
}

function createBusiness() {
  const name = $("businessName").value.trim();
  const investment = Number($("businessInvestment").value);

  if (!name || !Number.isFinite(investment) || investment < 100) {
    notify("Indica um nome e um investimento mínimo de 100 €.");
    return;
  }
  if (investment > game.balance) {
    notify("Não tens saldo suficiente para este investimento.");
    return;
  }

  game.balance -= investment;
  game.expenseTotal += investment;
  game.assets += investment;

  const business = {
    id: makeId(),
    name,
    investment,
    value: investment,
    profit: Math.round(investment * 0.12)
  };

  game.businesses.push(business);
  game.transactions.unshift({
    id: makeId(),
    description: "Investimento: " + name,
    amount: investment,
    type: "expense",
    year: game.year
  });

  addNotification("🏢", `Criaste o negócio ${name}.`);
  $("businessName").value = "";
  $("businessInvestment").value = "";
  saveGame();
  renderAll();
  notify("Negócio criado!");
}

function renderPeople() {
  const container = $("peopleFamilyList");

  if (!game.family.length) {
    container.innerHTML = '<p class="empty-state">Ainda não adicionaste familiares. Podes fazê-lo em Definições → Editar Família.</p>';
  } else {
    container.innerHTML = game.family.map(person => `
      <div class="family-person">
        <div class="person-avatar">${escapeHTML(person.name.charAt(0).toUpperCase())}</div>
        <div class="person-info">
          <strong>${escapeHTML(person.name)}</strong>
          <small>${escapeHTML(person.relation)}${person.age === null ? "" : " · " + person.age + " anos"}</small>
        </div>
      </div>
    `).join("");
  }

  $("relationshipSummary").innerHTML = `
    <div class="summary-row"><span>Familiares registados</span><strong>${game.family.length}</strong></div>
    <div class="summary-row"><span>Relações identificadas</span><strong>${new Set(game.family.map(p => p.relation)).size}</strong></div>
  `;
}

function renderFamilySettings() {
  const container = $("settingsFamilyList");

  if (!game.family.length) {
    container.innerHTML = '<p class="empty-state">Ainda não existem familiares registados.</p>';
    return;
  }

  container.innerHTML = game.family.map(person => {
    const parent = game.family.find(p => p.id === person.parentId);
    return `
      <div class="family-person">
        <div class="person-avatar">${escapeHTML(person.name.charAt(0).toUpperCase())}</div>
        <div class="person-info">
          <strong>${escapeHTML(person.name)}</strong>
          <small>${escapeHTML(person.relation)} · ${escapeHTML(person.sex)}${person.age === null ? "" : " · " + person.age + " anos"}${parent ? " · Filho(a) de " + escapeHTML(parent.name) : ""}</small>
        </div>
        <div class="person-actions">
          <button type="button" data-family-edit="${person.id}">Editar</button>
          <button type="button" data-family-delete="${person.id}">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderProfile() {
  const p = game.player;
  $("profileName").textContent = p.fullName;
  $("profileDetails").textContent = `${p.age} anos · ${p.sex}`;
  $("profileCountry").textContent = p.country;
  $("profileCity").textContent = p.city;
  $("profileBirth").textContent = p.birthYear;
  $("profileStatus").textContent = p.alive ? "Vivo" : "Falecido";
}

function renderAll() {
  if (!game) return;
  renderHome();
  renderTransactions();
  renderCareer();
  renderBusinesses();
  renderPeople();
  renderProfile();
}

function advanceYear() {
  const p = game.player;
  if (!p.alive) return;

  game.year += 1;
  p.age += 1;

  if (p.salary > 0) {
    const annualIncome = p.salary;
    game.balance += annualIncome;
    game.incomeTotal += annualIncome;
    game.transactions.unshift({
      id: makeId(),
      description: "Salário anual",
      amount: annualIncome,
      type: "income",
      year: game.year
    });
    addNotification("💶", `Recebeste ${money(annualIncome)} de salário.`);
  }

  if (p.age >= 18) {
    const livingCost = Math.round(500 + p.age * 12);
    const paid = Math.min(game.balance, livingCost);
    game.balance -= paid;
    game.expenseTotal += paid;
    if (paid > 0) {
      game.transactions.unshift({
        id: makeId(),
        description: "Despesas de vida",
        amount: paid,
        type: "expense",
        year: game.year
      });
    }
    addNotification("🏠", `As tuas despesas anuais foram ${money(livingCost)}.`);
  }

  game.businesses.forEach(business => {
    const profit = Math.round(business.profit * (0.8 + Math.random() * 0.4));
    game.balance += profit;
    game.incomeTotal += profit;
    business.value = Math.max(0, business.value + profit);
    game.transactions.unshift({
      id: makeId(),
      description: "Lucro: " + business.name,
      amount: profit,
      type: "income",
      year: game.year
    });
    addNotification("📈", `O negócio ${business.name} gerou ${money(profit)}.`);
  });

  p.happiness = Math.max(0, Math.min(100, p.happiness + Math.floor(Math.random() * 9) - 4));
  p.health = Math.max(0, Math.min(100, p.health - (p.age > 65 ? 2 : 0) + Math.floor(Math.random() * 5) - 2));

  if (p.age === 18) addNotification("🎉", "Chegaste à idade adulta!");
  if (p.age === 30) addNotification("🎂", "Entraste na casa dos 30.");
  if (p.age === 50) addNotification("🎂", "Chegaste aos 50 anos.");
  if (p.age === 65) addNotification("🌅", "Chegaste à idade da reforma.");

  if (p.health <= 0) {
    p.alive = false;
    p.job = "Sem atividade";
    p.salary = 0;
    addNotification("🕊️", "A tua personagem faleceu. A tua história chegou ao fim.");
  } else if (p.age >= 105) {
    p.alive = false;
    p.job = "Sem atividade";
    p.salary = 0;
    addNotification("🕊️", "A tua personagem faleceu de velhice.");
  } else if (p.age > 75 && Math.random() < (p.age - 74) * 0.025) {
    p.alive = false;
    p.job = "Sem atividade";
    p.salary = 0;
    addNotification("🕊️", "A tua personagem faleceu devido a causas naturais.");
  } else {
    addNotification("📅", `Fizeste ${p.age} anos. Um novo ano começa!`);
  }

  saveGame();
  renderAll();
  if (!p.alive) notify("A tua vida terminou. Podes consultar o teu percurso.");
}

function buyItem(type) {
  const items = {
    clothes: { name: "Roupa nova", price: 100, effect: () => { game.player.happiness = Math.min(100, game.player.happiness + 5); } },
    rest: { name: "Dia de descanso", price: 50, effect: () => { game.player.happiness = Math.min(100, game.player.happiness + 12); game.player.health = Math.min(100, game.player.health + 4); } },
    doctor: { name: "Consulta médica", price: 80, effect: () => { game.player.health = Math.min(100, game.player.health + 15); } }
  };

  const item = items[type];
  if (!item) return;
  if (game.balance < item.price) {
    notify("Não tens saldo suficiente.");
    return;
  }

  game.balance -= item.price;
  game.expenseTotal += item.price;
  item.effect();

  game.transactions.unshift({
    id: makeId(),
    description: item.name,
    amount: item.price,
    type: "expense",
    year: game.year
  });

  addNotification("🛍️", `Compraste: ${item.name}.`);
  saveGame();
  renderAll();
  notify("Compra realizada!");
}

function exportSave() {
  if (!game) return;
  const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "starlife-gravacao.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  notify("Gravação exportada.");
}

function importSave(file) {
  if (!file) return;
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.player || !Array.isArray(imported.family) || !Number.isFinite(imported.year)) {
        throw new Error("Formato inválido");
      }

      game = imported;
      game.transactions ||= [];
      game.notifications ||= [];
      game.businesses ||= [];
      game.assets ||= 0;
      game.player.health ??= 100;
      game.player.happiness ??= 100;
      game.player.alive ??= true;

      saveGame();
      $("bottomNav").hidden = false;
      $("creationScreen").classList.remove("active");
      renderAll();
      showTab("inicio");
      notify("Gravação importada com sucesso.");
    } catch (error) {
      console.error(error);
      notify("Este ficheiro não é uma gravação válida do StarLife.");
    }
    $("importSaveInput").value = "";
  };

  reader.readAsText(file);
}

function newLife() {
  if (!confirm("Tens a certeza? A vida atual será apagada deste dispositivo.")) return;

  localStorage.removeItem(STORAGE_KEY);
  game = null;
  initialFamily = [];
  $("bottomNav").hidden = true;
  $("familySettingsPanel").hidden = true;
  $("firstName").value = "";
  $("lastName").value = "";
  $("playerSex").value = "";
  $("playerAge").value = "18";
  $("playerCountry").value = "Portugal";
  $("playerCity").value = "";
  renderInitialFamily();
  updateCreationValidation();
  showScreen("creationScreen");
  notify("Nova vida pronta a criar.");
}

function init() {
  // Eventos da criação
  ["firstName", "lastName", "playerSex", "playerAge", "playerCountry", "playerCity"].forEach(id => {
    $(id).addEventListener("input", updateCreationValidation);
    $(id).addEventListener("change", updateCreationValidation);
  });

  $("addInitialRelative").addEventListener("click", () => openRelativeDialog("initial"));
  $("startGameButton").addEventListener("click", startGame);

  $("initialFamilyList").addEventListener("click", event => {
    const editId = event.target.dataset.initialEdit;
    const deleteId = event.target.dataset.initialDelete;

    if (editId) {
      const person = initialFamily.find(item => item.id === editId);
      if (person) openRelativeDialog("initial", person);
    }
    if (deleteId) deleteInitialRelative(deleteId);
  });

  // Diálogo de familiares
  $("relativeForm").addEventListener("submit", saveRelative);
  $("closeRelativeDialog").addEventListener("click", closeRelativeDialog);
  $("cancelRelative").addEventListener("click", closeRelativeDialog);

  // Navegação
  $("bottomNav").addEventListener("click", event => {
    const button = event.target.closest("[data-tab]");
    if (button) showTab(button.dataset.tab);
  });

  $("saveButton").addEventListener("click", () => {
    saveGame();
    notify("Jogo guardado.");
  });

  $("nextYearButton").addEventListener("click", advanceYear);

  // Património
  $("addTransactionButton").addEventListener("click", () => {
    const description = $("transactionDescription").value.trim();
    const amount = Number($("transactionAmount").value);
    const type = $("transactionType").value;

    if (addTransaction(description, amount, type)) {
      $("transactionDescription").value = "";
      $("transactionAmount").value = "";
      notify("Movimento registado.");
    }
  });

  // Carreira
  $("jobOptions").addEventListener("click", event => {
    const button = event.target.closest("[data-job]");
    if (button) applyForJob(Number(button.dataset.job));
  });

  $("educationOptions").addEventListener("click", event => {
    const button = event.target.closest("[data-education]");
    if (button) enrollEducation(Number(button.dataset.education));
  });

  // Negócios
  $("createBusinessButton").addEventListener("click", createBusiness);

  // Loja
  document.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => buyItem(button.dataset.buy));
  });

  // Definições e edição da família
  $("openFamilySettings").addEventListener("click", () => {
    $("familySettingsPanel").hidden = false;
    renderFamilySettings();
    $("familySettingsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("closeFamilySettings").addEventListener("click", () => {
    $("familySettingsPanel").hidden = true;
  });

  $("addSettingsRelative").addEventListener("click", () => openRelativeDialog("game"));

  $("settingsFamilyList").addEventListener("click", event => {
    const editId = event.target.dataset.familyEdit;
    const deleteId = event.target.dataset.familyDelete;

    if (editId) {
      const person = game.family.find(item => item.id === editId);
      if (person) openRelativeDialog("game", person);
    }
    if (deleteId) deleteRelative(deleteId);
  });

  $("exportSaveButton").addEventListener("click", exportSave);
  $("importSaveInput").addEventListener("change", event => importSave(event.target.files[0]));
  $("newLifeButton").addEventListener("click", newLife);

  // Recuperar a gravação
  game = loadGame();

  if (game) {
    $("bottomNav").hidden = false;
    showScreen("gameScreen");
    renderAll();
    showTab("inicio");
  } else {
    showScreen("creationScreen");
    updateCreationValidation();
  }
}

document.addEventListener("DOMContentLoaded", init);
