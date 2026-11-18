"use strict";

/* =========================================
   STARLIFE - MOTOR OFICIAL COMPLETO
========================================= */

const SAVE_KEY = "starlife_v18_bitlife_perfect";

let game = null;
let initialFamily = [];
let toastTimer = null;

// Gestão de Avatares no Setup
const avatarConfig = {
  Masculino: { total: 5, folder: "masculino", prefix: "Avatar_masculino_" },
  Feminino: { total: 2, folder: "feminino", prefix: "Avatar_feminino_" }
};

let currentAvatarIndex = 1;
window.selectedAvatarPath = "assets/modules/masculino/avatars/Avatar_masculino_1.png";

// Base de Países Mundiais com Moeda, Bancos e Cidades
const worldCountriesDatabase = {
  "Portugal": {
    currency: "EUR", symbol: "€",
    banks: [
      { id: "atlantico", name: "Banco Atlântico", interestRate: 0.045, desc: "Taxas competitivas para crédito habitação." },
      { id: "caixa", name: "Caixa Popular", interestRate: 0.052, desc: "Aprovação facilitada para jovens." },
      { id: "novafinanca", name: "Nova Finança Digital", interestRate: 0.038, desc: "Juros baixos para clientes com boa poupança." }
    ],
    cities: ["Lisboa", "Porto", "Coimbra", "Braga", "Faro", "Funchal", "Aveiro", "Viseu"]
  },
  "Brasil": {
    currency: "BRL", symbol: "R$",
    banks: [
      { id: "nubank", name: "NuBank Brasil", interestRate: 0.095, desc: "Cartão sem anuidade e conta digital." },
      { id: "itau", name: "Itaú Unibanco", interestRate: 0.110, desc: "Tradição e solidez no crédito imobiliário." },
      { id: "bancodobrasil", name: "Banco do Brasil", interestRate: 0.100, desc: "Crédito facilitado para cidadãos." }
    ],
    cities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Curitiba", "Brasília", "Fortaleza", "Manaus"]
  },
  "Espanha": {
    currency: "EUR", symbol: "€",
    banks: [
      { id: "santander", name: "Banco Santander", interestRate: 0.042, desc: "Líder ibérico em financiamento." },
      { id: "bbva", name: "BBVA España", interestRate: 0.046, desc: "Inovação e crédito habitação." }
    ],
    cities: ["Madrid", "Barcelona", "Valência", "Sevilha", "Málaga", "Bilbau", "Saragoça"]
  },
  "França": {
    currency: "EUR", symbol: "€",
    banks: [
      { id: "bnp", name: "BNP Paribas", interestRate: 0.039, desc: "Soluções bancárias de alto nível." },
      { id: "societegenerale", name: "Société Générale", interestRate: 0.041, desc: "Crédito eficiente." }
    ],
    cities: ["Paris", "Lyon", "Marselha", "Nice", "Toulouse", "Bordéus", "Nantes"]
  },
  "Reino Unido": {
    currency: "GBP", symbol: "£",
    banks: [
      { id: "barclays", name: "Barclays UK", interestRate: 0.048, desc: "Traditional British banking." },
      { id: "hsbc", name: "HSBC London", interestRate: 0.045, desc: "Global financial services." }
    ],
    cities: ["Londres", "Manchester", "Birmingham", "Edimburgo", "Glasgow", "Liverpool", "Bristol"]
  },
  "Estados Unidos": {
    currency: "USD", symbol: "$",
    banks: [
      { id: "chase", name: "Chase Bank USA", interestRate: 0.055, desc: "Nationwide standard financial services." },
      { id: "bofa", name: "Bank of America", interestRate: 0.058, desc: "Secure loans and investment accounts." }
    ],
    cities: ["Nova Iorque", "Los Angeles", "Chicago", "Miami", "San Francisco", "Las Vegas", "Boston", "Seattle"]
  },
  "Japão": {
    currency: "JPY", symbol: "¥",
    banks: [
      { id: "mufg", name: "MUFG Bank Tokyo", interestRate: 0.015, desc: "Low interest national banking." },
      { id: "smbc", name: "Sumitomo Mitsui", interestRate: 0.018, desc: "Trusted Japanese financial institution." }
    ],
    cities: ["Tóquio", "Osaka", "Quioto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"]
  }
};

