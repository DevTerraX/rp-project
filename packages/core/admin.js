const playerService = require('./player');

const commandLevels = {
  tp: 1,
  goto: 1,
  kick: 2,
  ban: 3,
  sethp: 4,
  givemoney: 4,
};

function hasLevel(player, cmd) {
  const need = commandLevels[cmd] || 0;
  const current = player.data.adminLevel || 0;
  if (current < need) {
    player.outputChatBox('!{#ff5c5c}[Admin] Недостаточно прав.');
    return false;
  }
  return true;
}

function getPlayerById(id) {
  const parsed = parseInt(id, 10);
  if (Number.isNaN(parsed)) return null;
  return mp.players.at(parsed);
}

function registerAdminCommands() {
  mp.events.addCommand('tp', (player, id) => {
    if (!hasLevel(player, 'tp')) return;
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    player.position = target.position;
    player.outputChatBox(`[Admin] Телепорт к ${target.name}`);
  });

  mp.events.addCommand('goto', (player, id) => {
    if (!hasLevel(player, 'goto')) return;
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    target.position = player.position;
    target.outputChatBox('[Admin] Вас телепортировали.');
  });

  mp.events.addCommand('kick', (player, params) => {
    if (!hasLevel(player, 'kick')) return;
    const [id, ...reasonParts] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    const reason = reasonParts.join(' ') || 'Kicked';
    target.kick(`Кик: ${reason}`);
  });

  mp.events.addCommand('ban', (player, params) => {
    if (!hasLevel(player, 'ban')) return;
    const [id, time, ...reasonParts] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    const reason = reasonParts.join(' ') || 'Banned';
    target.kick(`Бан (${time || 'навсегда'}): ${reason}`);
  });

  mp.events.addCommand('sethp', (player, params) => {
    if (!hasLevel(player, 'sethp')) return;
    const [id, hp] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    target.health = parseInt(hp, 10) || 100;
    target.outputChatBox(`[Admin] Ваше здоровье установлено на ${target.health}.`);
  });

  mp.events.addCommand('givemoney', (player, params) => {
    if (!hasLevel(player, 'givemoney')) return;
    const [id, amountRaw] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    const amount = parseInt(amountRaw, 10) || 0;
    target.data.character.cash = (target.data.character.cash || 0) + amount;
    target.outputChatBox(`[Admin] Вам выдали $${amount}.`);
    playerService.updateHud(target, target.data.character);
  });
}

module.exports = {
  registerAdminCommands,
};
