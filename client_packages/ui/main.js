let authBrowser = null;
let charBrowser = null;
let hudBrowser = null;
let chatBrowser = null;
let adminBrowser = null;

let controlsLocked = true;
let hudVisible = false;
let adminOpen = false;
const hudState = {
  cash: 0,
  bank: 0,
  hp: 100,
  armor: 0,
  name: '',
  adminLevel: 0,
  charId: 0,
};

function ensureHudBrowser() {
  if (!hudBrowser) {
    hudBrowser = mp.browsers.new('package://client_packages/ui/hud/index.html');
  }
}

function ensureChatBrowser() {
  if (!chatBrowser) {
    chatBrowser = mp.browsers.new('package://client_packages/ui/chat/index.html');
  }
}

function ensureAdminBrowser() {
  if (!adminBrowser) {
    adminBrowser = mp.browsers.new('package://client_packages/ui/admin/index.html');
  }
}

function hideRockstarHud() {
  mp.game.ui.displayHud(false);
  mp.game.ui.displayRadar(false);
  mp.game.ui.hideHudComponentThisFrame(6);
  mp.game.ui.hideHudComponentThisFrame(7);
  mp.game.ui.hideHudComponentThisFrame(8);
  mp.game.ui.hideHudComponentThisFrame(9);
}

function lockControlState(flag) {
  controlsLocked = flag;
  mp.players.local.freezePosition(flag);
  mp.gui.cursor.show(flag, flag);
}

function openAuth() {
  if (authBrowser) return;
  authBrowser = mp.browsers.new('package://client_packages/ui/auth/index.html');
  lockControlState(true);
}

function closeAuth() {
  if (authBrowser) {
    authBrowser.destroy();
    authBrowser = null;
  }
}

function openCharCreate() {
  if (charBrowser) return;
  charBrowser = mp.browsers.new('package://client_packages/ui/charcreate/index.html');
  lockControlState(true);
}

function closeCharCreate() {
  if (charBrowser) {
    charBrowser.destroy();
    charBrowser = null;
  }
}

function showHud() {
  ensureHudBrowser();
  hudVisible = true;
  hudBrowser.execute('window.setHudVisible(true);');
}

function hideHud() {
  hudVisible = false;
  if (hudBrowser) hudBrowser.execute('window.setHudVisible(false);');
}

mp.events.add('render', () => {
  hideRockstarHud();
  if (controlsLocked) {
    mp.game.controls.disableAllControlActions(0);
    mp.game.controls.disableAllControlActions(1);
    mp.game.controls.disableAllControlActions(2);
  }
});

mp.events.add('auth:show', () => {
  closeCharCreate();
  openAuth();
});

mp.events.add('auth:error', (message) => {
  if (authBrowser) authBrowser.execute(`window.setAuthError(${JSON.stringify(message)})`);
  if (charBrowser) charBrowser.execute(`window.setCharError(${JSON.stringify(message)})`);
});

mp.events.add('auth:registered', (username) => {
  if (authBrowser) authBrowser.execute(`window.prefillLogin(${JSON.stringify(username)})`);
});

mp.events.add('auth:needsCharacter', (username) => {
  closeAuth();
  openCharCreate();
  charBrowser.execute(`window.prefillName(${JSON.stringify(username || '')})`);
});

mp.events.add('auth:success', () => {
  closeAuth();
  closeCharCreate();
  lockControlState(false);
  showHud();
});

mp.events.add('char:create:open', () => {
  closeAuth();
  openCharCreate();
});

mp.events.add('ui:lockControls', (state) => lockControlState(state));
mp.events.add('ui:hud:show', showHud);
mp.events.add('ui:hud:hide', hideHud);

mp.events.add('ui:hud:update', (cash, bank, hp, armor, name, adminLevel, charId) => {
  ensureHudBrowser();
  hudState.cash = cash;
  hudState.bank = bank;
  hudState.hp = hp;
  hudState.armor = armor;
  hudState.name = name;
  hudState.adminLevel = adminLevel;
  hudState.charId = charId;
  hudBrowser.execute(
    `window.updateHud(${hudState.cash}, ${hudState.bank}, ${hudState.hp}, ${hudState.armor}, ${JSON.stringify(
      hudState.name
    )}, ${hudState.adminLevel}, ${hudState.charId})`
  );
});

mp.events.add('ui:chat:push', (type, text) => {
  ensureChatBrowser();
  chatBrowser.execute(`window.pushMessage(${JSON.stringify(type)}, ${JSON.stringify(text)})`);
});

mp.events.add('admin:open', () => {
  ensureAdminBrowser();
  adminBrowser.execute('window.showAdmin(true);');
  adminOpen = true;
  mp.gui.cursor.show(true, true);
});

mp.events.add('admin:players', (json) => {
  ensureAdminBrowser();
  adminBrowser.execute(`window.updatePlayers(${JSON.stringify(json)})`);
});

mp.events.add('ui:admin:closed', () => {
  adminOpen = false;
  if (!controlsLocked) mp.gui.cursor.show(false, false);
});

setInterval(() => {
  if (!hudVisible || !hudBrowser) return;
  const local = mp.players.local;
  hudState.hp = Math.min(100, Math.max(0, local.getHealth()));
  hudState.armor = Math.min(100, Math.max(0, local.getArmour()));
  hudBrowser.execute(
    `window.updateHud(${hudState.cash}, ${hudState.bank}, ${hudState.hp}, ${hudState.armor}, ${JSON.stringify(
      hudState.name
    )}, ${hudState.adminLevel}, ${hudState.charId})`
  );
}, 500);

// CEF -> client bindings
mp.events.add('ui:auth:loginSubmit', (login, password) => {
  mp.events.callRemote('auth:login', login, password);
});

mp.events.add('ui:auth:registerSubmit', (login, email, password, confirm) => {
  mp.events.callRemote('auth:register', login, email, password, confirm);
});

mp.events.add('ui:char:createSubmit', (firstName, lastName) => {
  mp.events.callRemote('auth:createCharacter', firstName, lastName);
});

mp.events.add('ui:admin:refresh', () => {
  mp.events.callRemote('admin:getPlayers');
});

mp.events.add('ui:admin:action', (action, targetId, payload) => {
  mp.events.callRemote('admin:doAction', action, targetId, payload);
});

mp.keys.bind(0x71, true, () => {
  mp.events.callRemote('admin:openRequest');
});