const sampleMaleNames = ["João", "Pedro", "Miguel", "Francisco", "Tiago", "Diogo", "André", "Rafael", "Gonçalo", "Martim"];
const sampleFemaleNames = ["Maria", "Ana", "Beatriz", "Inês", "Sofia", "Matilde", "Leonor", "Carolina", "Mariana", "Margarida"];

const $ = id => document.getElementById(id);

function createId(prefix = "id") {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function money(value) {
  const country = game ? game.player.country : "Portugal";
  const currData = worldCountriesDatabase[country] || { currency: "EUR", symbol: "€" };
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currData.currency,
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

/* =========================================
   AVATAR E GÉNERO DINÂMICO NO SETUP
========================================= */

function updateSetupAvatarUI() {
  const sexEl = $("playerSex");
  const sex = sexEl ? sexEl.value : "Masculino";
  const cfg = avatarConfig[sex] || avatarConfig.Masculino;
  
  if (currentAvatarIndex > cfg.total) currentAvatarIndex = 1;
  if (currentAvatarIndex < 1) currentAvatarIndex = cfg.total;

  window.selectedAvatarPath = `assets/modules/${cfg.folder}/avatars/${cfg.prefix}${currentAvatarIndex}.png`;
  
  const imgEl = $("setupAvatarImg");
  const indexEl = $("setupAvatarIndex");
  if (imgEl) imgEl.src = window.selectedAvatarPath;
  if (indexEl) indexEl.textContent = `#${currentAvatarIndex}`;  // Atualizar apenas o texto de ajuda visual (Ex: Maria / Ex: João) sem tocar no valor inserido pelo utilizador const nameHint = $("nameHint"); if (nameHint) { const suggestedName = sex === "Feminino" ? randomFrom(sampleFemaleNames) : randomFrom(sampleMaleNames); nameHint.textContent = `(Ex: ${suggestedName})`;
  }
}

window.changeSetupAvatar = function(dir) {
  currentAvatarIndex += dir;
  updateSetupAvatarUI();
};

window.onSetupGenderChange = function() {
  currentAvatarIndex = 1;
  updateSetupAvatarUI();
};

/* =========================================
   POPULAR PAÍSES E CIDADES NO SETUP
========================================= */

function initSetupGeography() {
  const countrySelect = $("playerCountrySelect");
  if (!countrySelect) return;

  countrySelect.innerHTML = "";
  Object.keys(worldCountriesDatabase).forEach(country => {
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    countrySelect.appendChild(opt);
  });

  const optOther = document.createElement("option");
  optOther.value = "Outro";
  optOther.textContent = "Outro País...";
  countrySelect.appendChild(optOther);

  countrySelect.value = "Portugal";
  updateCityOptions("Portugal");
}

window.onCountryChange = function() {
  const countrySelect = $("playerCountrySelect");
  const customGroup = $("customCountryGroup");
  const isOther = countrySelect.value === "Outro";
  if (customGroup) customGroup.style.display = isOther ? "block" : "none";

  if (!isOther) {
    updateCityOptions(countrySelect.value);
  } else {
    const citySelect = $("playerCitySelect");
    citySelect.innerHTML = `<option value="Outro">Outra Cidade...</option>`;
    $("customCityGroup").style.display = "block";
  }
};

function updateCityOptions(countryName) {
  const citySelect = $("playerCitySelect");
  const customCityGroup = $("customCityGroup");
  if (!citySelect) return;

  citySelect.innerHTML = "";
  const data = worldCountriesDatabase[countryName];
  if (data && data.cities) {
    data.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
  }

  const optOther = document.createElement("option");
  optOther.value = "Outro";
  optOther.textContent = "Outra Cidade...";
  citySelect.appendChild(optOther);

  if (customCityGroup) customCityGroup.style.display = "none";
  citySelect.value = citySelect.options[0]?.value || "";
}

window.onCitySelectChange = function() {
  const citySelect = $("playerCitySelect");
  const customCityGroup = $("customCityGroup");
  if (citySelect && customCityGroup) {
    customCityGroup.style.display = citySelect.value === "Outro" ? "block" : "none";
  }
};

/* =========================================
   GUARDAR / CARREGAR JOGO
========================================= */

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
    loaded.player.avatarPath ??= "assets/modules/masculino/avatars/Avatar_masculino_1.png";
    loaded.player.licenses ??= { carB: false, bikeAM: false, bikeA1: false, bikeA2: false, bikeA: false };
    loaded.player.bankAccount ??= null;
    loaded.player.activeRental ??= null;
    loaded.properties ??= [];
    loaded.marketListings ??= [];
    loaded.vehicles ??= [];
    loaded.businesses ??= [];
    loaded.player.illness ??= null;
    loaded.player.maxAge ??= randomNumber(78, 108);
    loaded.family.forEach(f => {
      f.relationship ??= randomNumber(65, 95);
      f.alive ??= true;
      f.maxAge ??= randomNumber(78, 102);
    });
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
   ILUSTRAÇÕES SVG (CASAS)
========================================= */

function getHouseSVG(type) {
  if (type === "studio") {
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="30" y="25" width="60" height="45" rx="4" fill="#3b82f6"/><polygon points="25,25 60,8 95,25" fill="#1d4ed8"/><rect x="52" y="45" width="16" height="25" fill="#93c5fd"/><rect x="36" y="34" width="12" height="12" fill="#fde047"/></svg>`;
  }
  if (type === "apartment") {
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="25" y="12" width="70" height="58" rx="3" fill="#6366f1"/><rect x="35" y="20" width="14" height="12" fill="#fef08a"/><rect x="71" y="20" width="14" height="12" fill="#fef08a"/><rect x="35" y="38" width="14" height="12" fill="#fef08a"/><rect x="71" y="38" width="14" height="12" fill="#fef08a"/><rect x="52" y="52" width="16" height="18" fill="#c7d2fe"/></svg>`;
  }
  if (type === "house") {
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="18" y="30" width="84" height="40" rx="3" fill="#10b981"/><polygon points="12,30 60,8 108,30" fill="#047857"/><rect x="52" y="45" width="16" height="25" fill="#d1fae5"/><rect x="26" y="40" width="16" height="14" fill="#fef08a"/><rect x="78" y="40" width="16" height="14" fill="#fef08a"/></svg>`;
  }
  return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="10" y="28" width="100" height="42" rx="4" fill="#f59e0b"/><polygon points="5,28 60,5 115,28" fill="#b45309"/><rect x="50" y="42" width="20" height="28" fill="#fef3c7"/><rect x="20" y="36" width="18" height="14" fill="#fef08a"/><rect x="82" y="36" width="18" height="14" fill="#fef08a"/></svg>`;
}

/* =========================================
   BANCOS E MERCADO BASEADOS NO PAÍS
========================================= */

function getActiveCountryBanks() {
  const country = game ? game.player.country : "Portugal";
  const data = worldCountriesDatabase[country];
  return data ? data.banks : worldCountriesDatabase["Portugal"].banks;
}

function openBankAccount(bankId) {
  const banks = getActiveCountryBanks();
  const bank = banks.find(b => b.id === bankId);
  if (!bank) return;
  game.player.bankAccount = { bankId: bank.id, bankName: bank.name, interestRate: bank.interestRate };
  addEvent(`Abriste conta bancária no ${bank.name}! 🏦`, "positive");
  saveGame();
  renderGame();
}

function renderBankSection() {
  const container = $("bankSectionContainer");
  if (!container) return;
  const player = game.player;
  const banks = getActiveCountryBanks();

  if (!player.bankAccount) {
    let html = `<div class="panel"><h3>🏦 Abrir Conta Bancária (${player.country})</h3><p class="muted">Escolhe um banco local para gerir dinheiro e crédito habitação:</p><div class="button-list">`;
    banks.forEach(b => {
      html += `
        <div class="person-card" style="flex-direction: column; align-items: flex-start; gap: 6px;">
          <strong>${escapeHTML(b.name)}</strong>
          <small>${escapeHTML(b.desc)} (Taxa Crédito: ${(b.interestRate * 100).toFixed(1)}%)</small>
          <button class="primary-btn full-width" onclick="openBankAccount('${b.id}')">Abrir Conta</button>
        </div>
      `;
    });
    html += `</div></div>`;
    container.innerHTML = html;
  } else {
    container.innerHTML = `
      <div class="panel">
        <h3>🏦 O Teu Banco</h3>
        <div class="info-row"><span>Instituição</span><strong>${escapeHTML(player.bankAccount.bankName)}</strong></div>
        <div class="info-row"><span>Taxa de Juro Crédito</span><strong>${(player.bankAccount.interestRate * 100).toFixed(1)}%</strong></div>
      </div>
    `;
  }
}

const streetNames = ["Rua das Flores", "Avenida da Liberdade", "Travessa do Sol", "Alameda dos Oceanos", "Rua da Bela Vista", "Praceta das Oliveiras", "Avenida Central", "Rua do Miradouro"];
const propertyTemplates = [
  { title: "Estúdio T0 Acolhedor", type: "studio", buyPrice: 75000, rentMonthly: 480, happiness: 4 },
  { title: "Apartamento T1 Moderno", type: "apartment", buyPrice: 135000, rentMonthly: 720, happiness: 8 },
  { title: "Apartamento T2 Familiar", type: "apartment", buyPrice: 195000, rentMonthly: 950, happiness: 12 },
  { title: "Moradia Geminada T3", type: "house", buyPrice: 310000, rentMonthly: 1350, happiness: 18 },
  { title: "Moradia Isolada com Jardim", type: "house", buyPrice: 480000, rentMonthly: 1900, happiness: 24 },
  { title: "Mansão de Luxo Vista Mar", type: "mansion", buyPrice: 950000, rentMonthly: 3500, happiness: 35 }
];

function generateYearlyMarket() {
  if (!game) return;
  const listings = [];
  const count = randomNumber(3, 4);
  for (let i = 0; i < count; i++) {
    const tpl = randomFrom(propertyTemplates);
    const variance = 0.9 + Math.random() * 0.25;
    listings.push({
      id: createId("house"),
      title: tpl.title,
      type: tpl.type,
      address: `${randomFrom(streetNames)}, n.º ${randomNumber(1, 240)},${game.player.city}`,
      buyPrice: Math.round((tpl.buyPrice * variance) / 500) * 500,
      rentMonthly: Math.round((tpl.rentMonthly * variance) / 10) * 10,
      happiness: tpl.happiness
    });
  }
  game.marketListings = listings;
}

function openPropertyModal(listingId) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  const modal = $("customModal");
  modal.innerHTML = `
    <div class="modal-card">
      <div style="text-align: center; margin-bottom: 10px;">${getHouseSVG(house.type)}</div>
      <h3>${escapeHTML(house.title)}</h3>
      <p class="muted" style="margin-bottom: 10px;">📍 ${escapeHTML(house.address)}</p>
      <div class="info-row"><span>Preço de Compra</span><strong>${money(house.buyPrice)}</strong></div>
      <div class="info-row"><span>Renda Mensal</span><strong>${money(house.rentMonthly)}/mês</strong></div>
      
      <div style="margin-top: 14px;">
        <h4>Arrendar Contrato</h4>
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <button class="secondary-btn" style="flex:1" onclick="rentProperty('${house.id}', 12)">12 Meses</button>
          <button class="secondary-btn" style="flex:1" onclick="rentProperty('${house.id}', 24)">24 Meses</button>
          <button class="secondary-btn" style="flex:1" onclick="rentProperty('${house.id}', 36)">36 Meses</button>
        </div>
      </div>

      <div style="margin-top: 14px;">
        <h4>Comprar Imóvel</h4>
        <div class="modal-buttons" style="margin-top: 6px;">
          <button class="primary-btn full-width" onclick="buyPropertyTransfer('${house.id}')">💳 Transferência (${money(house.buyPrice)})</button>
          <button class="secondary-btn full-width" onclick="buyPropertyMortgage('${house.id}')">🏦 Crédito Habitação</button>
        </div>
      </div>

      <button class="danger-btn full-width" style="margin-top: 14px;" onclick="closeCustomModal()">Fechar</button>
    </div>
  `;
  modal.classList.remove("hidden");
}

function closeCustomModal() {
  $("customModal").classList.add("hidden");
}

function rentProperty(listingId, months) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  if (game.player.age < 18) { showToast("Precisas de ter 18 anos."); return; }
  if (game.player.bank < house.rentMonthly * 2) { showToast("Precisas de 2 meses de caução."); return; }

  game.player.bank -= house.rentMonthly * 2;
  game.player.activeRental = { title: house.title, address: house.address, rentMonthly: house.rentMonthly, monthsRemaining: months, happiness: house.happiness };
  addEvent(`Assinaste contrato de arrendamento (${months} meses) em ${house.address}! 🔑`, "positive"); closeCustomModal(); saveGame(); renderGame(); }  function buyPropertyTransfer(listingId) { const house = game.marketListings.find(h => h.id === listingId); if (!house) return; if (!game.player.bankAccount) { showToast("Abre primeiro uma conta bancária!"); return; } if (game.player.bank < house.buyPrice) { showToast("Saldo insuficiente."); return; }  game.player.bank -= house.buyPrice; const isFirst = game.properties.length === 0; game.properties.push({ id: createId("prop"), title: house.title, type: house.type, address: house.address, value: house.buyPrice, mortgageRemaining: 0, annualPayment: 0, status: isFirst ? "primary" : "rented_out", rentalIncomeAnnual: house.rentMonthly * 12, happiness: house.happiness }); game.marketListings = game.marketListings.filter(h => h.id !== listingId); addEvent(`Compraste "${house.title}" a pronto! 🏡`, "positive");
  closeCustomModal();
  saveGame();
  renderGame();
}

