# Task Manager

Веб-приложение для учёта задач по нескольким направлениям жизни (работы, учёба, поиск работы).
Стек: Next.js (App Router, TypeScript) + Tailwind + shadcn/ui + Prisma + PostgreSQL.

Документация: `docs/requirements.md`, `docs/plan.md`, `docs/code-style.md`.

## Требования

- Node.js 20+
- Docker + Docker Compose (для PostgreSQL и полного запуска)

## Быстрый старт (разработка)

```bash
# 1. Поднять PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 2. Установить зависимости и подготовить .env
npm install
cp .env.example .env   # задайте SESSION_SECRET (openssl rand -base64 32)

# 3. Применить миграции и заполнить демо-данными
npm run db:migrate
npm run db:seed        # demo@example.com / demo12345

# 4. Запустить приложение
npm run dev            # http://localhost:3000
```

Worker (планировщик уведомлений) в режиме разработки: `npm run worker`.

## Полный запуск через Docker

```bash
cp .env.example .env   # задайте SESSION_SECRET
docker compose up --build
```

Приложение: http://localhost:3000. Миграции применяются автоматически при старте app-контейнера.

## npm-скрипты

| Скрипт                            | Назначение                                  |
| --------------------------------- | ------------------------------------------- |
| `npm run dev`                     | dev-сервер Next.js                          |
| `npm run build` / `start`         | production-сборка / запуск                  |
| `npm run lint`                    | ESLint                                      |
| `npm run format` / `format:check` | Prettier                                    |
| `npm run typecheck`               | `tsc --noEmit` (app + worker)               |
| `npm test` / `test:watch`         | Vitest (юнит-тесты сервисов)                |
| `npm run test:e2e`                | Playwright smoke (поднимает dev-сервер сам) |
| `npm run worker`                  | worker-планировщик (tsx watch)              |
| `npm run db:migrate`              | `prisma migrate dev`                        |
| `npm run db:deploy`               | `prisma migrate deploy`                     |
| `npm run db:seed`                 | демо-данные                                 |

## Тесты

- **Vitest** (`tests/unit/`): юнит-тесты сервисов. Prisma мокируется через `vi.mock("@/lib/db")`,
  поэтому база для юнит-тестов не нужна.
- **Playwright** (`tests/e2e/`): один smoke-тест (страница логина рендерится). Конфиг сам поднимает
  dev-сервер (`webServer` в `playwright.config.ts`); БД для него не нужна. В CI не запускается.

## Качество кода

- pre-commit (Husky + lint-staged): ESLint + Prettier на изменённые файлы, `tsc --noEmit`.
- commitlint: Conventional Commits (`feat:`, `fix:`, `chore:`, ...).
- Лимиты размеров из `docs/code-style.md` закреплены как ошибки ESLint.
- CI: `.github/workflows/ci.yml` — lint, typecheck, test, build.
