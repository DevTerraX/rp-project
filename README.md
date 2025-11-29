# Rage:MP RP Framework (Stage 1)

Минимальный RP-фреймворк для RAGE:MP с аккаунтами, персонажами, чатом, базовой админкой и HUD.

## Структура
- `packages/index.js` — точка входа, регистрирует модули.
- `packages/core/db.js` — подключение к MySQL и создание таблиц `accounts`, `characters`.
- `packages/core/account.js` — регистрация, вход, создание персонажа.
- `packages/core/player.js` — загрузка/сохранение персонажа, спавн, смерть/респавн, HUD.
- `packages/core/chat.js` — локальный чат + /me, /do, /ooc, //.
- `packages/core/admin.js` — команды /tp, /goto, /kick, /ban, /givemoney, /sethp с уровнями 1–5.
- `packages/ui/auth.html`, `packages/ui/register.html` — CEF формы входа/регистрации/создания персонажа.
- `client_packages/ui/auth.js` — клиент: открытие CEF, HUD отрисовка, навигация форм.
- `client_packages/ui/auth.css` — стили CEF.
- `conf.json` — конфиг сервера + блок `db`.

## Настройка
1. Установите зависимости в папку `packages` (NodeJS режим):  
   ```bash
   cd packages && npm install mysql2 bcryptjs
   ```
2. Заполните `conf.json` в корне:
   ```json
   "db": {
     "host": "127.0.0.1",
     "user": "root",
     "password": "",
     "database": "rage_rp"
   }
   ```
3. Запустите сервер, убедитесь что `enable-nodejs: true` и `gamemode: "packages/index.js"` указаны в конфиге.

## Схема БД (MySQL)
```sql
CREATE TABLE IF NOT EXISTS accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(32) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  reg_ip VARCHAR(32),
  last_ip VARCHAR(32),
  last_login TIMESTAMP NULL,
  admin_level INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS characters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT NOT NULL,
  name VARCHAR(32) NOT NULL,
  cash INT DEFAULT 0,
  bank INT DEFAULT 0,
  pos_x FLOAT DEFAULT 0,
  pos_y FLOAT DEFAULT 0,
  pos_z FLOAT DEFAULT 0,
  dimension INT DEFAULT 0,
  health INT DEFAULT 100,
  armor INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
```

## Поток игрока
- При входе показывается CEF окно: логин или переход к регистрации.
- Регистрация сразу создаёт персонажа (Имя + Фамилия), выдаёт $5000, спавнит в точке `-1038.73, -2737.94, 20.17`.
- При отсутствии персонажа после логина сервер отправит форму создания персонажа.
- Автосохранение каждые 30 секунд и при выходе: позиция, деньги, здоровье, броня, измерение.
- Смерть: 15 секунд лежит, затем респавн в больнице `355.1, -596.2, 28.77`, штраф `$250` (если есть).

## Чат и команды
- Локальный чат (20м): `Имя Фамилия: текст`.
- `/me` (сиреневый), `/do` (жёлтый), `/ooc` или `//` (голубой).
- Подсказки/ошибки отправляются через `outputChatBox` и `ui:auth:error`.

## Админ-уровни
- 1: `/tp [id]`, `/goto [id]`
- 2: `/kick [id] [причина]`
- 3: `/ban [id] [время] [причина]` (минимальная реализация — кик с причиной)
- 4: `/givemoney [id] [сумма]`, `/sethp [id] [hp]`
- 5: полный доступ (все команды)

## HUD
- Правый верх: деньги, банк, здоровье, броня.
- Левый верх: имя персонажа и уровень админа (если >0).