function buyPropertyMortgage(listingId) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  if (!game.player.bankAccount) { showToast("Abre primeiro uma conta bancária!"); return; }
  if (game.player.age < 18) { showToast("Precisas de ter 18 anos."); return; }

  const downPayment = Math.round(house.buyPrice * 0.15);
  if (game.player.bank < downPayment) { showToast(`Precisas de ${money(downPayment)} de entrada (15%).`); return; }

  const loanAmount = house.buyPrice - downPayment;
  const annualPayment = Math.round((loanAmount / 25) * (1 + game.player.bankAccount.interestRate));

  game.player.bank -= downPayment;
  game.player.debt += loanAmount;
  const isFirst = game.properties.length === 0;

  game.properties.push({
    id: createId("prop"), title: house.title, type: house.type, address: house.address,
    value: house.buyPrice, mortgageRemaining: loanAmount, annualPayment,
    status: isFirst ? "primary" : "rented_out", rentalIncomeAnnual: house.rentMonthly * 12, happiness: house.happiness
  });
  game.marketListings = game.marketListings.filter(h => h.id !== listingId);
  addEvent(`Crédito Habitação aprovado para "${house.title}"! 🏦🏡`, "positive");
  closeCustomModal();
  saveGame();
  renderGame();
}

function renderHousingSection() {
  const container = $("housingSectionContainer");
  if (!container) return;
  const player = game.player;

  let html = `<div class="panel"><h3>🏡 Loja de Imobiliário</h3>`;
  if (player.activeRental) {
    html += `<div class="person-card" style="flex-direction: column; align-items: flex-start; margin-bottom: 10px; border-left: 4px solid var(--accent-color);"><strong>Arrendado: ${escapeHTML(player.activeRental.title)}</strong><small>📍 ${escapeHTML(player.activeRental.address)}</small><small>Renda: ${money(player.activeRental.rentMonthly)}/mês (${player.activeRental.monthsRemaining} meses restantes)</small></div>`;
  }
  html += `<h4 style="margin-top: 8px;">Imóveis Disponíveis (Clica para ver e comprar)</h4><div class="button-list">`;
  game.marketListings.forEach(h => {
    html += `
      <div class="person-card house-card" onclick="openPropertyModal('${h.id}')">
        <div style="width: 65px; flex-shrink: 0;">${getHouseSVG(h.type)}</div>
        <div style="flex: 1; margin-left: 10px;"><strong>${escapeHTML(h.title)}</strong><small style="display:block;">Compra: ${money(h.buyPrice)} \vert{} Renda:${money(h.rentMonthly)}/mês</small></div>
      </div>
    `;
  });
  html += `</div></div>`;
  container.innerHTML = html;
}

