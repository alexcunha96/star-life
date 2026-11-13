const $ = id => document.getElementById(id);
const SAVE_KEY = "starLifeSave_v2";
const OLD_SAVE_KEY = "vidaGlobalSave_v1";

const countries = [
["Portugal","PT","EUR","€"],["Brasil","BR","BRL","R$"],["Estados Unidos","US","USD","$"],["Canadá","CA","CAD","CA$"],["Reino Unido","GB","GBP","£"],["Alemanha","DE","EUR","€"],["França","FR","EUR","€"],["Espanha","ES","EUR","€"],["Itália","IT","EUR","€"],["Suíça","CH","CHF","CHF"],["Japão","JP","JPY","¥"],["China","CN","CNY","¥"],["Índia","IN","INR","₹"],["Austrália","AU","AUD","A$"],["Nova Zelândia","NZ","NZD","NZ$"],["México","MX","MXN","$"],["Argentina","AR","ARS","$"],["Chile","CL","CLP","$"],["Colômbia","CO","COP","$"],["África do Sul","ZA","ZAR","R"],["Angola","AO","AOA","Kz"],["Moçambique","MZ","MZN","MT"],["Cabo Verde","CV","CVE","$"],["Irlanda","IE","EUR","€"],["Países Baixos","NL","EUR","€"],["Bélgica","BE","EUR","€"],["Luxemburgo","LU","EUR","€"],["Suécia","SE","SEK","kr"],["Noruega","NO","NOK","kr"],["Dinamarca","DK","DKK","kr"],["Polónia","PL","PLN","zł"],["Turquia","TR","TRY","₺"],["Rússia","RU","RUB","₽"],["Coreia do Sul","KR","KRW","₩"],["Singapura","SG","SGD","S$"],["Emirados Árabes Unidos","AE","AED","د.إ"],["Arábia Saudita","SA","SAR","﷼"],["Egito","EG","EGP","£"],["Marrocos","MA","MAD","د.م."],["Tailândia","TH","THB","฿"],["Indonésia","ID","IDR","Rp"],["Filipinas","PH","PHP","₱"],["Ucrânia","UA","UAH","₴"],["Grécia","GR","EUR","€"],["Áustria","AT","EUR","€"],["Finlândia","FI","EUR","€"],["Islândia","IS","ISK","kr"],["Roménia","RO","RON","lei"],["Croácia","HR","EUR","€"],["Uruguai","UY","UYU","$"]
];

let game = null;
let creatorFamily = defaultFamily();

