# NestJS Authentication

![Workflow Test](https://github.com/anilahir/nestjs-authentication-and-authorization/actions/workflows/ci.yml/badge.svg)
![Prettier](https://img.shields.io/badge/Code%20style-prettier-informational?logo=prettier&logoColor=white)
[![GPL v3 License](https://img.shields.io/badge/License-GPLv3-green.svg)](./LICENSE)
[![HitCount](https://hits.dwyl.com/anilahir/nestjs-authentication-and-authorization.svg)](https://hits.dwyl.com/anilahir/nestjs-authentication-and-authorization)

## Description

NestJS Authentication without Passport using Bcrypt, JWT and Redis

## Features

1. Register
2. Login
3. Show profile
4. Logout

## Technologies stack:

- JWT
- Bcrypt
- TypeORM + MySQL
- Redis
- MEXC API INTEGRATION

## Setup

### 1. Install the required dependencies

```bash
$ npm install
```

### 2. Rename the .env.example filename to .env and set your local variables

```bash
$ mv .env.example .env
```

### 3. Start the application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Swagger documentation

- [localhost:8443/docs](http://localhost:8443/docs)
