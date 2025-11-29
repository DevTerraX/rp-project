const bcrypt = require('bcryptjs');
const db = require('./db');
const playerService = require('./player');

const AUTH_DIMENSION = 9999;
const NAME_REGEX = /^[A-Za-z]{2,16}$/;

function sendError(player, message) {
  player.call('auth:error', [message]);
  player.outputChatBox(`!{#ff5c5c}[Auth] ${message}`);
}

async function findAccountByUsername(username) {
  const [rows] = await db.query('SELECT * FROM accounts WHERE username = ?', [username]);
  return rows[0];
}

function lockForAuth(player) {
  player.dimension = AUTH_DIMENSION;
  player.alpha = 0;
  player.call('ui:hud:hide');
  player.call('ui:lockControls', [true]);
}

function unlockAfterAuth(player) {
  player.alpha = 255;
  player.call('ui:lockControls', [false]);
}

function validateCredentials(player, username, password, confirmPassword) {
  if (!username || !password || !confirmPassword) {
    sendError(player, 'Заполните все поля.');
    return false;
  }
  if (password.length < 6) {
    sendError(player, 'Слишком короткий пароль.');
    return false;
  }
  if (password !== confirmPassword) {
    sendError(player, 'Пароли не совпадают.');
    return false;
  }
  return true;
}

function validateNames(player, firstName, lastName) {
  if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
    sendError(player, 'Имя и фамилия недопустимы.');
    return false;
  }
  return true;
}

function validateEmail(player, email) {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !EMAIL_REGEX.test(email)) {
    sendError(player, 'Укажите корректный e-mail.');
    return false;
  }
  return true;
}

async function registerAccount(player, username, email, password, confirmPassword) {
  if (!validateCredentials(player, username, password, confirmPassword)) return null;
  if (!validateEmail(player, email)) return null;

  const existing = await findAccountByUsername(username);
  if (existing) {
    sendError(player, 'Логин занят');
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const ip = player.ip || player.getIp();

  const [result] = await db.query(
    'INSERT INTO accounts (username, email, password_hash, reg_ip, last_ip, last_login) VALUES (?, ?, ?, ?, ?, NOW())',
    [username, email, passwordHash, ip, ip]
  );

  console.log(`[auth] Создан аккаунт ${username} (${result.insertId}) IP=${ip}`);
  player.data.pendingAccountId = result.insertId;
  player.call('auth:registered', [username]);
  player.call('char:create:open');
  return result.insertId;
}

async function loginAccount(player, username, password) {
  if (!username || !password) {
    return sendError(player, 'Введите логин и пароль.');
  }

  const account = await findAccountByUsername(username);
  if (!account) {
    console.warn(`[auth] Аккаунт не найден для ${username} (${player.ip})`);
    return sendError(player, 'Аккаунт не найден');
  }

  const match = await bcrypt.compare(password, account.password_hash);
  if (!match) {
    console.warn(`[auth] Неверный пароль ${username} (${player.ip})`);
    return sendError(player, 'Неверный пароль');
  }

  const [rows] = await db.query('SELECT * FROM characters WHERE account_id = ? LIMIT 1', [account.id]);
  const character = rows[0];

  await db.query('UPDATE accounts SET last_ip = ?, last_login = NOW() WHERE id = ?', [
    player.ip || player.getIp(),
    account.id,
  ]);

  if (!character) {
    player.data.pendingAccountId = account.id;
    player.call('char:create:open');
    player.call('auth:needsCharacter', [account.username]);
    player.outputChatBox('!{#e0d449}[Auth] Создайте персонажа.');
    return;
  }

  console.log(`[auth] Успешный вход ${username} (${account.id})`);
  unlockAfterAuth(player);
  playerService.finishLogin(player, account, character);
}

async function createCharacterForAccount(player, firstName, lastName) {
  if (!validateNames(player, firstName, lastName)) return;
  const accountId = player.data.pendingAccountId;
  if (!accountId) return sendError(player, 'Сначала авторизуйтесь.');

  const character = await playerService.createCharacter(player, { accountId, firstName, lastName });
  const [accountRows] = await db.query('SELECT * FROM accounts WHERE id = ?', [accountId]);
  const account = accountRows[0];
  console.log(`[auth] Создан персонаж ${character.name} для аккаунта ${account.username}`);
  unlockAfterAuth(player);
  playerService.finishLogin(player, account, character);
}

function registerAuthHandlers() {
  mp.events.add('playerJoin', (player) => {
    player.data = player.data || {};
    lockForAuth(player);
    player.call('auth:show');
    console.log(`[auth] Join ${player.name} (${player.ip})`);
  });

  mp.events.add('auth:register', (player, username, email, password, confirmPassword) => {
    registerAccount(player, username, email, password, confirmPassword).catch((err) => {
      console.error('[auth] register error', err);
      sendError(player, 'Ошибка регистрации.');
    });
  });

  mp.events.add('auth:login', (player, username, password) => {
    loginAccount(player, username, password).catch((err) => {
      console.error('[auth] login error', err);
      sendError(player, 'Ошибка входа.');
    });
  });

  mp.events.add('auth:createCharacter', (player, firstName, lastName) => {
    createCharacterForAccount(player, firstName, lastName).catch((err) => {
      console.error('[auth] create character error', err);
      sendError(player, 'Ошибка создания персонажа.');
    });
  });
}

module.exports = {
  registerAuthHandlers,
  lockForAuth,
};
