const db = require('./db');

const START_POS = { x: -1038.73, y: -2737.94, z: 20.17 };
const HOSPITAL_POS = { x: 355.1, y: -596.2, z: 28.77 };

async function createCharacter(player, { accountId, firstName, lastName }) {
  const fullName = `${firstName} ${lastName}`;
  const [result] = await db.query(
    `
      INSERT INTO characters
        (account_id, name, cash, bank, pos_x, pos_y, pos_z, dimension, health, armor)
      VALUES (?, ?, 5000, 0, ?, ?, ?, 0, 100, 0)
    `,
    [accountId, fullName, START_POS.x, START_POS.y, START_POS.z]
  );

  const [rows] = await db.query('SELECT * FROM characters WHERE id = ?', [result.insertId]);
  player.outputChatBox(`!{#5cb85c}[Character] Создан персонаж ${fullName}.`);
  return rows[0];
}

function applyCharacterToPlayer(player, character) {
  player.name = character.name;
  player.dimension = character.dimension || 0;
  player.spawn(new mp.Vector3(character.pos_x, character.pos_y, character.pos_z));
  player.health = character.health || 100;
  player.armour = character.armor || 0;
}

function updateHud(player, character) {
  player.call('ui:hud:update', [
    character.cash,
    character.bank,
    player.health,
    player.armour,
    character.name,
    player.data.adminLevel || 0,
    player.data.characterId || 0,
  ]);
}

function finishLogin(player, account, character) {
  player.data.accountId = account.id || account.accountId;
  player.data.adminLevel = account.admin_level || 0;
  player.data.characterId = character.id;
  player.data.character = character;
  player.call('ui:lockControls', [false]);

  applyCharacterToPlayer(player, character);
  player.call('auth:success');
  player.call('ui:hud:show');
  updateHud(player, character);
  player.outputChatBox(`!{#5cb85c}[Auth] Добро пожаловать, ${character.name}.`);
}

async function saveCharacter(player) {
  if (!player.data.characterId) return;
  const pos = player.position;
  player.data.character.pos_x = pos.x;
  player.data.character.pos_y = pos.y;
  player.data.character.pos_z = pos.z;
  player.data.character.dimension = player.dimension;
  player.data.character.health = player.health;
  player.data.character.armor = player.armour;
  await db.query(
    `
      UPDATE characters
         SET cash = ?, bank = ?, pos_x = ?, pos_y = ?, pos_z = ?, dimension = ?, health = ?, armor = ?
       WHERE id = ?
    `,
    [
      player.data.character.cash || 0,
      player.data.character.bank || 0,
      pos.x,
      pos.y,
      pos.z,
      player.dimension,
      player.health,
      player.armour,
      player.data.characterId,
    ]
  );
}

function registerPlayerHandlers() {
  setInterval(() => {
    mp.players.forEach((p) => {
      saveCharacter(p).catch((err) => console.error('[player] autosave error', err));
    });
  }, 30000);

  mp.events.add('playerQuit', (player, exitType, reason) => {
    console.log(`[player] Quit ${player.name} type=${exitType || ''} reason=${reason || ''}`);
    saveCharacter(player).catch((err) => console.error('[player] quit save error', err));
  });

  mp.events.add('playerDeath', (player) => {
    player.call('ui:hud:hide');
    setTimeout(() => {
      if (!player || !player.data.characterId) return;
      player.spawn(new mp.Vector3(HOSPITAL_POS.x, HOSPITAL_POS.y, HOSPITAL_POS.z));
      player.data.character.pos_x = HOSPITAL_POS.x;
      player.data.character.pos_y = HOSPITAL_POS.y;
      player.data.character.pos_z = HOSPITAL_POS.z;
      if (player.data.character.cash > 250) {
        player.data.character.cash -= 250;
      } else {
        player.data.character.cash = 0;
      }
      player.health = 100;
      player.armour = 0;
      updateHud(player, player.data.character);
      player.call('ui:hud:show');
    }, 15000);
  });
}

module.exports = {
  createCharacter,
  finishLogin,
  registerPlayerHandlers,
  saveCharacter,
  updateHud,
};
