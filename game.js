/* Tibia Clicker - JavaScript Puro
   Estrutura geral:
   - Estado do jogo (player, mapa, inimigos, inventário)
   - UI binding / eventos
   - Sistema de XP/nível/atributos
   - Combate comum (não revida) + Autohit
   - Boss battle (revida com timer)
   - Loja (upgrades, equipamentos, consumíveis)
   - Inventário / Equipar / Consumir
   - Quests (mate X comuns para liberar boss; boss libera próximo mapa)
   - Idle rewards e geração offline
   - Save/Load localStorage
*/

(() => {
  // ------------------------------
  // Utilidades
  // ------------------------------
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const now = () => Date.now();

// Funções para sistema de stack
function itemsAreEqual(item1, item2) {
  return item1.id === item2.id;
}

function addToInventory(newItem) {
  const existingIndex = P.inventory.findIndex(item => itemsAreEqual(item, newItem));
  
  if (existingIndex !== -1) {
    if (!P.inventory[existingIndex].quantity) P.inventory[existingIndex].quantity = 1;
    P.inventory[existingIndex].quantity++;
  } else {
    newItem.quantity = 1;
    P.inventory.push(newItem);
  }
}

  // ------------------------------
  // Dados principais
  // ------------------------------
  const MAPS = [
    {
      id: 0, name: "Floresta 1-1",
      mobHp: 20, mobGold: [2, 4], mobXp: [2, 4],
      bossHp: 200, bossAtk: 3, bossDmg: [20, 25],
      killsGoal: 25, gearTier: 1
    },
    {
      id: 1, name: "Floresta 1-2",
      mobHp: 60, mobGold: [6, 10], mobXp: [6, 9],
      bossHp: 600, bossAtk: 3, bossDmg: [30, 40],
      killsGoal: 50, gearTier: 2
    },
    {
      id: 2, name: "Floresta 1-3",
      mobHp: 160, mobGold: [14, 22], mobXp: [14, 20],
      bossHp: 1600, bossAtk: 3, bossDmg: [45, 60],
      killsGoal: 75, gearTier: 3
    },
    {
      id: 3, name: "Floresta 1-4",
      mobHp: 400, mobGold: [26, 32], mobXp: [24, 30],
      bossHp: 3200, bossAtk: 3, bossDmg: [75, 100],
      killsGoal: 100, gearTier: 3
    },
    {
      id: 4, name: "Floresta 1-5",
      mobHp: 800, mobGold: [14, 22], mobXp: [14, 20],
      bossHp: 6000, bossAtk: 3, bossDmg: [125, 170],
      killsGoal: 150, gearTier: 3
    },
{
      id: 5, name: "Deserto 1-1",
      mobHp: 1200, mobGold: [24, 28], mobXp: [22, 26],
      bossHp: 9000, bossAtk: 3, bossDmg: [195, 240],
      killsGoal: 200, gearTier: 3
    },
    {
      id: 6, name: "Deserto 1-2",
      mobHp: 1500, mobGold: [30, 40], mobXp: [28, 38],
      bossHp: 12000, bossAtk: 3, bossDmg: [270, 320],
      killsGoal: 300, gearTier: 3
    },
    {
      id: 7, name: "Deserto 1-3",
      mobHp: 2000, mobGold: [36, 48], mobXp: [34, 44],
      bossHp: 16000, bossAtk: 3, bossDmg: [350, 420],
      killsGoal: 400, gearTier: 4
    },
    {
      id: 8, name: "Deserto 1-4",
      mobHp: 2600, mobGold: [42, 56], mobXp: [40, 52],
      bossHp: 22000, bossAtk: 3, bossDmg: [450, 520],
      killsGoal: 500, gearTier: 4
    },
    {
      id: 9, name: "Deserto 1-5",
      mobHp: 3200, mobGold: [50, 64], mobXp: [48, 60],
      bossHp: 28000, bossAtk: 3, bossDmg: [550, 640],
      killsGoal: 600, gearTier: 4
    },
    {
      id: 10, name: "Caverna 1-1",
      mobHp: 4000, mobGold: [58, 72], mobXp: [56, 70],
      bossHp: 35000, bossAtk: 3, bossDmg: [650, 740],
      killsGoal: 700, gearTier: 4
    },
    {
      id: 11, name: "Caverna 1-2",
      mobHp: 5000, mobGold: [66, 84], mobXp: [64, 80],
      bossHp: 42000, bossAtk: 3, bossDmg: [750, 840],
      killsGoal: 800, gearTier: 4
    },
    {
      id: 12, name: "Caverna 1-3",
      mobHp: 6000, mobGold: [74, 96], mobXp: [72, 90],
      bossHp: 50000, bossAtk: 3, bossDmg: [850, 960],
      killsGoal: 900, gearTier: 5
    },
    {
      id: 13, name: "Caverna 1-4",
      mobHp: 7200, mobGold: [82, 108], mobXp: [80, 100],
      bossHp: 60000, bossAtk: 3, bossDmg: [950, 1080],
      killsGoal: 1000, gearTier: 5
    },
    {
      id: 14, name: "Caverna 1-5",
      mobHp: 8500, mobGold: [90, 120], mobXp: [88, 110],
      bossHp: 72000, bossAtk: 3, bossDmg: [1100, 1250],
      killsGoal: 1200, gearTier: 5
    },
    {
      id: 15, name: "Montanha 1-1",
      mobHp: 10000, mobGold: [100, 130], mobXp: [95, 120],
      bossHp: 85000, bossAtk: 3, bossDmg: [1200, 1400],
      killsGoal: 1300, gearTier: 5
    },
    {
      id: 16, name: "Montanha 1-2",
      mobHp: 12000, mobGold: [110, 145], mobXp: [110, 135],
      bossHp: 100000, bossAtk: 3, bossDmg: [1350, 1550],
      killsGoal: 1400, gearTier: 5
    },
    {
      id: 17, name: "Montanha 1-3",
      mobHp: 14000, mobGold: [125, 160], mobXp: [125, 150],
      bossHp: 120000, bossAtk: 3, bossDmg: [1500, 1700],
      killsGoal: 1500, gearTier: 6
    },
    {
      id: 18, name: "Montanha 1-4",
      mobHp: 16000, mobGold: [135, 175], mobXp: [135, 165],
      bossHp: 140000, bossAtk: 3, bossDmg: [1700, 1900],
      killsGoal: 1600, gearTier: 6
    },
    {
      id: 19, name: "Montanha 1-5",
      mobHp: 18000, mobGold: [150, 190], mobXp: [150, 180],
      bossHp: 160000, bossAtk: 3, bossDmg: [1900, 2100],
      killsGoal: 1700, gearTier: 6
    },
    {
      id: 20, name: "Vulcão 1-1",
      mobHp: 20000, mobGold: [165, 210], mobXp: [165, 195],
      bossHp: 185000, bossAtk: 3, bossDmg: [2100, 2350],
      killsGoal: 1800, gearTier: 6
    },
    {
      id: 21, name: "Vulcão 1-2",
      mobHp: 23000, mobGold: [180, 230], mobXp: [180, 210],
      bossHp: 210000, bossAtk: 3, bossDmg: [2350, 2600],
      killsGoal: 1900, gearTier: 6
    },
    {
      id: 22, name: "Vulcão 1-3",
      mobHp: 26000, mobGold: [195, 250], mobXp: [195, 230],
      bossHp: 240000, bossAtk: 3, bossDmg: [2600, 2850],
      killsGoal: 2000, gearTier: 7
    },
    {
      id: 23, name: "Vulcão 1-4",
      mobHp: 29000, mobGold: [210, 270], mobXp: [210, 250],
      bossHp: 270000, bossAtk: 3, bossDmg: [2850, 3100],
      killsGoal: 2100, gearTier: 7
    },
    {
      id: 24, name: "Vulcão 1-5",
      mobHp: 32000, mobGold: [225, 290], mobXp: [225, 270],
      bossHp: 300000, bossAtk: 3, bossDmg: [3100, 3400],
      killsGoal: 2200, gearTier: 7
    },
    {
      id: 25, name: "Pântano 1-1",
      mobHp: 35000, mobGold: [240, 310], mobXp: [240, 290],
      bossHp: 340000, bossAtk: 3, bossDmg: [3400, 3700],
      killsGoal: 2300, gearTier: 7
    },
    {
      id: 26, name: "Pântano 1-2",
      mobHp: 38000, mobGold: [255, 330], mobXp: [255, 310],
      bossHp: 380000, bossAtk: 3, bossDmg: [3700, 4000],
      killsGoal: 2400, gearTier: 7
    },
    {
      id: 27, name: "Pântano 1-3",
      mobHp: 42000, mobGold: [270, 350], mobXp: [270, 330],
      bossHp: 420000, bossAtk: 3, bossDmg: [4000, 4300],
      killsGoal: 2500, gearTier: 8
    },
    {
      id: 28, name: "Pântano 1-4",
      mobHp: 46000, mobGold: [285, 370], mobXp: [285, 350],
      bossHp: 460000, bossAtk: 3, bossDmg: [4300, 4600],
      killsGoal: 2600, gearTier: 8
    },
    {
      id: 29, name: "Pântano 1-5",
      mobHp: 50000, mobGold: [300, 390], mobXp: [300, 370],
      bossHp: 500000, bossAtk: 3, bossDmg: [4600, 4900],
      killsGoal: 2700, gearTier: 8
    },
    {
      id: 30, name: "Ruínas 1-1",
      mobHp: 55000, mobGold: [320, 420], mobXp: [320, 400],
      bossHp: 560000, bossAtk: 3, bossDmg: [4900, 5200],
      killsGoal: 2800, gearTier: 8
    },
    {
      id: 31, name: "Ruínas 1-2",
      mobHp: 60000, mobGold: [340, 450], mobXp: [340, 430],
      bossHp: 620000, bossAtk: 3, bossDmg: [5200, 5600],
      killsGoal: 2900, gearTier: 8
    },
    {
      id: 32, name: "Ruínas 1-3",
      mobHp: 66000, mobGold: [360, 480], mobXp: [360, 460],
      bossHp: 680000, bossAtk: 3, bossDmg: [5600, 6000],
      killsGoal: 3000, gearTier: 9
    },
    {
      id: 33, name: "Ruínas 1-4",
      mobHp: 72000, mobGold: [380, 510], mobXp: [380, 490],
      bossHp: 740000, bossAtk: 3, bossDmg: [6000, 6400],
      killsGoal: 3100, gearTier: 9
    },
    {
      id: 34, name: "Ruínas 1-5",
      mobHp: 80000, mobGold: [400, 540], mobXp: [400, 520],
      bossHp: 820000, bossAtk: 3, bossDmg: [6400, 6800],
      killsGoal: 3200, gearTier: 9
    },


  ];

  const START = {
    name: "Aventureiro",
    level: 1, xp: 0, xpToNext: 50, totalXp: 0,
    gold: 0,
    attrPoints: 0,
    attrs: {
    str: 1, agi: 1, def: 1, mana: 0,
    crit: 5, critdmg: 1.5, maxHp: 100, maxMana: 10 // NOVO
  },
  currentMana: 10,
    },
    skills: { sword: 1, archery: 1, magic: 1, shield: 1 },
    hp: 100,
    mapIndex: 0,
    kills: 0,
    lastActive: now(),
    offlineEnabled: true,
    upgrades: {
      damageLvl: 0,      // + dano base
      autoHitLvl: 0,     // ativa e melhora autohit
      atkSpeedLvl: 0,    // reduz intervalo do autohit
      maxHpLvl: 0        // aumenta vida máxima
    },
    equipped: { weapon: null, armor: null, ring: null },
    inventory: [],
    consumables: [],
spells: [], // magias compradas

function buySpell(id) {
  const s = SHOP.spells.find(x => x.id === id);
  if (!s || !spendGold(s.price)) { log("Gold insuficiente."); return; }
  
  P.spells.push(JSON.parse(JSON.stringify(s)));
  log(`Aprendeu a magia ${s.name}.`);
  renderShop(); syncAll();
}
  };

  const GEAR_POOL = [
    // tier 1
    { id:"w-wood-sword",  name:"Espada de Madeira", slot:"weapon", tier:1, mods:{str:+2} },
    { id:"a-leather",     name:"Armadura de Couro", slot:"armor",  tier:1, mods:{def:+2, maxHp:+10} },
    { id:"r-copper",      name:"Anel de Cobre",     slot:"ring",   tier:1, mods:{crit:+2} },
    // tier 2
    { id:"w-iron-sword",  name:"Espada de Ferro",   slot:"weapon", tier:2, mods:{str:+5, crit:+2} },
    { id:"a-chain",       name:"Cota de Malha",     slot:"armor",  tier:2, mods:{def:+5, maxHp:+30} },
    { id:"r-silver",      name:"Anel de Prata",     slot:"ring",   tier:2, mods:{crit:+4, critdmg:+0.2} },
    // tier 3
    { id:"w-flame-staff", name:"Cajado Flamejante", slot:"weapon", tier:3, mods:{str:+8, crit:+5, critdmg:+0.3} },
    { id:"a-plate",       name:"Armadura de Placas",slot:"armor",  tier:3, mods:{def:+9, maxHp:+60} },
    { id:"r-gold",        name:"Anel de Ouro",      slot:"ring",   tier:3, mods:{crit:+6, critdmg:+0.4} },

    // tier 4
    { id:"w-crystal-blade", name:"Lâmina de Cristal", slot:"weapon", tier:4, mods:{str:+12, crit:+6} },
    { id:"a-crystal",       name:"Armadura de Cristal", slot:"armor", tier:4, mods:{def:+12, maxHp:+100} },
    { id:"r-emerald",       name:"Anel de Esmeralda", slot:"ring", tier:4, mods:{crit:+8, critdmg:+0.5} },

    // tier 5
    { id:"w-dragon-slayer", name:"Matadora de Dragões", slot:"weapon", tier:5, mods:{str:+18, crit:+8, critdmg:+0.4} },
    { id:"a-dragon",        name:"Armadura Dracônica", slot:"armor", tier:5, mods:{def:+16, maxHp:+150} },
    { id:"r-ruby",          name:"Anel de Rubi", slot:"ring", tier:5, mods:{crit:+10, critdmg:+0.6} },

    // tier 6
    { id:"w-shadow-blade", name:"Lâmina Sombria", slot:"weapon", tier:6, mods:{str:+24, crit:+10, critdmg:+0.5} },
    { id:"a-shadow",       name:"Armadura Sombria", slot:"armor", tier:6, mods:{def:+20, maxHp:+220} },
    { id:"r-sapphire",     name:"Anel de Safira", slot:"ring", tier:6, mods:{crit:+12, critdmg:+0.7} },

    // tier 7
    { id:"w-volcano-hammer", name:"Martelo Vulcânico", slot:"weapon", tier:7, mods:{str:+30, crit:+12} },
    { id:"a-volcano",        name:"Armadura Vulcânica", slot:"armor", tier:7, mods:{def:+24, maxHp:+300} },
    { id:"r-diamond",        name:"Anel de Diamante", slot:"ring", tier:7, mods:{crit:+14, critdmg:+0.8} },

    // tier 8
    { id:"w-swamp-spear", name:"Lança do Pântano", slot:"weapon", tier:8, mods:{str:+36, crit:+14, critdmg:+0.6} },
    { id:"a-swamp",       name:"Armadura do Pântano", slot:"armor", tier:8, mods:{def:+28, maxHp:+400} },
    { id:"r-onyx",        name:"Anel de Ônix", slot:"ring", tier:8, mods:{crit:+16, critdmg:+1.0} },

    // tier 9
    { id:"w-ruin-staff", name:"Cajado das Ruínas", slot:"weapon", tier:9, mods:{str:+45, crit:+18, critdmg:+0.8} },
    { id:"a-ruin",       name:"Armadura das Ruínas", slot:"armor", tier:9, mods:{def:+34, maxHp:+550} },
    { id:"r-amethyst",   name:"Anel de Ametista", slot:"ring", tier:9, mods:{crit:+18, critdmg:+1.2} },
];


  const SHOP = {
    upgrades: [
      { id:"upg-dmg", name:"+ Dano Base", desc:"+2 dano por nível", baseCost: 1, growth: 1.15, apply: p => p.upgrades.damageLvl++ },
      { id:"upg-auto", name:"Autohit", desc:"Ataques automáticos progressivos", baseCost: 1, growth: 1.6, apply: p => p.upgrades.autoHitLvl++ },
      { id:"upg-speed", name:"Vel. de Ataque", desc:"Autohit mais rápido", baseCost: 80, growth: 1.6, apply: p => p.upgrades.atkSpeedLvl++ },
      { id:"upg-hp", name:"+ Vida Máx.", desc:"+15 vida por nível", baseCost: 50, growth: 1.15, apply: p => p.upgrades.maxHpLvl++ },
      { id:"upg-maxmana", name:"+ Mana Máx.", desc:"+10 mana por nível", baseCost: 40, growth: 1.4, apply: p => p.upgrades.maxManaLvl++ },
    ],
    gear: [
      // preços escalam por tier
      { ref:"w-wood-sword", price: 30 }, { ref:"a-leather", price: 28 }, { ref:"r-copper", price: 26 },
      { ref:"w-iron-sword", price: 100 },{ ref:"a-chain", price: 95 },{ ref:"r-silver", price: 90 },
      { ref:"w-flame-staff", price: 300 },{ ref:"a-plate", price: 280 },{ ref:"r-gold", price: 260 },
    ],
    consumables: [
      { id:"pot-small", name:"Poção Pequena", heal: 60, price: 18 },
      { id:"pot-mid",   name:"Poção Média",   heal:120, price: 40 },
      { id:"pot-big",   name:"Poção Grande",  heal:240, price: 80 },
    ]
    spells: [
    { id:"spell-fireball", name:"Bola de Fogo", desc:"Causa 50-80 de dano", manaCost: 15, price: 100 },
    { id:"spell-heal", name:"Cura Menor", desc:"Regenera 40-60 HP", manaCost: 12, price: 80 },
    { id:"spell-rage", name:"Fúria", desc:"30s de +50% dano", manaCost: 25, price: 200 },
  ]
  };

const spellBox = $('#shopSpells'); spellBox.innerHTML='';
SHOP.spells.forEach(s=>{
  const canAfford = P.gold >= s.price;
  const el = document.createElement('div'); el.className='shop-item';
  el.innerHTML = `
    <div class="name">${s.name}</div>
    <div class="meta">${s.desc}</div>
    <div class="meta">Custo de Mana: ${s.manaCost}</div>
    <div class="meta" style="color: ${canAfford ? 'var(--accent)' : 'var(--danger)'}">Preço: ${s.price} gold</div>
    <button data-buy-spell="${s.id}" ${!canAfford ? 'disabled' : ''}>Comprar</button>
  `;
  spellBox.appendChild(el);
});

  // ------------------------------
  // Estado e carregamento
  // ------------------------------
  let P = null;            // Player state
  let mob = null;          // inimigo comum atual
  let boss = null;         // boss atual
  let bossTimer = null;    // interval
  let autoHitTimer = null; // interval
  let saveInterval = null; // interval

  function newPlayerState(){
    return JSON.parse(JSON.stringify(START));
  }

  function save(){
    if (!$('#localSaveToggle').checked) return;
    P.lastActive = now();
    localStorage.setItem('tibia_clicker_save', JSON.stringify(P));
    logOnce("Jogo salvo.");
  }

  function load(){
    const raw = localStorage.getItem('tibia_clicker_save');
    if (!raw){
      P = newPlayerState();
    }else{
      try{
        P = JSON.parse(raw);
      }catch{
        P = newPlayerState();
      }
    }
    // sane defaults (para versões antigas)
    P.offlineEnabled = P.offlineEnabled ?? true;
    P.upgrades = Object.assign({damageLvl:0,autoHitLvl:0,atkSpeedLvl:0,maxHpLvl:0}, P.upgrades||{});
    P.equipped = Object.assign({weapon:null,armor:null,ring:null}, P.equipped||{});
    P.inventory ||= [];
    P.consumables ||= [];
  }

  function resetAll(){
  // Para todos os timers ativos
  stopAutoHit();
  stopBossTimer();
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  
  // Remove dados salvos e reseta estado
  localStorage.removeItem('tibia_clicker_save');
  P = newPlayerState();
  
  // Reseta variáveis de combate
  mob = null; 
  boss = null;
  
  // Fecha todos os modais que possam estar abertos
  ['inventoryModal','shopModal','questsModal','bossModal'].forEach(hideModal);
  
  // Reaplica configurações
  applyName();
  setupMob();
  syncAll();
  
  // Reinicia timers necessários
  startAutoHit(); // vai verificar se P.upgrades.autoHitLvl > 0
  
  // Reinicia save interval
  saveInterval = setInterval(() => save(), 15000);
  
  log("Progresso resetado.");
}

  // ------------------------------
  // UI helpers
  // ------------------------------
  function log(msg){
    const box = $('#logBox');
    const div = document.createElement('div');
    div.className = 'logline';
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    box.prepend(div);
  }
  let __lastLog = 0;
  function logOnce(msg){
    const t = now();
    if (t - __lastLog > 2500){
      __lastLog = t;
      log(msg);
    }
  }

  function showModal(id){
    $('#modalOverlay').classList.remove('hidden');
    $('#'+id).classList.remove('hidden');
  }
  function hideModal(id){
    $('#'+id).classList.add('hidden');
    if ([...$$('.modal')].every(m => m.classList.contains('hidden'))){
      $('#modalOverlay').classList.add('hidden');
    }
  }

  // ------------------------------
  // Progressão / Fórmulas
  // ------------------------------
  function xpForLevel(lv){
    return Math.floor(50 * Math.pow(lv, 1.5)); // curva suave e ilimitada
  }

  function applyName(){
    const input = $('#playerNameInput');
    input.value = P.name || "";
    input.addEventListener('change', () => {
      P.name = input.value.trim() || "Aventureiro";
      log(`Nome atualizado para ${P.name}.`);
      save();
    });
  }

  function recomputeMaxHp(){
  const base = 100 + (P.level - 1) * 10; // +10 HP por nível
  const attrHp = (P.attrs.vit || 0) * 5; // cada ponto gasto em "vida" = +5 HP
const upgradeHp = P.upgrades.maxHpLvl * 15; // upgrade da loja
let gearHp = 0;
['weapon','armor','ring'].forEach(slot=>{
  const g = getEquipped(slot);
  if (g && g.mods?.maxHp) gearHp += g.mods.maxHp;
});

const newMax = base + attrHp + upgradeHp + gearHp;

  
  // Guarda a porcentagem atual de vida antes de mudar o máximo
  const wasMax = P.hp >= P.attrs.maxHp;
  const hpPercentage = P.hp / P.attrs.maxHp;
  
  P.attrs.maxHp = newMax;
  
  // Mantém a mesma porcentagem de vida ao mudar o máximo, exceto se estava cheio
  if (wasMax) {
    P.hp = newMax;
  } else {
    P.hp = Math.max(1, Math.floor(newMax * hpPercentage));
  }
}

  function baseDamage(){
  let gearStr = 0, gearCrit = 0, gearCritD = 0;
  ['weapon','armor','ring'].forEach(s=>{
    const g = getEquipped(s);
    if (!g || !g.mods) return;
    if (g.mods.str) gearStr += g.mods.str;
    if (g.mods.crit) gearCrit += g.mods.crit;
    if (g.mods.critdmg) gearCritD += g.mods.critdmg;
  });
  
  const dmgFromLevel = Math.floor(P.level * 2);
  const dmgFromUpgrade = P.upgrades.damageLvl * 2;
  const dmgFromStr = Math.floor((P.attrs.str + gearStr) * 1.5);
  
  // NOVO: Bônus das skills
  const skillBonus = Math.floor(P.skills.sword * 0.8) + Math.floor(P.skills.archery * 0.6) + Math.floor(P.skills.magic * 0.7);
  
  const base = 3 + dmgFromLevel + dmgFromUpgrade + dmgFromStr + skillBonus;
  
  // Crítico agora considera skill de archery
  const skillCrit = P.skills.archery * 0.3;
  const critChance = clamp(P.attrs.crit + gearCrit + (P.attrs.agi*0.2) + skillCrit, 0, 100);
  const critMult = P.attrs.critdmg + gearCritD + (P.skills.archery * 0.02);
  
  const isCrit = Math.random() < (critChance/100);
  return { amount: Math.floor(base * (isCrit? critMult: 1)), isCrit };
}

  function gainXp(n){
    P.xp += n; P.totalXp += n;
    while (P.xp >= P.xpToNext){
      P.xp -= P.xpToNext;
      P.level++;
      P.attrPoints += 5;
      P.skills.sword++; P.skills.archery++; P.skills.magic++; P.skills.shield++;
      P.xpToNext = xpForLevel(P.level);
      log(`Subiu para o nível ${P.level}. Ganhou 5 pontos de atributos.`);
      recomputeMaxHp();
    }
  }

  function gainGold(n){
    P.gold += n;
  }

  function spendGold(n){
    if (P.gold < n) return false;
    P.gold -= n; return true;
  }

  // ------------------------------
  // Inimigos comuns
  // ------------------------------
  function setupMob(){
    const map = MAPS[P.mapIndex];
    mob = { hp: map.mobHp, maxHp: map.mobHp };
    updateMobUI();
  }

  function updateMobUI(){
    $('#uiMobHp').textContent = mob.hp;
    $('#uiMobMaxHp').textContent = mob.maxHp;
    const pct = clamp((mob.hp/mob.maxHp)*100,0,100);
    $('#mobBar').style.width = pct + '%';
  }

  function hitMob(){
    if (!mob) return;
    const d = baseDamage();
    mob.hp = clamp(mob.hp - d.amount, 0, mob.maxHp);
    updateMobUI();
    log(`Você causou ${d.amount} de dano ao inimigo comum${d.isCrit?' (crítico)':''}.`);
    if (mob.hp <= 0){
      const map = MAPS[P.mapIndex];
      const gold = randi(map.mobGold[0], map.mobGold[1]);
      const xp = randi(map.mobXp[0], map.mobXp[1]);
      gainGold(gold); gainXp(xp);
      P.kills++;
      const drop = rollDrop(map.gearTier);
      if (drop) { addToInventory(drop); log(`Dropou: ${drop.name}.`); }
      log(`Derrotou inimigo comum. +${gold} gold, +${xp} XP.`);
      setupMob();
      syncAll();
    }
  }

  function rollDrop(tier){
    // chance simples de 6% por kill + bônus por mapa
    const chance = 0.06 + (tier-1)*0.02;
    if (Math.random() > chance) return null;
    // escolhe item compatível com tier
    const pool = GEAR_POOL.filter(g => g.tier === tier);
    if (!pool.length) return null;
    const base = JSON.parse(JSON.stringify(pool[randi(0, pool.length-1)]));
    base.uid = 'it-' + Math.random().toString(36).slice(2);
    return base;
  }

  // ------------------------------
  // Boss Battle
  // ------------------------------
  function openBoss(){
    const map = MAPS[P.mapIndex];
    if (P.kills < map.killsGoal){
      log(`Você precisa derrotar ${map.killsGoal} inimigos comuns antes do boss.`);
      return;
    }
    // cria instância do boss
    boss = {
      hp: map.bossHp, maxHp: map.bossHp,
      atkEvery: Math.max(400, 1400 - P.level*10 - P.upgrades.atkSpeedLvl*50), // apenas para a barra visual
      baseAtkSec: map.bossAtk, // segundos base
      dmg: map.bossDmg,
      nextHitAt: now() + map.bossAtk*1000
    };
    P.hp = P.attrs.maxHp; // cura ao iniciar a luta
    syncBossUI();
    showModal('bossModal');
    startBossTimer();
  }

  function syncBossUI(){
    $('#uiPlayerHp').textContent = P.hp;
    $('#uiPlayerMaxHp').textContent = P.attrs.maxHp;
    $('#uiBossHp').textContent = boss.hp;
    $('#uiBossMaxHp').textContent = boss.maxHp;
    $('#playerHpBar').style.width = clamp((P.hp/P.attrs.maxHp)*100,0,100)+'%';
    $('#bossHpBar').style.width   = clamp((boss.hp/boss.maxHp)*100,0,100)+'%';

    // barra de ataque do boss
    const total = boss.baseAtkSec*1000;
    const remain = clamp(boss.nextHitAt - now(), 0, total);
    const pct = 100 - Math.floor((remain/total)*100);
    $('#bossAtkTimer').style.width = pct + '%';
  }

  function startBossTimer(){
    stopBossTimer();
    bossTimer = setInterval(()=>{
      const t = now();
      if (t >= boss.nextHitAt){
        // Dentro do startBossTimer(), na parte onde o boss ataca:
const dmg = randi(boss.dmg[0], boss.dmg[1]) - Math.floor(P.attrs.def*0.6) - Math.floor(P.skills.shield*0.4);
        const final = clamp(dmg, 1, 9999);
        P.hp = clamp(P.hp - final, 0, P.attrs.maxHp);
        log(`O Boss atingiu você por ${final} de dano.`);
        boss.nextHitAt = t + MAPS[P.mapIndex].bossAtk*1000;
        if (P.hp <= 0){
          onPlayerDeath();
          return;
        }
      }
      syncBossUI();
    }, 100);
  }

  function stopBossTimer(){
    if (bossTimer){ clearInterval(bossTimer); bossTimer = null; }
  }

  function attackBoss(){
    if (!boss) return;
    const d = baseDamage();
    boss.hp = clamp(boss.hp - d.amount, 0, boss.maxHp);
    log(`Você causou ${d.amount} de dano ao Boss${d.isCrit?' (crítico)':''}.`);
    if (boss.hp <= 0){
      onBossDefeated();
      return;
    }
    syncBossUI();
  }

  function usePotion(){
    // usa a maior poção disponível
    if (!P.consumables.length){ log("Você não tem poções."); return; }
    // encontrar a de maior heal
    let idx = -1, best = 0;
    for (let i=0;i<P.consumables.length;i++){
      const c = P.consumables[i];
      if (!c.heal) continue;
      if (c.heal > best){ best = c.heal; idx = i; }
    }
    if (idx === -1){ log("Nenhuma poção disponível."); return; }
    const pot = P.consumables.splice(idx,1)[0];
    P.hp = clamp(P.hp + pot.heal, 1, P.attrs.maxHp);
    log(`Usou ${pot.name} e recuperou ${pot.heal} de vida.`);
    syncBossUI();
  }

  function onBossDefeated(){
    stopBossTimer();
    hideModal('bossModal');
    const map = MAPS[P.mapIndex];
    const gold = Math.floor(map.bossHp * 0.25);
    const xp = Math.floor(map.bossHp * 0.25);
    gainGold(gold); gainXp(xp);
    log(`Boss derrotado. +${gold} gold, +${xp} XP.`);
    // libera próximo mapa
    if (P.mapIndex < MAPS.length-1){
      P.mapIndex++;
      P.kills = 0;
      log(`Novo mapa desbloqueado: ${MAPS[P.mapIndex].name}.`);
    }else{
      // fim do ciclo: aumenta dificuldade e recomeça meta
      // pequena escalada global
      MAPS.forEach(m=>{
        m.mobHp = Math.floor(m.mobHp * 1.15);
        m.bossHp = Math.floor(m.bossHp * 1.2);
        m.mobGold = [Math.floor(m.mobGold[0]*1.12), Math.floor(m.mobGold[1]*1.12)];
        m.mobXp   = [Math.floor(m.mobXp[0]*1.12), Math.floor(m.mobXp[1]*1.12)];
      });
      P.mapIndex = 0; P.kills = 0;
      log("Ciclo concluído. Inimigos ficaram mais fortes.");
    }
    setupMob();
    syncAll();
  }

  function onPlayerDeath(){
    stopBossTimer();
    hideModal('bossModal');
    // penalidade
    const loseGold = Math.floor(P.gold * 0.05);
    const loseXp = Math.floor(P.totalXp * 0.05);
    P.gold = Math.max(0, P.gold - loseGold);
    // remove do total e recalcula nível/XP atual
    P.totalXp = Math.max(0, P.totalXp - loseXp);
    // recalcular nível a partir de totalXp
    let lv=1, remain = P.totalXp;
    while (remain >= xpForLevel(lv)){
      remain -= xpForLevel(lv);
      lv++;
    }
    P.level = lv;
    P.xp = remain;
    P.xpToNext = xpForLevel(P.level);
    P.attrPoints = Math.max(0, P.attrPoints - 0); // não remove pontos já gastos
    P.hp = P.attrs.maxHp;
    log(`Você morreu. Perdeu ${loseGold} gold e ${loseXp} XP totais.`);
    syncAll();
  }

  // ------------------------------
  // Autohit
  // ------------------------------
  function startAutoHit(){
  stopAutoHit();
  if (P.upgrades.autoHitLvl <= 0) return; // Para aqui se não tem upgrade
  
  const baseMs = 1200;
  const speedBonus = P.upgrades.atkSpeedLvl * 60;
  const interval = Math.max(240, baseMs - speedBonus - (P.level*4));
  
  autoHitTimer = setInterval(() => {
    hitMob();
  }, interval);
}

  function stopAutoHit(){
  if (autoHitTimer){ 
    clearInterval(autoHitTimer); 
    autoHitTimer = null; 
  }
}

  // ------------------------------
  // Loja
  // ------------------------------
  function renderShop(){
  // Atualiza o display de gold
  $('#shopGoldDisplay').textContent = P.gold;
  
  const upgBox = $('#shopUpgrades'); upgBox.innerHTML = '';
  SHOP.upgrades.forEach((u,i)=>{
    const lvl = P.upgrades[(u.id==='upg-dmg')?'damageLvl':(u.id==='upg-auto')?'autoHitLvl':(u.id==='upg-speed')?'atkSpeedLvl':'maxHpLvl'];
    const cost = Math.floor(u.baseCost * Math.pow(u.growth, lvl));
    const canAfford = P.gold >= cost;
    const el = document.createElement('div'); el.className='shop-item';
    el.innerHTML = `
      <div class="name">${u.name} (Nível ${lvl})</div>
      <div class="meta">${u.desc}</div>
      <div class="meta" style="color: ${canAfford ? 'var(--accent)' : 'var(--danger)'}">Custo: ${cost} gold</div>
      <button data-buy-upg="${u.id}" ${!canAfford ? 'disabled' : ''}>Comprar</button>
    `;
    upgBox.appendChild(el);
  });

  const gearBox = $('#shopGear'); gearBox.innerHTML = '';
  SHOP.gear.forEach(g=>{
    const data = GEAR_POOL.find(x=>x.id===g.ref);
    const canAfford = P.gold >= g.price;
    const el = document.createElement('div'); el.className='shop-item';
    el.innerHTML = `
      <div class="name">${data.name}</div>
      <div class="meta">Slot: ${data.slot}</div>
      <div class="meta">Bônus: ${modsToText(data.mods)}</div>
      <div class="meta" style="color: ${canAfford ? 'var(--accent)' : 'var(--danger)'}">Preço: ${g.price} gold</div>
      <button data-buy-gear="${data.id}" ${!canAfford ? 'disabled' : ''}>Comprar</button>
    `;
    gearBox.appendChild(el);
  });

  const cBox = $('#shopConsumables'); cBox.innerHTML='';
  SHOP.consumables.forEach(c=>{
    const canAfford = P.gold >= c.price;
    const el = document.createElement('div'); el.className='shop-item';
    el.innerHTML = `
      <div class="name">${c.name}</div>
      <div class="meta">Cura: ${c.heal}</div>
      <div class="meta" style="color: ${canAfford ? 'var(--accent)' : 'var(--danger)'}">Preço: ${c.price} gold</div>
      <button data-buy-cons="${c.id}" ${!canAfford ? 'disabled' : ''}>Comprar</button>
    `;
    cBox.appendChild(el);
  });
}

  function modsToText(mods){
    return Object.entries(mods).map(([k,v])=>{
      const label = {str:"Força",agi:"Agilidade",def:"Defesa",mana:"Mana",crit:"Crítico",critdmg:"Dano Crítico",maxHp:"Vida"}[k]||k;
      const val = (k==='critdmg')? `+${v.toFixed(1)}x` : `+${v}`;
      return `${label} ${val}`;
    }).join(', ');
  }

  function buyUpgrade(id){
  const u = SHOP.upgrades.find(x=>x.id===id);
  if (!u) return;
  const key = (id==='upg-dmg')?'damageLvl':(id==='upg-auto')?'autoHitLvl':(id==='upg-speed')?'atkSpeedLvl':'maxHpLvl';
  const lvl = P.upgrades[key];
  const cost = Math.floor(u.baseCost * Math.pow(u.growth, lvl));
  if (!spendGold(cost)){ log("Gold insuficiente."); return; }
  
  // Guarda se estava com vida cheia antes do upgrade
  const wasFullHp = P.hp >= P.attrs.maxHp;
  
  u.apply(P);
  
  if (id==='upg-hp'){
    recomputeMaxHp();
    // Se comprou upgrade de vida e estava com vida cheia, cura completamente
    if (wasFullHp) {
      P.hp = P.attrs.maxHp;
    }
  }
  
  if (id==='upg-auto' || id==='upg-speed'){ startAutoHit(); }
  renderShop(); syncAll();
  log(`Comprou ${u.name}.`);
  renderShop(); syncAll();
$('#shopGoldDisplay').textContent = P.gold; // Atualiza imediatamente o gold na loja
}
  function buyGear(id){
    const g = SHOP.gear.find(x=>x.ref===id);
    const data = GEAR_POOL.find(x=>x.id===id);
    if (!g || !data) return;
    if (!spendGold(g.price)){ log("Gold insuficiente."); return; }
    const it = JSON.parse(JSON.stringify(data));
    it.uid = 'it-' + Math.random().toString(36).slice(2);
    addToInventory(it);
    log(`Comprou ${data.name}.`);
    renderInventory(); syncAll();
    renderShop(); syncAll();
$('#shopGoldDisplay').textContent = P.gold; // Atualiza imediatamente o gold na loja
  }

  function buyConsumable(id){
    const c = SHOP.consumables.find(x=>x.id===id);
    if (!c) return;
    if (!spendGold(c.price)){ log("Gold insuficiente."); return; }
    P.consumables.push(JSON.parse(JSON.stringify(c)));
    log(`Comprou ${c.name}.`);
    renderInventory(); syncAll();
    renderShop(); syncAll();
$('#shopGoldDisplay').textContent = P.gold; // Atualiza imediatamente o gold na loja
  }

  // ------------------------------
  // Inventário
  // ------------------------------
  function renderInventory(){
  // equipados
  $('#eqWeapon').textContent = P.equipped.weapon?.name || 'Nenhuma';
  $('#eqArmor').textContent  = P.equipped.armor?.name  || 'Nenhuma';
  $('#eqRing').textContent   = P.equipped.ring?.name   || 'Nenhum';
  
  // itens
  const list = $('#inventoryList'); list.innerHTML='';
  P.inventory.forEach(it => {
    const quantity = it.quantity || 1;
    const quantityText = quantity > 1 ? ` (x${quantity})` : '';
    
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `
      <div class="name">${it.name}${quantityText}</div>
      <div class="meta">Slot: ${it.slot}</div>
      <div class="meta">Bônus: ${modsToText(it.mods)}</div>
      <button data-equip="${it.uid}">Equipar</button>
      <button data-sell="${it.uid}" class="secondary">Vender (+${sellValue(it)} gold)</button>
    `;
    list.appendChild(el);
  });
  
  // consumíveis (mantém como estava)
  const clist = $('#consumablesList'); clist.innerHTML='';
  P.consumables.forEach((c,idx) => {
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `
      <div class="name">${c.name}</div>
      <div class="meta">Cura: ${c.heal}</div>
      <button data-consume="${idx}">Usar</button>
    `;
    clist.appendChild(el);
  });
}

  function sellValue(it){
    const tierMul = (it.tier||1);
    return 10 * tierMul + (it.mods?.str||0) + (it.mods?.def||0) + (it.mods?.mana||0) + (it.mods?.crit||0)*2 + Math.floor((it.mods?.maxHp||0)/10);
  }

  function equipItem(uid){
  const idx = P.inventory.findIndex(x => x.uid === uid);
  if (idx === -1) return;
  const it = P.inventory[idx];
  
  // devolve item antigo para inventário
  if (P.equipped[it.slot]) {
    addToInventory(P.equipped[it.slot]);
  }
  
  // cria uma cópia do item para equipar
  const itemToEquip = JSON.parse(JSON.stringify(it));
  itemToEquip.quantity = 1;
  itemToEquip.uid = 'eq-' + Math.random().toString(36).slice(2);
  
  // equipa
  P.equipped[it.slot] = itemToEquip;
  
  // reduz quantidade ou remove do inventário
  if (it.quantity > 1) {
    it.quantity--;
  } else {
    P.inventory.splice(idx, 1);
  }
  
  recomputeMaxHp();
  renderInventory(); syncAll();
  log(`Equipou ${it.name}.`);
}

  function sellItem(uid){
  const idx = P.inventory.findIndex(x => x.uid === uid);
  if (idx === -1) return;
  const it = P.inventory[idx];
  
  // vende apenas 1 unidade
  gainGold(sellValue(it));
  
  if (it.quantity > 1) {
    it.quantity--;
  } else {
    P.inventory.splice(idx, 1);
  }
  
  renderInventory(); syncAll();
  log(`Vendeu ${it.name}.`);
}

  function consumeIndex(idx){
    if (idx<0 || idx>=P.consumables.length) return;
    const c = P.consumables.splice(idx,1)[0];
    // fora de boss: converte em cura reservada (cura imediata até o máx)
    P.hp = clamp(P.hp + c.heal, 1, P.attrs.maxHp);
    renderInventory(); syncAll();
    log(`Consumiu ${c.name} e recuperou ${c.heal} de vida.`);
  }

  function getEquipped(slot){
    return P.equipped[slot];
  }

  // ------------------------------
  // Quests
  // ------------------------------
  function renderQuests(){
    const map = MAPS[P.mapIndex];
    const box = $('#questsList'); box.innerHTML='';
    const el = document.createElement('div'); el.className='item';
    const remain = Math.max(0, map.killsGoal - P.kills);
    el.innerHTML = `
      <div class="name">Missão: Preparar Boss</div>
      <div class="meta">Objetivo: Derrote ${map.killsGoal} inimigos comuns neste mapa.</div>
      <div class="meta">Progresso: ${P.kills}/${map.killsGoal} (${remain===0?'Pronto para o Boss':'Faltam '+remain})</div>
      <div class="meta">Recompensa: Libera o Boss e (após vitória) próximo mapa.</div>
    `;
    box.appendChild(el);
  }

  // ------------------------------
  // Idle / Offline
  // ------------------------------
  function grantIdle(seconds){
    // gera recompensa passiva baseada no nível, autohit e mapa atual (bem moderada)
    const map = MAPS[P.mapIndex];
    const perSecGold = (P.upgrades.autoHitLvl>0 ? (map.mobGold[0]+map.mobGold[1])/2 * 0.05 : 0.02*P.level);
    const perSecXp   = (P.upgrades.autoHitLvl>0 ? (map.mobXp[0]+map.mobXp[1])/2   * 0.05 : 0.02*P.level);
    const g = Math.floor(perSecGold * seconds);
    const x = Math.floor(perSecXp * seconds);
    if (g>0 || x>0){
      gainGold(g); gainXp(x);
      log(`Recompensa offline: +${g} gold, +${x} XP.`);
    }
  }

  function checkOfflineRewards(){
    if (!P.offlineEnabled) return;
    const last = P.lastActive || now();
    const elapsed = Math.floor((now()-last)/1000);
    if (elapsed > 6){
      const capped = Math.min(elapsed, 60*60*4); // no máx. 4h acumuladas
      grantIdle(capped);
    }
  }

  // ------------------------------
  // Sincronização UI
  // ------------------------------
  function syncAll(){
  $('#uiLevel').textContent = P.level;
  $('#uiXp').textContent = P.xp;
  $('#uiXpToNext').textContent = P.xpToNext;
  $('#xpBar').style.width = (P.xp/P.xpToNext*100)+'%';
  $('#uiGold').textContent = P.gold;

  $('#uiCurrentMana').textContent = P.currentMana;
  $('#uiMaxMana').textContent = P.attrs.maxMana;
  $('#manaBar').style.width = clamp((P.currentMana/P.attrs.maxMana)*100,0,100)+'%';

  $('#uiStr').textContent = P.attrs.str;
  $('#uiAgi').textContent = P.attrs.agi;
  $('#uiDef').textContent = P.attrs.def;
  $('#uiMana').textContent = P.attrs.mana;
  $('#uiCrit').textContent = P.attrs.crit.toFixed(0);
  $('#uiCritDmg').textContent = P.attrs.critdmg.toFixed(1);
  $('#uiMaxHp').textContent = P.attrs.maxHp;
  $('#uiAttrPts').textContent = P.attrPoints;

  $('#uiSword').textContent = P.skills.sword;
  $('#uiArchery').textContent = P.skills.archery;
  $('#uiMagic').textContent   = P.skills.magic;
  $('#uiShield').textContent  = P.skills.shield;

  $('#uiMapName').textContent = MAPS[P.mapIndex].name;
  $('#uiKills').textContent = P.kills;
  $('#uiKillsGoal').textContent = MAPS[P.mapIndex].killsGoal;

  recomputeMaxHp();
  $('#uiPlayerMaxHp').textContent = P.attrs.maxHp;
  $('#uiPlayerHp').textContent = P.hp;
  $('#playerHpBar').style.width = clamp((P.hp/P.attrs.maxHp)*100,0,100)+'%';

  $('#localSaveToggle').checked = !!localStorage.getItem('tibia_clicker_save');
  
  // Atualiza tooltips com valores calculados
  updateAttributeTooltips();
}

function updateAttributeTooltips() {
  // Calcula valores atuais para mostrar nos tooltips
  let gearStr = 0, gearCrit = 0;
  ['weapon','armor','ring'].forEach(s => {
    const g = getEquipped(s);
    if (!g || !g.mods) return;
    if (g.mods.str) gearStr += g.mods.str;
    if (g.mods.crit) gearCrit += g.mods.crit;
  });

function regenMana() {
  const regenRate = 1 + Math.floor(P.skills.magic * 0.2);
  P.currentMana = Math.min(P.currentMana + regenRate, P.attrs.maxMana);
  syncAll();
}

// Chame a cada 3 segundos
setInterval(regenMana, 3000);

  // Atualiza valores nos tooltips
  const strDamage = (P.attrs.str + gearStr) * 1.5;
  const agiCrit = P.attrs.agi * 0.2;
  const defReduction = P.attrs.def * 0.6;
  
  if ($('#strDamageValue')) $('#strDamageValue').textContent = strDamage.toFixed(1);
  if ($('#agiCritValue')) $('#agiCritValue').textContent = agiCrit.toFixed(1);
  if ($('#defReductionValue')) $('#defReductionValue').textContent = defReduction.toFixed(1);
  if ($('#critMultValue')) $('#critMultValue').textContent = P.attrs.critdmg.toFixed(2);
}

  // ------------------------------
  // Eventos
  // ------------------------------
  function bindEvents(){

// Comando secreto para adicionar gold (apenas para testes)
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'G') {
    const amount = prompt("Quanto gold adicionar?");
    if (amount && !isNaN(amount)) {
      P.gold += parseInt(amount);
      syncAll();
      log(`Adicionado ${amount} gold (comando de teste).`);
    }
  }
});
    // botões principais
    $('#btnHunt').addEventListener('click', ()=> hitMob());
    $('#btnBoss').addEventListener('click', ()=> openBoss());
    $('#btnShop').addEventListener('click', ()=> { renderShop(); showModal('shopModal'); });
    $('#btnInventory').addEventListener('click', ()=> { renderInventory(); showModal('inventoryModal'); });
    $('#btnQuests').addEventListener('click', ()=> { renderQuests(); showModal('questsModal'); });

    // fechar modais
    $$('.close').forEach(btn=>{
      btn.addEventListener('click', e=> hideModal(e.target.dataset.close));
    });
    $('#modalOverlay').addEventListener('click', ()=>{
      // fecha todos
      ['inventoryModal','shopModal','questsModal','bossModal'].forEach(hideModal);
    });

    // upgrade atributos
    $$('.attr-buttons .mini').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const attr = btn.dataset.attr;
        if (P.attrPoints<=0){ log("Sem pontos de atributo."); return; }
        switch(attr){
          case 'str': P.attrs.str++; break;
          case 'agi': P.attrs.agi++; break;
          case 'def': P.attrs.def++; recomputeMaxHp(); break;
          case 'mana': P.attrs.mana++; break;
          case 'crit': P.attrs.crit = clamp(P.attrs.crit+1, 0, 100); break;
          case 'critdmg': P.attrs.critdmg = parseFloat((P.attrs.critdmg+0.05).toFixed(2)); break;
          case 'hp': P.attrs.maxHp += 5; recomputeMaxHp(); break;
        }
        P.attrPoints--;
        syncAll();
      });
    });

    // loja (delegation)
    $('#shopModal').addEventListener('click', e=>{
      const t = e.target;
      if (t.dataset.buyUpg) buyUpgrade(t.dataset.buyUpg);
      if (t.dataset.buyGear) buyGear(t.dataset.buyGear);
      if (t.dataset.buyCons) buyConsumable(t.dataset.buyCons);
    });

    // inventário (delegation)
    $('#inventoryModal').addEventListener('click', e=>{
      const t = e.target;
      if (t.dataset.equip) equipItem(t.dataset.equip);
      if (t.dataset.sell) sellItem(t.dataset.sell);
      if (typeof t.dataset.consume !== 'undefined') consumeIndex(parseInt(t.dataset.consume,10));
    });

    // boss actions
    $('#btnAttackBoss').addEventListener('click', ()=> attackBoss());
    $('#btnUsePotion').addEventListener('click', ()=> usePotion());

    // save/reset
    $('#btnSave').addEventListener('click', ()=> save());
    $('#btnReset').addEventListener('click', ()=> {
      if (confirm("Tem certeza que deseja resetar todo o progresso?")) resetAll();
    });

    // toggles
    $('#localSaveToggle').addEventListener('change', ()=>{
      if (!$('#localSaveToggle').checked){
        localStorage.removeItem('tibia_clicker_save');
        log("Salvamento local desativado.");
      }else{
        save();
        log("Salvamento local ativado.");
      }
    });
    $('#offlineToggle').addEventListener('change', ()=>{
      P.offlineEnabled = $('#offlineToggle').checked;
      log(`Geração offline ${P.offlineEnabled?'ativada':'desativada'}.`);
    });

    // nome
    applyName();
  }

  // ------------------------------
  // Inicialização
  // ------------------------------
  function init(){
    load();
    checkOfflineRewards();
    setupMob();
    bindEvents();
    syncAll();
    startAutoHit();

    // salvar periodicamente
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(()=> save(), 15000);
    log("Bem-vindo(a) ao Tibia Clicker.");
  }

  // garantir que o boss timer pare ao fechar modal por tecla Esc
  document.addEventListener('keydown', e=>{
    if (e.key === 'Escape'){
      ['inventoryModal','shopModal','questsModal','bossModal'].forEach(id=>{
        const wasBoss = (id==='bossModal' && !$('#bossModal').classList.contains('hidden'));
        hideModal(id);
        if (wasBoss) stopBossTimer();
      });
    }
  });

  window.addEventListener('beforeunload', ()=> save());

  // start
  init();
})();
