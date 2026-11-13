const $ = id => document.getElementById(id);
const SAVE_KEY = "vidaGlobalSave_v1";

const countries = [
["Portugal","PT","EUR","€"],["Brasil","BR","BRL","R$"],["Estados Unidos","US","USD","$"],["Canadá","CA","CAD","CA$"],["Reino Unido","GB","GBP","£"],["Alemanha","DE","EUR","€"],["França","FR","EUR","€"],["Espanha","ES","EUR","€"],["Itália","IT","EUR","€"],["Suíça","CH","CHF","CHF"],["Japão","JP","JPY","¥"],["China","CN","CNY","¥"],["Índia","IN","INR","₹"],["Austrália","AU","AUD","A$"],["Nova Zelândia","NZ","NZD","NZ$"],["México","MX","MXN","$"],["Argentina","AR","ARS","$"],["Chile","CL","CLP","$"],["Colômbia","CO","COP","$"],["África do Sul","ZA","ZAR","R"],["Angola","AO","AOA","Kz"],["Moçambique","MZ","MZN","MT"],["Cabo Verde","CV","CVE","$"],["Irlanda","IE","EUR","€"],["Países Baixos","NL","EUR","€"],["Bélgica","BE","EUR","€"],["Luxemburgo","LU","EUR","€"],["Suécia","SE","SEK","kr"],["Noruega","NO","NOK","kr"],["Dinamarca","DK","DKK","kr"],["Polónia","PL","PLN","zł"],["Turquia","TR","TRY","₺"],["Rússia","RU","RUB","₽"],["Coreia do Sul","KR","KRW","₩"],["Singapura","SG","SGD","S$"],["Emirados Árabes Unidos","AE","AED","د.إ"],["Arábia Saudita","SA","SAR","﷼"],["Egito","EG","EGP","£"],["Marrocos","MA","MAD","د.م."],["Tailândia","TH","THB","฿"],["Indonésia","ID","IDR","Rp"],["Filipinas","PH","PHP","₱"],["Ucrânia","UA","UAH","₴"],["Grécia","GR","EUR","€"],["Áustria","AT","EUR","€"],["Finlândia","FI","EUR","€"],["Islândia","IS","ISK","kr"],["Roménia","RO","RON","lei"],["Croácia","HR","EUR","€"],["Uruguai","UY","UYU","$"]
];

let game = null;
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(name).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}
function toast(msg){
  const t=$("toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600);
}
function getCountry(){
  return countries.find(c=>c[1]=== $("country").value) || countries[0];
}
function updateCurrency(){
  const c=getCountry();
  $("currencyPreview").textContent=`${c[2]} (${c[3]})`;
}
function fillCountries(){
  $("country").innerHTML=countries.map(c=>`<option value="${c[1]}">${c[0]}</option>`).join("");
  $("country").value="PT";updateCurrency();
}
function readPerson(prefix, role){
  return {
    role,
    name:$(prefix+"Name").value.trim(),
    gender:$(prefix+"Gender").value,
    age:Number($(prefix+"Age").value||0)
  };
}
function startGame(e){
  e.preventDefault();
  const c=getCountry();
  game={
    player:{
      firstName:$("playerFirst").value.trim(),
      lastName:$("playerLast").value.trim(),
      gender:$("playerGender").value,
      age:Number($("playerAge").value),
      appearance:{skin:$("skin").value,hair:$("hair").value,hairstyle:$("hairstyle").value}
    },
    location:{country:c[0],code:c[1],currency:c[2],symbol:c[3],city:$("city").value.trim()},
    family:[
      readPerson("father","Pai"),
      readPerson("mother","Mãe"),
      readPerson("sibling","Irmão/irmã")
    ],
    money:0,year:new Date().getFullYear(),createdAt:new Date().toISOString()
  };
  saveGame();renderGame();showScreen("gameScreen");toast("A tua nova vida começou!");
}
function saveGame(){
  if(game) localStorage.setItem(SAVE_KEY,JSON.stringify(game));
}
function loadGame(){
  try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch{return null}
}
function formatMoney(amount){
  if(!game)return "—";
  try{return new Intl.NumberFormat("pt-PT",{style:"currency",currency:game.location.currency,maximumFractionDigits:0}).format(amount)}
  catch{return `${game.location.symbol}${Math.round(amount)}`}
}
function renderGame(){
  $("welcomeName").textContent=`Olá, ${game.player.firstName}!`;
  $("welcomeLocation").textContent=`${game.location.city}, ${game.location.country} · ${game.location.currency} (${game.location.symbol})`;
  $("gameAge").textContent=game.player.age;
  $("gameMoney").textContent=formatMoney(game.money);
  $("familySummary").innerHTML=game.family.map(p=>{
    const displayName=p.name||"Por definir";
    const relation=p.role==="Irmão/irmã"?(p.gender==="Feminino"?"Irmã":"Irmão"):p.role;
    return `<div class="family-person"><b>${relation}</b><span>${escapeHTML(displayName)}</span><span>${p.gender} · ${p.age} anos</span></div>`;
  }).join("");
}
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function continueGame(){
  const saved=loadGame();
  if(!saved){toast("Ainda não existe nenhum jogo guardado.");return}
  game=saved;renderGame();showScreen("gameScreen");
}
function ageUp(){
  game.player.age++;
  game.year++;
  game.family.forEach(p=>p.age++);
  saveGame();renderGame();
  toast(`Avançaste para os ${game.player.age} anos.`);
}
function resetForm(){
  $("creatorForm").reset();$("country").value="PT";updateCurrency();
}
$("newGameBtn").addEventListener("click",()=>{resetForm();showScreen("creatorScreen")});
$("continueBtn").addEventListener("click",continueGame);
$("backHome").addEventListener("click",()=>showScreen("homeScreen"));
$("cancelCreate").addEventListener("click",()=>showScreen("homeScreen"));
$("creatorForm").addEventListener("submit",startGame);
$("country").addEventListener("change",updateCurrency);
$("ageUpBtn").addEventListener("click",ageUp);
$("restartBtn").addEventListener("click",()=>showScreen("homeScreen"));
$("settingsBtn").addEventListener("click",()=>toast("As definições serão adicionadas numa próxima versão."));
fillCountries();
if(loadGame()){$("continueBtn").disabled=false;$("saveNote").textContent="Encontrámos um jogo guardado neste dispositivo."}
else{$("continueBtn").disabled=true;$("continueBtn").style.opacity=".55"}
