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
  if (indexEl) indexEl.textContent = `#${currentAvatarIndex}`;  const nameHint = $("nameHint"); if (nameHint) { const suggestedName = sex === "Feminino" ? randomFrom(sampleFemaleNames) : randomFrom(sampleMaleNames); nameHint.textContent = `(Ex: ${suggestedName})`;
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
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="30
