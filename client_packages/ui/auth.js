let authBrowser = null;
const authState = {
  mode: 'auth',
  username: '',
  charOnly: false,
};
const hudState = {
  visible: false,
  cash: 0,
  bank: 0,
  health: 100,
  armor: 0,
  name: '',
  adminLevel: 0,
};

function toggleGameUi(show) {
  mp.gui.chat.show(show);
  mp.game.ui.displayRadar(show);
  mp.game.ui.displayHud(show);
}

function openAuth(mode = 'auth', username = '', charOnly = false) {
  authState.mode = mode;
  authState.username = username;
  authState.charOnly = !!charOnly;
  closeAuth();
  const page = mode === 'register' ? 'register' : 'auth';
  authBrowser = mp.browsers.new(`package://packages/ui/${page}.html`);
  toggleGameUi(false);
  mp.gui.cursor.show(true, true);

  if (username || charOnly) {
    setTimeout(() => {
      if (authBrowser) {
        if (username) {
          authBrowser.execute(`window.prefillUsername(${JSON.stringify(username)});`);
        }
        if (charOnly && page === 'register') {
          authBrowser.execute('window.setCharacterOnly(true);');
        }
      }
    }, 200);
  }
}

function closeAuth() {
  if (authBrowser) {
    authBrowser.destroy();
    authBrowser = null;
  }
  mp.gui.cursor.show(false, false);
  toggleGameUi(true);
}

mp.events.add('ui:auth:open', (mode, username, charOnly) => openAuth(mode, username, charOnly));
mp.events.add('ui:auth:close', () => {
  closeAuth();
  hudState.visible = true;
});
mp.events.add('ui:auth:error', (message) => {
  mp.gui.chat.push(`!{#ff5c5c}[Auth] ${message}`);
});
mp.events.add('ui:auth:navigate', (mode) => {
  if (authState.charOnly && mode === 'auth') return;
  authState.mode = mode;
  const page = mode === 'register' ? 'register' : 'auth';
  if (authBrowser) {
    authBrowser.url = `package://packages/ui/${page}.html`;
    setTimeout(() => {
      if (authBrowser && authState.username) {
        authBrowser.execute(`window.prefillUsername(${JSON.stringify(authState.username)});`);
      }
      if (authBrowser && authState.charOnly && page === 'register') {
        authBrowser.execute('window.setCharacterOnly(true);');
      }
    }, 200);
    return;
  }
  openAuth(mode, authState.username, authState.charOnly);
});

mp.events.add('ui:hud:update', (cash, bank, health, armor, name, adminLevel) => {
  hudState.cash = cash;
  hudState.bank = bank;
  hudState.health = health;
  hudState.armor = armor;
  hudState.name = name;
  hudState.adminLevel = adminLevel;
  hudState.visible = true;
});

mp.events.add('render', () => {
  if (!hudState.visible) return;
  const draw = (text, x, y, scale = 0.42, right = false) => {
    mp.game.graphics.drawText(text, [x, y], {
      font: 4,
      color: [255, 255, 255, 180],
      scale: [scale, scale],
      outline: true,
      centre: right,
      shadow: true,
    });
  };

  draw(`$${hudState.cash} | Банк: $${hudState.bank}`, 0.98, 0.05, 0.52, true);
  draw(`HP: ${hudState.health}  Armor: ${hudState.armor}`, 0.98, 0.085, 0.42, true);

  const admin = hudState.adminLevel > 0 ? ` | Админ: ${hudState.adminLevel}` : '';
  draw(`Персонаж: ${hudState.name}${admin}`, 0.02, 0.05, 0.45, false);
});
