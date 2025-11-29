const bcrypt = require('bcryptjs');
const db = require('./db');
const playerService = require('./player');

function sendError(player, message) {
  player.outputChatBox(`!{#ff5c5c}[Auth] ${message}`);
  player.call('ui:auth:error', [message]);
}

async function findAccountByUsername(username) {
  const [rows] = await db.query('SELECT * FROM accounts WHERE username = ?', [username]);
  return rows[0];
}

async function registerAccount(player, username, password, confirmPassword, firstName, lastName) {
  if (!username || !password || !confirmPassword || !firstName || !lastName) {
    return sendError(player, 'Заполните все поля.');
  }
  if (password !== confirmPassword) {
    return sendError(player, 'Пароли не совпадают.');
  }

  const existing = await findAccountByUsername(username);
  if (existing) {
    return sendError(player, 'Такой логин уже существует.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const ip = player.ip || player.getIp();

  const [result] = await db.query(
    'INSERT INTO accounts (username, password_hash, reg_ip, last_ip, last_login) VALUES (?, ?, ?, ?, NOW())',
    [username, passwordHash, ip, ip]
  );

  const accountId = result.insertId;
  player.outputChatBox('!{#5cb85c}[Auth] Аккаунт создан, персонаж будет создан.');

  const character = await playerService.createCharacter(player, {
    accountId,
    firstName,
    lastName,
  });

  await db.query('UPDATE accounts SET last_login = NOW() WHERE id = ?', [accountId]);
  playerService.finishLogin(player, { accountId, adminLevel: 0 }, character);
}

async function loginAccount(player, username, password) {
  if (!username || !password) {
    return sendError(player, 'Введите логин и пароль.');
  }

  const account = await findAccountByUsername(username);
  if (!account) return sendError(player, 'Аккаунт не найден.');

  const match = await bcrypt.compare(password, account.password_hash);
  if (!match) return sendError(player, 'Неверный пароль.');

  const [rows] = await db.query('SELECT * FROM characters WHERE account_id = ? LIMIT 1', [account.id]);
  let character = rows[0];

  if (!character) {
    player.call('ui:auth:open', ['register', username, true]);
    player.outputChatBox('!{#e0d449}[Auth] Создайте персонажа.');
    player.data.pendingAccountId = account.id;
  } else {
    await db.query('UPDATE accounts SET last_ip = ?, last_login = NOW() WHERE id = ?', [
      player.ip || player.getIp(),
      account.id,
    ]);
    playerService.finishLogin(player, account, character);
  }
}

async function createCharacterForAccount(player, firstName, lastName) {
  const accountId = player.data.pendingAccountId;
  if (!accountId) return sendError(player, 'Сначала авторизуйтесь.');

  const character = await playerService.createCharacter(player, { accountId, firstName, lastName });
  const [accountRows] = await db.query('SELECT * FROM accounts WHERE id = ?', [accountId]);
  const account = accountRows[0];
  playerService.finishLogin(player, account, character);
}

function registerAuthHandlers() {
  mp.events.add('playerJoin', (player) => {
    player.data = player.data || {};
    player.call('ui:auth:open', ['auth']);
    player.dimension = 0;
  });

  mp.events.add('auth:register', (player, username, password, confirmPassword, firstName, lastName) => {
    registerAccount(player, username, password, confirmPassword, firstName, lastName).catch((err) => {
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
};
