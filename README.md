Telegram бот для управления личными финансами (с сохранением данных в таблицах Google)
======================================================================================

[Пример табличного документа Google, с которой работает бот](https://docs.google.com/spreadsheets/d/1bBxMmE6QsDwIvi6w1erMpnU9-UjcUR75jgWXsYssUzE)

Запуск/разработка приложения
----------------------------

### 1. Установить NodeJs/NPM (проверено с версией ноды 15, NPM 7.23.x)

[NodeJs](https://nodejs.org/en/)

### 2. Выкачать код данного репозитория

```
git clone https://github.com/alelk/money-mgr-tg-bot
```

### 3. Подгрузить зависимости

в корне проекта выполнить:

```
npm install
```

### 4. Подготовить Google таблицу

- Скачать [данный шаблон Google документа](https://docs.google.com/spreadsheets/d/1bBxMmE6QsDwIvi6w1erMpnU9-UjcUR75jgWXsYssUzE)
- Загрузить его в собственное хранилище Google
- Создать сервис-аккаунт, создать в нем ключ, скачать Json этого ключа
- Поделиться Google документом с сервис-аккаунтом (предоставить права редактирования)
- изменить файл [services.ts](src/services.ts), подставив нужный ID google документа, например `1bBxMmE6QsDwIvi6w1erMpnU9-UjcUR75jgWXsYssUzE`

### 5. Установить переменные окружения:

- MONEY_MGR_EMAIL - email СЕРВИС-аккаунта, имеющего доступ к таблице Google
- MONEY_MGR_KEY - ключ сервис-аккаунта
- TG_BOT_TOKEN - токен бота

Пример переменных окружения:

```
export MONEY_MGR_EMAIL="money-mgr-tg-bot@money-mgr-34524365346.iam.gserviceaccount.com"

export MONEY_MGR_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0c5uIxX\nClt/xaziYpEwN3ojQ4dNA==\n-----END PRIVATE KEY-----\n"

export TG_BOT_TOKEN="1577224234:34645756fghd-345345346-dgh4645645"
```

### 6. Запустить приложение

```
npm start
```