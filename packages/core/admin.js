const playerService = require('./player');

const commandLevels = {
  tp: 1,
  goto: 1,
  kick: 2,
  ban: 3,
  sethp: 4,
  givemoney: 4,
  freeze: 3,
};

function hasLevel(player, cmd, overrideLevel) {
  const need = overrideLevel || commandLevels[cmd] || 0;
  const current = player.data.adminLevel || 0;
  if (current < need) {
    player.outputChatBox('!{#ff5c5c}[Admin] Недостаточно прав.');
    return false;
  }
  return true;
}

function logAction(admin, action, target, extra) {
  const targetLabel = target ? `${target.name || 'ID:' + target.id}(${target.id})` : '';
  console.log(`[admin] ${admin.name}(${admin.id}) ${action} ${targetLabel} ${extra || ''}`.trim());
}

function getPlayerById(id) {
  const parsed = parseInt(id, 10);
  if (Number.isNaN(parsed)) return null;
  return mp.players.at(parsed);
}

function doFreeze(target, enabled) {
  if (!target) return;
  target.freezePosition(enabled);
  target.data.frozen = enabled;
  target.outputChatBox(`!{#5bc0de}[Admin] Вы ${enabled ? 'заморожены' : 'разморожены'}.`);
}

function buildPlayerList() {
  return mp.players.toArray().map((p) => ({
    id: p.id,
    name: p.name || `ID:${p.id}`,
    ping: p.ping,
    admin: p.data.adminLevel || 0,
  }));
}

function sendPlayerList(player) {
  player.call('admin:players', [JSON.stringify(buildPlayerList())]);
}

function handleAction(player, action, targetId, payload) {
  const target = getPlayerById(targetId);
  if (!target) {
    player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    return;
  }

  switch (action) {
    case 'tp_to':
      player.position = target.position;
      logAction(player, 'tp to', target);
      break;
    case 'tp_here':
      target.position = player.position;
      target.outputChatBox('[Admin] Вас телепортировали.');
      logAction(player, 'tp here', target);
      break;
    case 'kick':
      target.kick(`Кик: ${payload || 'Kick'}`);
      logAction(player, `kick ${payload || ''}`, target);
      break;
    case 'ban':
      target.kick(`Бан: ${payload || 'ban'}`);
      logAction(player, `ban ${payload || ''}`, target);
      break;
    case 'givemoney': {
      const amount = parseInt(payload, 10) || 0;
      target.data.character.cash = (target.data.character.cash || 0) + amount;
      playerService.updateHud(target, target.data.character);
      target.outputChatBox(`[Admin] Вам выдали $${amount}.`);
      logAction(player, `givemoney ${amount}`, target);
      break;
    }
    case 'sethp': {
      const hp = parseInt(payload, 10) || 100;
      target.health = hp;
      logAction(player, `sethp ${hp}`, target);
      break;
    }
    case 'setarmor': {
      const arm = parseInt(payload, 10) || 0;
      target.armour = arm;
      logAction(player, `setarmor ${arm}`, target);
      break;
    }
    case 'freeze':
      doFreeze(target, true);
      logAction(player, 'freeze', target);
      break;
    case 'unfreeze':
      doFreeze(target, false);
      logAction(player, 'unfreeze', target);
      break;
    default:
      player.outputChatBox('!{#ff5c5c}[Admin] Неизвестное действие.');
      break;
  }
}

function registerAdminCommands() {
  mp.events.addCommand('tp', (player, id) => {
    if (!hasLevel(player, 'tp')) return;
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    player.position = target.position;
    logAction(player, 'tp command', target);
  });

  mp.events.addCommand('goto', (player, id) => {
    if (!hasLevel(player, 'goto')) return;
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    target.position = player.position;
    logAction(player, 'goto command', target);
  });

  mp.events.addCommand('kick', (player, params) => {
    if (!hasLevel(player, 'kick')) return;
    const [id, ...reasonParts] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    const reason = reasonParts.join(' ') || 'Kicked';
    target.kick(`Кик: ${reason}`);
    logAction(player, `kick ${reason}`, target);
  });

  mp.events.addCommand('ban', (player, params) => {
    if (!hasLevel(player, 'ban')) return;
    const [id, time, ...reasonParts] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    const reason = reasonParts.join(' ') || 'Banned';
    target.kick(`Бан (${time || 'навсегда'}): ${reason}`);
    logAction(player, `ban ${reason} time=${time || 'perm'}`, target);
  });

  mp.events.addCommand('sethp', (player, params) => {
    if (!hasLevel(player, 'sethp')) return;
    const [id, hp] = (params || '').split(' ');
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    target.health = parseInt(hp, 10) || 100;
    logAction(player, `sethp ${target.health}`, target);
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
    logAction(player, `givemoney ${amount}`, target);
  });

  mp.events.addCommand('freeze', (player, id) => {
    if (!hasLevel(player, 'freeze', 3)) return;
    const target = getPlayerById(id);
    if (!target) return player.outputChatBox('!{#ff5c5c}[Admin] Игрок не найден.');
    doFreeze(target, true);
    logAction(player, 'freeze command', target);
  });

  mp.events.add('admin:openRequest', (player) => {
    if (!hasLevel(player, '', 3)) return;
    player.call('admin:open');
    sendPlayerList(player);
  });

  mp.events.add('admin:getPlayers', (player) => {
    if (!hasLevel(player, '', 3)) return;
    sendPlayerList(player);
  });

  mp.events.add('admin:doAction', (player, action, targetId, payload) => {
    if (!hasLevel(player, '', 3)) return;
    handleAction(player, action, targetId, payload);
    sendPlayerList(player);
  });
}

module.exports = {
  registerAdminCommands,
};
