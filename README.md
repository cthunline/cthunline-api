# Cthunline API

> Cthunline API (REST + WebSockets) made with Express, Prisma, Socket.io and more

- [Useful resources](#useful-resources)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Usage](#usage)

## Useful resources

- [Official documentation](https://doc.cthunline.org/)
- [Docker repository](https://hub.docker.com/r/cthunline/cthunline)
- [Games NPM package](https://www.npmjs.com/package/@cthunline/games)

## Requirements

- NodeJS >= 16
- MySQL / MariaDB

## Configuration

- Create environment files
  - `.env` for running app (development or production)
  - `.env.test` for running tests (not required in production)
- Use `.env.sample` as an example
- Do not use the same database for running app and tests!

## Usage

### Development

```shell
# Install dependencies
npm install
# Run app in development mode
npm run dev

# Run linters
npm run lint
# Run tests
npm run test

# Generate Prisma models
npx prisma generate
# Push Prisma schema to database
npx prisma db push
# When modifying the database structure it is necessary to create Prisma migrations
npx prisma migrate dev --name <name_of_the_migration>
```

### Production

```shell
# Install production dependencies
npm install --only=prod
# Build project
npm run build
# Run app in production mode
npm run prod
```
