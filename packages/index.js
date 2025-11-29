const path = require('path');
const db = require('./core/db');
const account = require('./core/account');
const player = require('./core/player');
const chat = require('./core/chat');
const admin = require('./core/admin');

// Entry point for server packages
function bootstrap() {
  db.init().catch((err) => {
    console.error('[db] init failed', err);
  });

  account.registerAuthHandlers();
  player.registerPlayerHandlers();
  chat.registerChatHandlers();
  admin.registerAdminCommands();

  console.log('RP framework loaded from', path.basename(__dirname));
}

bootstrap();