function processHousingYear() {
  const player = game.player;
  if (player.activeRental) {
    player.bank -= player.activeRental.rentMonthly * 12;
    player.activeRental.monthsRemaining -= 12;
    player.happiness = clamp(player.happiness + 2);
    if (player.activeRental.monthsRemaining <= 0) {
      addEvent(`O contrato de arrendamento de "${player.activeRental.title}" terminou.`, "neutral"); player.activeRental = null; } } game.properties.forEach(p => { if (p.mortgageRemaining > 0) { player.bank -= p.annualPayment; p.mortgageRemaining = Math.max(0, p.mortgageRemaining - p.annualPayment); player.debt = Math.max(0, player.debt - p.annualPayment); } if (p.status === "rented_out") { player.bank += p.rentalIncomeAnnual; addFinanceEvent(`Recebeste ${money(p.rentalIncomeAnnual)} de rendas.`);
    } else if (p.status === "primary") {
      player.happiness = clamp(player.happiness + 3);
    }
  });
}

/* =========================================
   GESTÃO DE BENS E PATRIMÓNIO
========================================= */

function togglePropertyStatus(propId) {
  const prop = game.properties.find(p => p.id === propId);
  if (!prop) return;
  if (prop.status === "primary") {
    prop.status = "rented_out";
    addEvent(`Colocaste "${prop.title}" a arrendar.`, "positive");
  } else {
    game.properties.forEach(p => { if (p.status === "primary") p.status = "rented_out"; });
    prop.status = "primary";
    addEvent(`Definiste "${prop.title}" como tua moradia principal.`, "positive");
  }
  saveGame();
  renderGame();
}

