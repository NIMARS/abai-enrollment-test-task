# abai-enrollment-test-task

API на Node.js + TypeScript + Prisma + PostgreSQL для обработки перевода детей между спортивными центрами.

## Стек

- Node.js (ESM)
- TypeScript
- Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)
- PostgreSQL
- Zod
- Vitest + Supertest

## Эндпоинт

- `POST /api/appeals/:id/transfer`
- `GET /health`

`transfer`:

- читает `Appeal` категории `CHANGE_PROVIDER`
- парсит структурированный `message`
- ищет программу целевого центра с доступным местом
- по каждому ребенку пытается перенести `APPROVED` enrollment на новый центр/программу со статусом `PENDING`
- если все дети успешно перенесены -> `Appeal.status = RESOLVED`
- возвращает `{ success, allTransferred, results[] }`

## Быстрый старт

1. Установить зависимости:

    ```bash
    npm install
    ```

2. Создать `.env` по примеру `.env.example`.

3. Сгенерировать prisma client:

    ```bash
    npm run prisma:generate
    ```

4. Применить миграции:

    ```bash
    npm run prisma:migrate
    ```

5. Наполнить БД тестовыми данными:

    ```bash
    npm run db:seed
    ```

6. Запустить проект:

    ```bash
    npm run dev
    ```

## Основные скрипты

- `npm run dev` - запуск в watch-режиме
- `npm run build` - сборка TypeScript в `dist`
- `npm run start` - запуск собранного приложения
- `npm run typecheck` - проверка типов
- `npm run test` - запуск тестов
- `npm run prisma:generate` - генерация Prisma Client
- `npm run prisma:migrate` - dev-миграция
- `npm run prisma:deploy` - применение миграций в окружении deploy
- `npm run db:seed` - сидинг
- `npm run db:reset` - reset БД (локально)
- `npm run db:setup` - generate + migrate + seed

## Тестирование

```bash
npm run test
```

Интеграционные тесты находятся в `tests/appeals.transfer.e2e.test.ts`.

## Переменные окружения

Минимально нужны:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/db
PORT=3000
NODE_ENV=development
```
