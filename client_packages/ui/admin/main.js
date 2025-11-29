const panel = document.getElementById('admin');
const listEl = document.getElementById('list');
const searchInput = document.getElementById('search');
const payloadInput = document.getElementById('payload');
const statusEl = document.getElementById('status');

let players = [];
let selectedId = null;
let pendingAction = null;

function renderList() {
  const query = (searchInput.value || '').toLowerCase();
  listEl.innerHTML = '';
  players
    .filter((p) => p.name.toLowerCase().includes(query) || String(p.id) === query || query === '')
    .forEach((p) => {
      const row = document.createElement('div');
      row.className = `row ${selectedId === p.id ? 'active' : ''}`;
      row.innerHTML = `<span>#${p.id} ${p.name}</span><span>ping ${p.ping}</span>`;
      row.onclick = () => {
        selectedId = p.id;
        renderList();
      };
      listEl.appendChild(row);
    });
}

function setStatus(text) {
  statusEl.innerText = text || '';
}

document.getElementById('refresh-btn').onclick = () => {
  mp.trigger('ui:admin:refresh');
  setStatus('Запрос списка игроков...');
};

document.getElementById('close-btn').onclick = () => {
  panel.classList.add('hidden');
  mp.trigger('ui:admin:closed');
};

Array.from(document.querySelectorAll('.actions button')).forEach((btn) => {
  btn.onclick = () => {
    pendingAction = btn.dataset.action;
    setStatus(`Выбрано действие: ${pendingAction}`);
  };
});

document.getElementById('apply-btn').onclick = () => {
  if (!pendingAction) return setStatus('Выберите действие.');
  if (selectedId === null) return setStatus('Выберите игрока.');
  const payload = payloadInput.value;
  mp.trigger('ui:admin:action', pendingAction, selectedId, payload);
  setStatus(`Отправлено ${pendingAction} на #${selectedId}`);
};

searchInput.addEventListener('input', renderList);

window.showAdmin = (flag) => {
  panel.classList.toggle('hidden', !flag);
  if (flag) {
    mp.trigger('ui:admin:refresh');
    setStatus('Открыто');
  } else {
    setStatus('');
  }
};

window.updatePlayers = (json) => {
  try {
    players = JSON.parse(json);
  } catch (e) {
    players = [];
  }
  renderList();
  setStatus(`Онлайн: ${players.length}`);
};
