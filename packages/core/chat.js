const LOCAL_RADIUS = 25;

function nameOf(player) {
  return player.name || `ID:${player.id}`;
}

function pushMessage(target, type, text) {
  target.call('ui:chat:push', [type, text]);
}

function sendInRange(player, text, type = 'ic', radius = LOCAL_RADIUS) {
  mp.players.forEachInRange(player.position, radius, player.dimension, (nearby) => {
    pushMessage(nearby, type, text);
  });
}

function handleLocalChat(player, message) {
  if (!message || message.startsWith('/')) return false;
  sendInRange(player, `${nameOf(player)}: ${message}`, 'ic');
  return true;
}

function registerChatHandlers() {
  mp.events.add('playerChat', (player, message) => {
    if (message.startsWith('//')) {
      const text = message.slice(2).trim();
      mp.players.forEach((p) => pushMessage(p, 'ooc', `(( ${nameOf(player)}: ${text} ))`));
      return;
    }
    handleLocalChat(player, message);
  });

  mp.events.addCommand('me', (player, fullText) => {
    sendInRange(player, `* ${nameOf(player)} ${fullText}`, 'me');
  });

  mp.events.addCommand('do', (player, fullText) => {
    sendInRange(player, `* ${fullText} (${nameOf(player)})`, 'do');
  });

  mp.events.addCommand('ooc', (player, fullText) => {
    mp.players.forEach((p) => pushMessage(p, 'ooc', `(( ${nameOf(player)}: ${fullText} ))`));
  });
}

module.exports = {
  registerChatHandlers,
};
