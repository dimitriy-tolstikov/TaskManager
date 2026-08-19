# План разработки Task Manager

Статус: v1.0 — стек согласован, готово к разработке

Основание: `docs/requirements.md` (v1.0), стек — вариант A из `docs/stack-options.md`.

## 1. Архитектура

```
┌─────────────────────────────────────────────────┐
│ docker-compose                                  │
│                                                 │
│  ┌──────────────┐   ┌──────────────┐            │
│  │ app (Next.js)│   │ worker (Node)│            │
│  │ UI + API     │   │ планировщик  │            │
│  └──────┬───────┘   └──────┬───────┘            │
│         │                  │                    │
│         └────────┬─────────┘                    │
│          ┌───────▼────────┐                     │
│          │  PostgreSQL    │                     │
│          └────────────────┘                     │
└─────────────────────────────────────────────────┘
         ▲
   браузер (+ service worker для Web Push)
```

- **app** — Next.js (App Router, TypeScript): страницы (React Server Components + клиентские компоненты), API в route handlers (`app/api/...`). Бизнес-логика вынесена в слой сервисов (`lib/services/`), чтобы route handlers оставались тонкими.
- **worker** — отдельный Node-процесс: раз в минуту находит напоминания, которые пора отправить, и шлёт Web Push; помечает отправленные. Тот же код доступа к БД (общий пакет Prisma).
- **БД** — PostgreSQL 16, доступ через Prisma (миграции в репозитории).
- **Service worker** — минимальный: только приём push и показ notification, без офлайн-кэша.

### Структура репозитория

```
TaskManager/
├── docker-compose.yml
├── docs/
├── app/                    # Next.js (роуты, страницы, API)
├── components/             # React-компоненты UI
├── lib/
│   ├── services/           # бизнес-логика (tasks, notifications, time)
│   ├── db.ts               # Prisma client
│   └── auth.ts             # сессии, хелперы
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── worker/
│   └── src/index.ts        # планировщик пушей
├── public/
│   └── sw.js               # service worker для Web Push
└── tests/
```

## 2. Модель данных (prisma schema, черновик)

- **User** — id, email (unique), passwordHash, name, theme, createdAt
- **Area** — id, userId, name, color, position («Работа А», «Учёба», ...)
- **Project** — id, areaId, name, archived
- **Task** — id, projectId, title, description, status (BACKLOG/TODO/IN_PROGRESS/DONE/CANCELLED), priority (LOW/MED/HIGH), dueAt (nullable), estimateMin (nullable), position, recurrenceId (nullable), createdAt, updatedAt, completedAt
- **Subtask** — id, taskId, title, done, position
- **Tag** — id, userId, name; **TaskTag** — связь m2m
- **RecurrenceRule** — id, rrule (строка RRULE: ежедневно/еженедельно/...), nextRunAt; задача-дочь создаётся worker'ом или при завершении предыдущей
- **Reminder** — id, taskId, offsetMin (за сколько до дедлайна), sentAt (nullable)
- **TimeEntry** — id, taskId, userId, startedAt, endedAt (nullable = таймер идёт), durationMin (для ручного ввода)
- **PushSubscription** — id, userId, endpoint (unique), keys (p256dh, auth), userAgent, createdAt

Индексы: `Task(projectId, status)`, `Task(dueAt)`, `TimeEntry(userId, startedAt)`, `Reminder(sentAt)` для выборки неотправленных.

## 3. Ключевые технические решения

| Вопрос | Решение |
|---|---|
| Auth | Собственная: email + пароль (bcrypt), сессия в httpOnly-cookie (JWT, 30 дней, sliding) |
| ORM / миграции | Prisma |
| UI-компоненты | Tailwind CSS + shadcn/ui (тёмная тема из коробки) |
| Drag & drop (канбан) | dnd-kit |
| Календарь | собственный простой грид месяц/неделя (задачи по dueAt) — внешний календарный движок избыточен |
| Графики отчётов | Recharts |
| Web Push | `web-push` (VAPID), подписка через Push API, SW в `public/sw.js` |
| Формы/валидация | react-hook-form + zod (zod-схемы общие для API и форм) |
| Тесты | Vitest (юнит сервисов) + Playwright (smoke e2e) |
| i18n | русские строки напрямую в MVP; вынос в словарь — при необходимости |

## 4. Итерации (MVP по вертикальным срезам)

Каждая итерация — работающее приложение, проверяемое вручную + тесты на новую логику.

**M0. Каркас (0.5–1 день)**
- Инициализация Next.js + Tailwind + shadcn, Prisma + PostgreSQL, docker-compose (app, worker, db)
- Auth: регистрация/вход/выход, middleware защиты роутов
- Покрывает: FR-0.1, FR-0.2

**M1. Ядро задач (2–3 дня)**
- CRUD направлений, проектов, задач, подзадач, тегов; quick add
- Список задач с фильтрами и поиском
- Покрывает: FR-1..FR-5, FR-7, FR-23

**M2. Канбан и «Сегодня» (1–2 дня)**
- Kanban-доска с dnd, смена статуса перетаскиванием
- Вид «Сегодня»: просроченные + сегодняшние по всем направлениям
- Покрывает: FR-6, FR-8, FR-10, FR-11, FR-15

**M3. Календарь и повторяющиеся задачи (1–2 дня)**
- Календарь неделя/месяц по dueAt
- RecurrenceRule + генерация следующих задач
- Покрывает: FR-4, FR-9, FR-12

**M4. Уведомления (2 дня)**
- Web Push: VAPID, подписка, service worker
- Worker-планировщик + Reminder (за N до дедлайна, несколько на задачу)
- Ежедневная сводка «план на день» (опционально, если останется время)
- Покрывает: FR-13, FR-14, (FR-16)

**M5. Таймеры и отчёты (2 дня)**
- Таймер start/stop (один активный), ручной ввод времени
- «Оценка vs факт», отчёт по времени по направлениям/проектам (Recharts + таблица)
- Покрывает: FR-17..FR-20

**M6. Полировка (1 день)**
- Тёмная/светлая тема, экспорт JSON/CSV, адаптивность, README, финальный прогон
- Покрывает: FR-21, FR-22, NFR-1..NFR-6

Ориентировочно: 8–12 рабочих дней суммарно.

## 5. Проверка качества (на каждой итерации)

- `npm run build` без ошибок, `tsc --noEmit` чистый
- Vitest — юнит-тесты сервисов (повторяющиеся задачи, напоминания, учёт времени)
- Playwright smoke: логин → создать задачу → перетащить в done
- Ручная проверка в браузере по чек-листу итерации

## 6. Риски и допущения

- Web Push локально работает только на `localhost` (или по HTTPS через reverse-proxy) — принимаем.
- Повторяющиеся задачи: используем формат RRULE (библиотека `rrule`), чтобы не писать свой парсер расписаний.
- Один активный таймер на пользователя — ограничение проверяется и на API, и в UI.
- Миграции Prisma применяются при старте app-контейнера (entrypoint `prisma migrate deploy`).