function sellProperty(propId) {
  const idx = game.properties.findIndex(p => p.id === propId);
  if (idx === -1) return;
  const prop = game.properties[idx];
  if (!confirm(`Tens a certeza de que queres vender "${prop.title}" por ${money(prop.value)}?`)) return;

  game.player.bank += prop.value;
  if (prop.mortgageRemaining > 0) {
    game.player.debt = Math.max(0, game.player.debt - prop.mortgageRemaining);
  }
  game.properties.splice(idx, 1);
  addEvent(`Vendeste o imóvel "${prop.title}" por ${money(prop.value)}.`, "positive");
  saveGame();
  renderGame();
}

function sellVehicle(vehId) {
  const idx = game.vehicles.findIndex(v => v.id === vehId);
  if (idx === -1) return;
  const veh = game.vehicles[idx];
  const sellPrice = Math.round(veh.value * 0.75);
  if (!confirm(`Queres vender "${veh.name}" por ${money(sellPrice)}?`)) return;

  game.player.bank += sellPrice;
  game.vehicles.splice(idx, 1);
  addEvent(`Vendeste o veículo "${veh.name}" por ${money(sellPrice)}.`, "positive");
  saveGame();
  renderGame();
}

function renderMyAssets() {
  const container = $("myAssetsContainer");
  if (!container) return;
  
  let html = `<div class="panel"><h3>🏡 Os Teus Imóveis & Bens</h3>`;
  if (game.properties.length === 0 && game.vehicles.length === 0) {
    html += `<p class="muted">Ainda não tens imóveis nem veículos comprados. Visita a Loja!</p>`;
  }

  game.properties.forEach(p => {
    const statusLbl = p.status === "primary" ? "🏠 Moradia Principal" : `💰 A Arrendar (+${money(p.rentalIncomeAnnual)}/ano)`;
    html += `
      <div class="person-card" style="flex-direction: column; align-items: flex-start; margin-bottom: 8px;">
        <div style="display:flex; align-items:center; gap:10px; width:100%;">
          <div style="width:55px;">${getHouseSVG(p.type)}</div>
          <div style="flex:1;"><strong>${escapeHTML(p.title)}</strong><small style="display:block;">${escapeHTML(p.address)}</small><small style="color: var(--success-color);">${statusLbl}</small></div>
        </div>
        <div style="display: flex; gap: 6px; width: 100%; margin-top: 6px;">
          <button class="small-btn" style="flex: 1;" onclick="togglePropertyStatus('${p.id}')">${p.status === "primary" ? "Arrendar" : "Tornar Principal"}</button>
          <button class="small-btn danger-btn" style="flex: 1;" onclick="sellProperty('${p.id}')">Vender (${money(p.value)})</button>
        </div>
      </div>
    `;
  });

  if (game.vehicles.length > 0) {
    html += `<h4 style="margin-top: 15px;">Veículos na Garagem</h4>`;
    game.vehicles.forEach(v => {
      html += `
        <div class="person-card" style="margin-bottom: 6px;">
          <div><strong>${escapeHTML(v.name)}</strong><small style="display:block;">Valor: ${money(v.value)}</small></div>
          <button class="small-btn danger-btn" onclick="sellVehicle('${v.id}')">Vender</button>
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

/* =========================================
   CARTAS E VEÍCULOS
========================================= */

const licenseRules = {
  bikeAM: { name: "Carta AM (Ciclomotores até 50cc)", minAge: 16, cost: 250 },
  bikeA1: { name: "Carta A1 (Motos até 125cc / 11kW)", minAge: 16, cost: 380 },
  bikeA2: { name: "Carta A2 (Motos até 35kW)", minAge: 18, cost: 500 },
  bikeA:  { name: "Carta A (Motos Pesadas)", minAge: 24, cost: 650 },
  carB:   { name: "Carta B (Carros Ligeiros)", minAge: 18, cost: 650 }
};

const availableCars = [
  { name: "Yaris City", brand: "Toyo", price: 2500, annualCost: 450, reqLicense: "carB" },
  { name: "Golf GTI", brand: "Volks", price: 12000, annualCost: 750, reqLicense: "carB" },
  { name: "Série 3 Desportivo", brand: "BWM", price: 28000, annualCost: 1300, reqLicense: "carB" }
];

const availableBikes = [
  { name: "Scooter Urban 50", brand: "Yamah", cc: "50cc", price: 1800, annualCost: 200, reqLicense: "bikeAM" },
  { name: "CBR 125R", brand: "Hona", cc: "125cc", price: 3400, annualCost: 320, reqLicense: "bikeA1" },
  { name: "Ninja 400 Sport", brand: "Kawas", cc: "400cc", price: 6200, annualCost: 480, reqLicense: "bikeA2" },
  { name: "Monster 821 Naked", brand: "Ducati", cc: "821cc", price: 10500, annualCost: 700, reqLicense: "bikeA2" },
  { name: "R1 Superbike", brand: "Yamah", cc: "1000cc", price: 17500, annualCost: 1100, reqLicense: "bikeA" }
];

function takeLicense(licenseKey) {
  const player = game.player;
  const rule = licenseRules[licenseKey];
  if (!rule) return;

  if (licenseKey === "bikeA" && player.age < 24) {
    showToast("Para a Carta A precisas de 24 anos.");
    return;
  }
  if (player.age < rule.minAge) {
    showToast(`Precisas de ter pelo menos ${rule.minAge} anos.`);
    return;
  }
  if (player.bank < rule.cost) {
    showToast(`Sem saldo suficiente (${money(rule.cost
