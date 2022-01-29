# Cthunline v2

* [Configuration](#configuration)
* [Usage](#usage)

## Configuration

* Create environment files
  * `.env` for running app (development or production)
  * `.env.test` for running tests (not required in production)
* Use `.env.sample` as an example
* Do not use the same database for running app and tests

## Usage

### Development

```shell
npm install
npm run dev
```

### Production

```shell
npm install --only=prod
npm run build
npm run prod
```

### Linters

```shell
npm run lint
```

### Tests

```shell
npm run test
```

### Prisma

> For development

```shell
# generates prisma models
npx prisma generate
# pushes schema changes to database
npx prisma db push
```
