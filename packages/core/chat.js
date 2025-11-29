const LOCAL_RADIUS = 20;

function nameOf(player) {
  return player.name || `ID:${player.id}`;
}

function sendInRange(player, text, radius = LOCAL_RADIUS) {
  mp.players.forEachInRange(player.position, radius, player.dimension, (nearby) => {
    nearby.outputChatBox(text);
  });
}

function handleLocalChat(player, message) {
  if (!message || message.startsWith('/')) return false;
  sendInRange(player, `${nameOf(player)}: ${message}`);
  return true;
}

function registerChatHandlers() {
  mp.events.add('playerChat', (player, message) => {
    if (message.startsWith('//')) {
      const text = message.slice(2).trim();
      mp.players.broadcast(`!{#5bc0de}(( ${nameOf(player)}: ${text} ))`);
      return;
    }
    handleLocalChat(player, message);
  });

  mp.events.addCommand('me', (player, fullText) => {
    sendInRange(player, `!{#c08aff}* ${nameOf(player)} ${fullText}`);
  });

  mp.events.addCommand('do', (player, fullText) => {
    sendInRange(player, `!{#e0d449}* ${fullText} (${nameOf(player)})`);
  });

  mp.events.addCommand('ooc', (player, fullText) => {
    mp.players.broadcast(`!{#5bc0de}(( ${nameOf(player)}: ${fullText} ))`);
  });
}

module.exports = {
  registerChatHandlers,
};
