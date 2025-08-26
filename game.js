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

  // ------------------------------
  // Dados principais
  // ------------------------------
  const MAPS = [
    {
      id: 0, name: "Floresta",
      mobHp: 20, mobGold: [2, 4], mobXp: [2, 4],
      bossHp: 200, bossAtk: 12, bossDmg: [8, 14],
      killsGoal: 10, gearTier: 1
    },
    {
      id: 1, name: "Cavernas",
      mobHp: 60, mobGold: [6, 10], mobXp: [6, 9],
      bossHp: 600, bossAtk: 11, bossDmg: [16, 26],
      killsGoal: 14, gearTier: 2
    },
    {
      id: 2, name: "Castelo",
      mobHp: 160, mobGold: [14, 22], mobXp: [14, 20],
      bossHp: 1600, bossAtk: 10, bossDmg: [30, 48],
      killsGoal: 18, gearTier: 3
    }
  ];

  const START = {
    name: "Aventureiro",
    level: 1, xp: 0, xpToNext: 50, totalXp: 0,
    gold: 0,
    attrPoints: 0,
    attrs: {
      str: 1, agi: 1, def: 1, mana: 0,
      crit: 5, critdmg: 1.5, maxHp: 100
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
  };

  const GEAR_POOL = [
    // tier 1
    { id:"w-wood-sword",  name:"Espada de Madeira", slot:"weapon", tier:1, mods:{str: +2} },
    { id:"a-leather",     name:"Armadura de Couro", slot:"armor",  tier:1, mods:{def: +2, maxHp: +10} },
    { id:"r-copper",      name:"Anel de Cobre",     slot:"ring",   tier:1, mods:{crit:+2} },
    // tier 2
    { id:"w-iron-sword",  name:"Espada de Ferro",   slot:"weapon", tier:2, mods:{str: +5, crit:+2} },
    { id:"a-chain",       name:"Cota de Malha",     slot:"armor",  tier:2, mods:{def: +5, maxHp:+30} },
    { id:"r-silver",      name:"Anel de Prata",     slot:"ring",   tier:2, mods:{crit:+4, critdmg:+0.2} },
    // tier 3
    { id:"w-flame-staff", name:"Cajado Flamejante", slot:"weapon", tier:3, mods:{mana:+8, crit:+5, critdmg:+0.3} },
    { id:"a-plate",       name:"Armadura de Placas",slot:"armor",  tier:3, mods:{def:+9, maxHp:+60} },
    { id:"r-gold",        name:"Anel de Ouro",      slot:"ring",   tier:3, mods:{crit:+6, critdmg:+0.4} },
  ];

  const SHOP = {
    upgrades: [
      { id:"upg-dmg", name:"+ Dano Base", desc:"+2 dano por nível", baseCost: 25, growth: 1.35, apply: p => p.upgrades.damageLvl++ },
      { id:"upg-auto", name:"Autohit", desc:"Ataques automáticos progressivos", baseCost: 60, growth: 1.6, apply: p => p.upgrades.autoHitLvl++ },
      { id:"upg-speed", name:"Vel. de Ataque", desc:"Autohit mais rápido", baseCost: 80, growth: 1.6, apply: p => p.upgrades.atkSpeedLvl++ },
      { id:"upg-hp", name:"+ Vida Máx.", desc:"+15 vida por nível", baseCost: 50, growth: 1.4, apply: p => p.upgrades.maxHpLvl++ },
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
  };

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
    localStorage.removeItem('tibia_clicker_save');
    P = newPlayerState();
    mob = null; boss = null;
    applyName();
    setupMob();
    syncAll();
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
    const base = 100 + P.upgrades.maxHpLvl * 15 + (P.attrs.maxHp || 0);
    // bônus de equipamentos
    let gearHp = 0;
    ['weapon','armor','ring'].forEach(slot=>{
      const g = getEquipped(slot);
      if (g && g.mods?.maxHp) gearHp += g.mods.maxHp;
    });
    const newMax = base + gearHp + Math.floor(P.attrs.def * 2);
    const wasMax = P.hp >= P.attrs.maxHp; // só para experiência do usuário
    P.attrs.maxHp = newMax;
    P.hp = clamp(P.hp, 1, newMax);
    if (wasMax) P.hp = newMax;
  }

  function baseDamage(){
    // base por nível + upgrades + força + armas/atributos
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
    const base = 3 + dmgFromLevel + dmgFromUpgrade + dmgFromStr;
    // crítico
    const critChance = clamp(P.attrs.crit + gearCrit + (P.attrs.agi*0.2), 0, 100);
    const critMult = P.attrs.critdmg + gearCritD;
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
      if (drop) { P.inventory.push(drop); log(`Dropou: ${drop.name}.`); }
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
        // boss ataca
        const dmg = randi(boss.dmg[0], boss.dmg[1]) - Math.floor(P.attrs.def*0.6);
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
    if (P.upgrades.autoHitLvl <= 0) return;
    const baseMs = 1200;
    const speedBonus = P.upgrades.atkSpeedLvl * 60; // reduz por nível
    const interval = Math.max(240, baseMs - speedBonus - (P.level*4));
    autoHitTimer = setInterval(()=> {
      hitMob();
    }, interval);
  }

  function stopAutoHit(){
    if (autoHitTimer){ clearInterval(autoHitTimer); autoHitTimer = null; }
  }

  // ------------------------------
  // Loja
  // ------------------------------
  function renderShop(){
    const upgBox = $('#shopUpgrades'); upgBox.innerHTML = '';
    SHOP.upgrades.forEach((u,i)=>{
      const lvl = P.upgrades[(u.id==='upg-dmg')?'damageLvl':(u.id==='upg-auto')?'autoHitLvl':(u.id==='upg-speed')?'atkSpeedLvl':'maxHpLvl'];
      const cost = Math.floor(u.baseCost * Math.pow(u.growth, lvl));
      const el = document.createElement('div'); el.className='shop-item';
      el.innerHTML = `
        <div class="name">${u.name} (Nível ${lvl})</div>
        <div class="meta">${u.desc}</div>
        <div class="meta">Custo: ${cost} gold</div>
        <button data-buy-upg="${u.id}">Comprar</button>
      `;
      upgBox.appendChild(el);
    });

    const gearBox = $('#shopGear'); gearBox.innerHTML = '';
    SHOP.gear.forEach(g=>{
      const data = GEAR_POOL.find(x=>x.id===g.ref);
      const el = document.createElement('div'); el.className='shop-item';
      el.innerHTML = `
        <div class="name">${data.name}</div>
        <div class="meta">Slot: ${data.slot}</div>
        <div class="meta">Bônus: ${modsToText(data.mods)}</div>
        <div class="meta">Preço: ${g.price} gold</div>
        <button data-buy-gear="${data.id}">Comprar</button>
      `;
      gearBox.appendChild(el);
    });

    const cBox = $('#shopConsumables'); cBox.innerHTML='';
    SHOP.consumables.forEach(c=>{
      const el = document.createElement('div'); el.className='shop-item';
      el.innerHTML = `
        <div class="name">${c.name}</div>
        <div class="meta">Cura: ${c.heal}</div>
        <div class="meta">Preço: ${c.price} gold</div>
        <button data-buy-cons="${c.id}">Comprar</button>
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
    u.apply(P);
    if (id==='upg-hp'){ recomputeMaxHp(); }
    if (id==='upg-auto' || id==='upg-speed'){ startAutoHit(); }
    renderShop(); syncAll();
    log(`Comprou ${u.name}.`);
  }

  function buyGear(id){
    const g = SHOP.gear.find(x=>x.ref===id);
    const data = GEAR_POOL.find(x=>x.id===id);
    if (!g || !data) return;
    if (!spendGold(g.price)){ log("Gold insuficiente."); return; }
    const it = JSON.parse(JSON.stringify(data));
    it.uid = 'it-' + Math.random().toString(36).slice(2);
    P.inventory.push(it);
    log(`Comprou ${data.name}.`);
    renderInventory(); syncAll();
  }

  function buyConsumable(id){
    const c = SHOP.consumables.find(x=>x.id===id);
    if (!c) return;
    if (!spendGold(c.price)){ log("Gold insuficiente."); return; }
    P.consumables.push(JSON.parse(JSON.stringify(c)));
    log(`Comprou ${c.name}.`);
    renderInventory(); syncAll();
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
    P.inventory.forEach(it=>{
      const el = document.createElement('div'); el.className='item';
      el.innerHTML = `
        <div class="name">${it.name}</div>
        <div class="meta">Slot: ${it.slot}</div>
        <div class="meta">Bônus: ${modsToText(it.mods)}</div>
        <button data-equip="${it.uid}">Equipar</button>
        <button data-sell="${it.uid}" class="secondary">Vender (+${sellValue(it)} gold)</button>
      `;
      list.appendChild(el);
    });
    // consumíveis
    const clist = $('#consumablesList'); clist.innerHTML='';
    P.consumables.forEach((c,idx)=>{
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
    const idx = P.inventory.findIndex(x=>x.uid===uid);
    if (idx === -1) return;
    const it = P.inventory[idx];
    // devolve item antigo para inventário
    if (P.equipped[it.slot]) P.inventory.push(P.equipped[it.slot]);
    // equipa
    P.equipped[it.slot] = it;
    // remove do inventário
    P.inventory.splice(idx,1);
    recomputeMaxHp();
    renderInventory(); syncAll();
    log(`Equipou ${it.name}.`);
  }

  function sellItem(uid){
    const idx = P.inventory.findIndex(x=>x.uid===uid);
    if (idx === -1) return;
    const it = P.inventory.splice(idx,1)[0];
    gainGold(sellValue(it));
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

    recomputeMaxHp(); // garante consistência se algo mudou
    $('#uiPlayerMaxHp').textContent = P.attrs.maxHp;
    $('#uiPlayerHp').textContent = P.hp;
    $('#playerHpBar').style.width = clamp((P.hp/P.attrs.maxHp)*100,0,100)+'%';

    $('#localSaveToggle').checked = !!localStorage.getItem('tibia_clicker_save');
  }

  // ------------------------------
  // Eventos
  // ------------------------------
  function bindEvents(){
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