function defaultFamily(){
  return {
    father:{roleType:"Pai",name:"",gender:"Masculino",age:45,active:true},
    mother:{roleType:"Mãe",name:"",gender:"Feminino",age:43,active:true},
    siblingsEnabled:true,
    siblings:[{id:makeId(),name:"",gender:"Masculino",age:15,relation:"full",active:true}]
  };
}
function makeId(){ return "sib_"+Math.random().toString(36).slice(2,10); }
function normalizeFamily(f){
  const d=defaultFamily();
  if(!f) return d;
  // Compatibilidade com as gravações da primeira versão.
  if(Array.isArray(f)){
    const father=f.find(p=>p.role==="Pai")||{};
    const mother=f.find(p=>p.role==="Mãe")||{};
    const sib=f.find(p=>String(p.role||"").includes("Irmão"))||{};
    return {
      father:{roleType:"Pai",name:father.name||"",gender:father.gender||"Masculino",age:Number(father.age??45),active:true},
      mother:{roleType:"Mãe",name:mother.name||"",gender:mother.gender||"Feminino",age:Number(mother.age??43),active:true},
      siblingsEnabled:true,
      siblings:sib.name||sib.age!==undefined?[{id:makeId(),name:sib.name||"",gender:sib.gender||"Masculino",age:Number(sib.age??15),relation:"full",active:true}]:[]
    };
  }
  return {
    father:{...d.father,...(f.father||{})},
    mother:{...d.mother,...(f.mother||{})},
    siblingsEnabled:f.siblingsEnabled!==false,
    siblings:Array.isArray(f.siblings)?f.siblings.map(s=>({id:s.id||makeId(),name:s.name||"",gender:s.gender||"Masculino",age:Number(s.age??0),relation:s.relation==="half"?"half":"full",active:s.active!==false})):d.siblings
  };
}
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(name).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}
function toast(msg){
  const t=$("toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600);
}
function getCountry(){return countries.find(c=>c[1]===$("country").value)||countries[0];}
function updateCurrency(){const c=getCountry();$("currencyPreview").textContent=`${c[2]} (${c[3]})`;}
function fillCountries(){
  $("country").innerHTML=countries.map(c=>`<option value="${c[1]}">${c[0]}</option>`).join("");
  $("country").value="PT";updateCurrency();
}
function escapeHTML(str){
  return String(str??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function personCard(key, title, data, parentKind){
  const isFather=parentKind==="father";
  const options=isFather
    ? `<option value="Pai" ${data.roleType==="Pai"?"selected":""}>Pai</option><option value="Padrasto" ${data.roleType==="Padrasto"?"selected":""}>Padrasto</option>`
    : `<option value="Mãe" ${data.roleType==="Mãe"?"selected":""}>Mãe</option><option value="Madrasta" ${data.roleType==="Madrasta"?"selected":""}>Madrasta</option>`;
  return `<article class="family-card parent-card">
    <div class="family-card-head"><div class="family-icon">${isFather?"👨":"👩"}</div><h4>${title}</h4></div>
    <label>Relação<select data-parent="${key}" data-field="roleType">${options}</select></label>
    <label>Nome<input data-parent="${key}" data-field="name" maxlength="40" value="${escapeHTML(data.name)}" placeholder="Nome"></label>
    <div class="form-grid two">
      <label>Sexo<select data-parent="${key}" data-field="gender"><option ${data.gender==="Masculino"?"selected":""}>Masculino</option><option ${data.gender==="Feminino"?"selected":""}>Feminino</option></select></label>
      <label>Idade<input data-parent="${key}" data-field="age" type="number" min="0" max="120" value="${Number(data.age)||0}"></label>
    </div>
  </article>`;
}
function siblingCard(s,index){
  const kin=s.relation==="half"?(s.gender==="Feminino"?"Meia-irmã":"Meio-irmão"):(s.gender==="Feminino"?"Irmã":"Irmão");
  return `<article class="family-card sibling-card" data-sibling-card="${s.id}">
    <div class="family-card-head"><div class="family-icon">🧑‍🤝‍🧑</div><h4>${kin} ${index+1}</h4><button class="remove-sibling" type="button" data-remove-sibling="${s.id}" aria-label="Remover familiar">×</button></div>
    <label>Tipo de relação<select data-sibling="${s.id}" data-field="relation"><option value="full" ${s.relation!=="half"?"selected":""}>Irmão / irmã</option><option value="half" ${s.relation==="half"?"selected":""}>Meio-irmão / meia-irmã</option></select></label>
    <label>Nome<input data-sibling="${s.id}" data-field="name" maxlength="40" value="${escapeHTML(s.name)}" placeholder="Nome"></label>
    <div class="form-grid two">
      <label>Sexo<select data-sibling="${s.id}" data-field="gender"><option ${s.gender==="Masculino"?"selected":""}>Masculino</option><option ${s.gender==="Feminino"?"selected":""}>Feminino</option></select></label>
      <label>Idade<input data-sibling="${s.id}" data-field="age" type="number" min="0" max="120" value="${Number(s.age)||0}"></label>
    </div>
  </article>`;
}
function renderFamilyEditor(targetId,family){
  const target=$(targetId);
  target.innerHTML=`
    <div class="family-grid">
      ${personCard("father","Figura paterna",family.father,"father")}
      ${personCard("mother","Figura materna",family.mother,"mother")}
    </div>
    <div class="siblings-section">
      <div class="siblings-heading">
        <div><h4>Irmãos e irmãs</h4><p>Podes adicionar quantos quiseres.</p></div>
        <button class="add-sibling" type="button" data-add-sibling>＋ Adicionar</button>
      </div>
      <label class="toggle-row"><input type="checkbox" data-siblings-enabled ${family.siblingsEnabled?"checked":""}><span class="toggle-ui"></span><span><b>Ter irmãos na minha história</b><small>Desativa para retirar os irmãos do jogo sem apagar os dados guardados.</small></span></label>
      <div class="siblings-grid ${family.siblingsEnabled?"":"is-disabled"}" data-siblings-list>
        ${family.siblings.map(siblingCard).join("")}
        ${family.siblings.length===0?'<p class="empty-siblings">Ainda não adicionaste irmãos. Usa o botão + para começar.</p>':""}
      </div>
    </div>`;
  target.querySelectorAll("[data-add-sibling]").forEach(btn=>btn.addEventListener("click",()=>{
    const next=readFamilyEditor(targetId,family);
    next.siblings.push({id:makeId(),name:"",gender:"Masculino",age:0,relation:"full",active:true});
    renderFamilyEditor(targetId,next);
  }));
  target.querySelectorAll("[data-remove-sibling]").forEach(btn=>btn.addEventListener("click",()=>{
    const next=readFamilyEditor(targetId,family);
    next.siblings=next.siblings.filter(s=>s.id!==btn.dataset.removeSibling);
    renderFamilyEditor(targetId,next);
  }));
  const toggle=target.querySelector("[data-siblings-enabled]");
  toggle.addEventListener("change",()=>{
    const next=readFamilyEditor(targetId,family);next.siblingsEnabled=toggle.checked;
    renderFamilyEditor(targetId,next);
  });
  target.querySelectorAll("[data-sibling][data-field='gender'],[data-sibling][data-field='relation']").forEach(el=>el.addEventListener("change",()=>{
    const next=readFamilyEditor(targetId,family);renderFamilyEditor(targetId,next);
  }));
}
function readFamilyEditor(targetId,previous){
  const target=$(targetId);
  const result=JSON.parse(JSON.stringify(previous));
  ["father","mother"].forEach(key=>{
    target.querySelectorAll(`[data-parent="${key}"]`).forEach(el=>{
      const field=el.dataset.field;result[key][field]=field==="age"?Number(el.value||0):el.value;
    });
  });
  const enabled=target.querySelector("[data-siblings-enabled]");
  if(enabled) result.siblingsEnabled=enabled.checked;
  const byId=new Map(result.siblings.map(s=>[s.id,s]));
  target.querySelectorAll("[data-sibling][data-field]").forEach(el=>{
    const s=byId.get(el.dataset.sibling);if(!s)return;
    const field=el.dataset.field;s[field]=field==="age"?Number(el.value||0):el.value;
  });
  return result;
}
function collectCreatorFamily(){
  creatorFamily=readFamilyEditor("creatorFamilyEditor",creatorFamily);
  return JSON.parse(JSON.stringify(creatorFamily));
}
function startGame(e){
  e.preventDefault();
  const c=getCountry();
  game={
    player:{
      firstName:$("playerFirst").value.trim(),lastName:$("playerLast").value.trim(),
      gender:$("playerGender").value,age:Number($("playerAge").value),
      appearance:{skin:$("skin").value,hair:$("hair").value,hairstyle:$("hairstyle").value}
    },
    location:{country:c[0],code:c[1],currency:c[2],symbol:c[3],city:$("city").value.trim()},
    family:collectCreatorFamily(),money:0,year:new Date().getFullYear(),createdAt:new Date().toISOString()
  };
  saveGame();renderGame();showScreen("gameScreen");toast("A tua nova vida começou!");
}
function saveGame(){if(game)localStorage.setItem(SAVE_KEY,JSON.stringify(game));}
function loadGame(){
  try{
    let saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
    if(!saved){saved=JSON.parse(localStorage.getItem(OLD_SAVE_KEY)||"null");if(saved){saved.family=normalizeFamily(saved.family);game=saved;saveGame();}}
    if(saved)saved.family=normalizeFamily(saved.family);
    return saved;
  }catch{return null}
}
function formatMoney(amount){
  if(!game)return "—";
  try{return new Intl.NumberFormat("pt-PT",{style:"currency",currency:game.location.currency,maximumFractionDigits:0}).format(amount)}
  catch{return `${game.location.symbol}${Math.round(amount)}`}
}
function renderGame(){
  $("welcomeName").textContent=`Olá, ${game.player.firstName}!`;
  $("welcomeLocation").textContent=`${game.location.city}, ${game.location.country} · ${game.location.currency} (${game.location.symbol})`;
  $("gameAge").textContent=game.player.age;$("gameMoney").textContent=formatMoney(game.money);
  const f=normalizeFamily(game.family);game.family=f;
  const people=[];
  if(f.father.active!==false)people.push({role:f.father.roleType,name:f.father.name,gender:f.father.gender,age:f.father.age});
  if(f.mother.active!==false)people.push({role:f.mother.roleType,name:f.mother.name,gender:f.mother.gender,age:f.mother.age});
  if(f.siblingsEnabled)f.siblings.forEach(s=>people.push({role:s.relation==="half"?(s.gender==="Feminino"?"Meia-irmã":"Meio-irmão"):(s.gender==="Feminino"?"Irmã":"Irmão"),name:s.name,gender:s.gender,age:s.age}));
  $("familySummary").innerHTML=people.length?people.map(p=>`<div class="family-person"><b>${escapeHTML(p.role)}</b><span>${escapeHTML(p.name||"Por definir")}</span><span>${escapeHTML(p.gender)} · ${p.age} anos</span></div>`).join(""):'<p class="empty-siblings">Ainda não há familiares ativos nesta história.</p>';
}
function continueGame(){
  const saved=loadGame();if(!saved){toast("Ainda não existe nenhum jogo guardado.");return}
  game=saved;renderGame();showScreen("gameScreen");
}
function ageUp(){
  game.player.age++;game.year++;
  const f=normalizeFamily(game.family);
  if(f.father.active!==false)f.father.age++;
  if(f.mother.active!==false)f.mother.age++;
  f.siblings.forEach(s=>s.age++);
  game.family=f;saveGame();renderGame();toast(`Avançaste para os ${game.player.age} anos.`);
}
function openFamilyModal(){
  game.family=normalizeFamily(game.family);
  renderFamilyEditor("gameFamilyEditor",JSON.parse(JSON.stringify(game.family)));
  $("familyModal").classList.add("open");$("familyModal").setAttribute("aria-hidden","false");
}
function closeFamilyModal(){
  $("familyModal").classList.remove("open");$("familyModal").setAttribute("aria-hidden","true");
}
function saveFamilyModal(){
  game.family=readFamilyEditor("gameFamilyEditor",game.family);
  saveGame();renderGame();closeFamilyModal();toast("Família atualizada e guardada!");
}
function resetForm(){
  $("creatorForm").reset();$("country").value="PT";updateCurrency();
  creatorFamily=defaultFamily();renderFamilyEditor("creatorFamilyEditor",creatorFamily);
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
$("editFamilyBtn").addEventListener("click",openFamilyModal);
$("closeFamilyModal").addEventListener("click",closeFamilyModal);
$("cancelFamilyEdit").addEventListener("click",closeFamilyModal);
$("saveFamilyEdit").addEventListener("click",saveFamilyModal);
$("familyModal").addEventListener("click",e=>{if(e.target===$("familyModal"))closeFamilyModal();});

fillCountries();
renderFamilyEditor("creatorFamilyEditor",creatorFamily);
if(loadGame()){$("continueBtn").disabled=false;$("saveNote").textContent="Encontrámos um jogo guardado neste dispositivo."}
else{$("continueBtn").disabled=true;$("continueBtn").style.opacity=".55"}
