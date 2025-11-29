const hud = document.getElementById('hud');
const nameEl = document.getElementById('hud-name');
const metaEl = document.getElementById('hud-meta');
const moneyEl = document.getElementById('hud-money');
const hpEl = document.getElementById('hud-hp');
const armorEl = document.getElementById('hud-armor');
const timeEl = document.getElementById('hud-time');

function formatMoney(v) {
  return `$${Number(v || 0).toLocaleString('ru-RU')}`;
}

window.updateHud = (cash, bank, hp, armor, name, admin, charId) => {
  moneyEl.innerText = `${formatMoney(cash)} | Банк: ${formatMoney(bank)}`;
  hpEl.style.width = `${Math.min(100, Math.max(0, hp))}%`;
  armorEl.style.width = `${Math.min(100, Math.max(0, armor))}%`;
  nameEl.innerText = name || 'Гость';
  metaEl.innerText = `ID: ${charId || 0}${admin > 0 ? ` | Админ ${admin}` : ''}`;
};

window.setHudVisible = (flag) => {
  hud.classList.toggle('hidden', !flag);
};

setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  timeEl.innerText = `${hh}:${mm}`;
}, 500);
