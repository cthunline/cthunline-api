# Cthunline API

* [Requirements](#requirements)
* [Configuration](#configuration)
* [Usage](#usage)

## Requirements

* NodeJS >= 16
* MySQL / MariaDB

## Configuration

* Create environment files
  * `.env` for running app (development or production)
  * `.env.test` for running tests (not required in production)
* Use `.env.sample` as an example
* Do not use the same database for running app and tests

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

# Character sheet JSON schemas are automaticly generated with this tool:
# https://github.com/YousefED/typescript-json-schema
typescript-json-schema src/games/[game]/types.ts [type] -o src/games/[game]/schema.json --noExtraProps
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
