# Шаги разработки

## Задание - **API перевода ребёнка между спортивными центрами**

Стек: Node.js, TypeScript, Prisma, PostgreSQL

Реализуй POST /api/appeals/[id]/transfer.

Обращение (CHANGE_PROVIDER) содержит в поле message структурированный блок:

- Email ваучера:            <parent@example.com>
- ID текущего поставщика:   <uuid>
- ID желаемого поставщика:  <uuid>
- Текущий вид спорта:       Футбол
- Желаемый вид спорта:      Баскетбол

Роут должен:

- Распарсить блок, найти оба центра в БД
- Найти программу у желаемого центра с доступным местом (enrollments < capacity)
- Для каждого ребёнка из appeal.children найти его APPROVED enrollment и перенести на - новый центр/программу (status → PENDING)
- Если все переведены — закрыть обращение (RESOLVED)
- Вернуть { success, allTransferred, results[] } — по ребёнку отдельно

*Ошибки на каждого ребёнка обрабатывать независимо (один упал — остальные продолжают).*

## Схема БД

model Appeal {
  id       String        @id
  category String
  status   String
  message  String
  children AppealChild[]
}

model AppealChild {
  id        String @id
  appealId  String
  childIin  String
  childName String
}

model Enrollment {
  id               String @id
  athleteProfileId String
  sportsCenterId   String
  programId        String
  status           String
  program          SportsCenterProgram @relation(...)
  parent           User @relation(...)
}

model SportsCenterProgram {
  id             String @id
  sportsCenterId String
  sportType      String
  capacity       Int
  enrollments    Enrollment[]
}

model AthleteProfile {
  id  String @id
  iin String @unique
}

---

## Процесс разработки

Пишу на "type": "module"
Добавлю зод для схемы
Node HTTP = /api/appeals/:id/transfer

### Структура проекта

```bash
.
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ config/
│  │  └─ env.ts
│  ├─ lib/
│  │  └─ prisma.ts
│  ├─ modules/
│  │  └─ appeals/
│  │     ├─ transfer.controller.ts
│  │     ├─ transfer.service.ts
│  │     ├─ transfer.parser.ts
│  │     ├─ transfer.schema.ts
│  │     └─ transfer.types.ts
│  └─ shared/
│     └─ errors.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ tests/
│  ├─ appeals.transfer.e2e.test.ts
│  └─ setup/
│     └─ env.ts
├─ tsconfig.json
├─ tsconfig.build.json
├─ vitest.config.ts
├─ .env.example
├─ .env.test.example
└─ package.json

```

### Modules

@prisma/client@7.4.2
pg@8.19.0
zod@4.3.6
typescript@5.9.3
prisma@7.4.2
@prisma/adapter-pg
tsx@4.21.0
vitest@4.0.18
@vitest/coverage-v8@4.0.18
supertest@7.2.2
@types/supertest@7.2.0
@types/node@25.3.3

### БД

Через PgAdmin:

- пользователь - sport_admin
- db - abai_transition

В схеме призмы parent User @relation(...) -> parent String, связи между таблицами
также базовый файл для работы с PrismaClient lib/prisma.ts

### .env

- DATABASE_URL = postgres://user:pass@localhost:5432/db
- Port = 3000

### Тестирование

Для удобства разработки сделаю небольшой файл теста (vitest (supertest)) с описанными требованиями в ТЗ:

- transferMessage как в задании
- Вариант переноса всех детей
- Вариант переноса, где 1 "падает"
- Вариант отмены переноса из-за недоступности места

### Написание сервера

Описание скилета server.ts/app.ts
/health и 404 для тестов
типы для значений и объектов JsonValue/JsonObject
запуск сервера на http://localhost:${port}

### Генерация и пред тесты

npx prisma validate
npx prisma generate
npm run typecheck
npm run test

`ожидаемо ошибки`

- Генерация небольшого seed.ts для "ручных" тестов (3-5 на таблицу)
- Небольшой стандартный AppError над Error (400, 404, 409, 500)
- Небольшой zod envSchema для .env
- Сидинг в базу данных
- Описание цепочки transfer service и controller:
  - файл с типами из БД + TransferErrorCode
  - файл zod схема для парсинга сообщения (из тз)
  - сам парсер отдельно (pick - регулярка построчная х: текст + ошибка)
  - service - transferAppealService:
    - проверки на наличие категории и данных в обращении из ТЗ
    - нахождение нужной программы + проверка свободного места (или 409)
    - нахождение ребёнка (по отдельности) + проверка текущего зачисления (или ATHLETE_NOT_FOUND / ENROLLMENT_NOT_FOUND)
    - перезапись каждого ребёнка в новую программу (статус enrollment - PENDING), при ошибках каждый отдельно
    - по окончании если переведены все - статус перевода меняется на RESOLVED
    - возвращает успех
  - controller - схема + ошибки + ответ при успехе transferAppealService
- запуск тестов, фикс ошибок
  - падение из-за zod схемы (eng + валидные id)

### Readme.md и гит

Описал README + .gitignore заполнил базово
Создал репозиторий на github
git add/commit/push
