# 🚀 Rover-Drone API

[![CI](https://github.com/marcceljanara/rover-drone-api/actions/workflows/ci.yml/badge.svg)](https://github.com/marcceljanara/rover-drone-api/actions/workflows/ci.yml)
[![Build Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/marcceljanara/rover-drone-api)  
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

Backend API to support the **Rover Drone** system with IoT device rental, MQTT control, rental management, dispatching, and reporting.

## 🧩 Main Features

### Authentication and Authorization
- Login/logout.
- Access token update via refresh token.
- Login & Register using Google OAuth2.0

### Users
- New user registration.
- OTP verification.  
- Resend the OTP code.  
- User address management (CRUD + default).

### Admin
- Create new user by admin.  
- List all users.  
- Details, change password, and delete users.

### Devices
- Add, view, and change device details (admin).
- Control devices (user/admin) via endpoint control.
- Configure MQTT topics for control/sensors.
- Get sensor data (interval/limit/download).
- Monitor daily usage (total hours).

### Rental & Extensions
- Rental submission by users.
- Rental status management by admin.
- Rental cancellation by users.
- Rental extension submission and management.

### Payments
- Payment list and details.
- Payment verification.
- Soft delete payments.

### Reports
- Create transaction reports per date range.
- Report list and details.
- Download PDF reports.
- Delete reports.

### Shipments & Returns
- Shipment details and list.
- Update shipping info/status.
- Confirm actual shipping/delivery.
- Upload and retrieve proof of delivery.
- Return management: address, status, notes.

### Sensors & Shipping
- List of available sensors.
- Calculate shipping costs to destination (integrated with Komerce).

### Chat Bot
- An interactive chatbot that can discuss the needs of oil palm plantations
- AI analysis based on air temperature, air humidity and sunlight intensity sensor data within a selected time range.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL  
- **Authentication:** JWT (access + refresh token)  
- **Message Broker:** RabbitMQ  
- **Device Control:** MQTT  
- **Reporting:** PDFKit, json2csv  
- **Linting:** ESLint (Airbnb)  
- **Testing:** Jest, Supertest  
- **API Docs:** Swagger (swagger-jsdoc + swagger-ui-express)

## ⚙️ Prerequisite

- Node.js (>=18)
- PostgreSQL
- RabbitMQ
- MQTT broker
- (Optional) SMTP server for email
- `git` for repository cloning
- Redis
- Docker and Docker Compose

## Docker Production Runbook

This repository includes a production-oriented Docker Compose setup for a small VPS, including an API container, a background worker, PostgreSQL, Redis, RabbitMQ, and Mosquitto MQTT.

### Container layout

| Service | Purpose | Public port |
|----------------|------------------------------------------------|-------------|
| `app` | Express HTTP API only | `5000` |
| `worker` | MQTT sensor subscriber and cron jobs | none |
| `migrate` | One-shot database migration job | none |
| `seed-admin` | One-shot default admin seed job | none |
| `db` | PostgreSQL data store | none |
| `redis` | Cache/session support | none |
| `rabbitmq` | Internal message broker | none |
| `mqtt` | Mosquitto broker for devices | `1883` |

PostgreSQL, Redis, and RabbitMQ are only reachable inside the Docker network. Only the API and MQTT broker are published to the host.

### 1. Prepare environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

For Docker, these values must use service hostnames:

```bash
HOST=0.0.0.0
PORT=5000

PGHOST=db
PGPORT=5432

REDIS_URL=redis://redis:6379
RABBITMQ_SERVER=amqp://rabbitmq:5672
MQTT_URL=mqtt://mqtt:1883
```

Do not commit `.env`. Rotate production secrets if a local `.env` has ever been shared or logged.

### 2. Build and pull images

```bash
docker compose build app worker migrate seed-admin
docker compose pull db redis rabbitmq mqtt
```

### 3. Start infrastructure services

```bash
docker compose up -d db redis rabbitmq mqtt
docker compose ps
```

Wait until `db`, `redis`, `rabbitmq`, and `mqtt` show `healthy`.

### 4. Run migration and seed jobs

```bash
docker compose run --rm migrate
docker compose run --rm seed-admin
```

Both commands must exit successfully before starting the API.

### 5. Start API and worker

```bash
docker compose up -d app worker
docker compose ps
```

Smoke test:

```bash
curl http://localhost:5000/v1/api-docs
```

### 6. Operational commands

Check logs:

```bash
docker compose logs -f app worker
docker compose logs --tail=100 db redis rabbitmq mqtt
```

Check resource usage:

```bash
docker stats rover_app rover_worker rover_db rover_redis rover_rabbitmq rover_mqtt
```

Stop containers without deleting data:

```bash
docker compose down
```

Delete containers and all persistent data:

```bash
docker compose down -v
```

Use `down -v` only when you intentionally want a fresh database, Redis data, RabbitMQ data, and Mosquitto data.

### Existing PostgreSQL volume notes

If an old PostgreSQL volume already exists, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are not re-applied automatically by the image. In that case, either keep the old credentials in `.env`, migrate the data manually, or recreate the volume with `docker compose down -v`.

The Compose file uses `postgres:17` instead of `postgres:17-alpine` because switching an existing PostgreSQL data volume between Debian-based and Alpine-based images can cause collation/template compatibility issues.

## 📥 Installation

1. Clone repository  
   ```bash
   git clone https://github.com/marcceljanara/rover-drone-api-v2.git
   cd rover-drone-api-v2
2. Install dependencies
   ```bash
   npm install
3. Create a .env file by copying .env.example (or manually entering it) and filling in the variables. A minimal example:
   ```bash
   PORT=5000
   HOST=localhost
  
   PGUSER=postgres
   PGPASSWORD=your_db_password
   PGDATABASE=roverdrone
   PGHOST=localhost
   PGPORT=5432
  
   SMTP_HOST=smtp.hostinger.com
   SMTP_EMAIL=no-reply@xsmartagrichain.com
   SMTP_PASSWORD=your_smtp_password
   SMTP_USER=no-reply
   TEST_EMAIL=youremail@gmail.com
  
   REFRESH_TOKEN_KEY=some_random_secret
   ACCESS_TOKEN_KEY=another_random_secret
   ACCESS_TOKEN_AGE=1800
  
   RABBITMQ_SERVER=amqp://localhost
  
   MQTT_URL=mqtt://your-broker
   MQTT_USERNAME=your_user
   MQTT_PASSWORD=your_pass
  
   ENABLE_SWAGGER=true
   BASE_URL=http://localhost:5000
  
   KOMERCE_BASE_URL=https://api-sandbox.collaborator.komerce.id/tariff/api/v1
   KOMERCE_API_KEY=your_komerce_key
   # OAUTH 2.0
   GOOGLE_CLIENT_ID = 271xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET = GOCxxx-xxxxx
   # REDIS 
   REDIS_URL=localhost
4. Run database migration
   ```bash
   npm run migrate
5. (Optional) Create a default admin
   ```bash
   npm run generate-admin
6. Run the server
   ```bash
   npm run start:dev
   
## ▶️ Available Scripts

| Script | Description |
|--------------------|----------------------------------------------------------------|
| `npm run start` | Start the production server |
| `npm run start:dev` | Start the development server with nodemon |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode + coverage |
| `npm run test:export` | Run tests and export results to JSON |
| `npm run lint` | Check styles with ESLint |
| `npm run lint-fix` | Automatically fix styles |
| `npm run migrate` | Database migration (default environment) |
| `npm run migrate:test` | Database migration for the test environment |
| `npm run clean-table` | Utility to clean a specific table |

## 📦 API Usage Examples

### Login
```bash
curl -X POST http://localhost:5000/v1/authentications \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

### User Registration
```bash
curl -X POST http://localhost:5000/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"secret", "username":"newuser", "fullname": "New User"}'
```

## 📚 API Documentation

Swagger UI is available (if ENABLE_SWAGGER=true) in:
```bash
http://localhost:5000/v1/api-docs/#/
```
(Or the path as configured in src — check the implementation of swagger setup.)

## 🤝 Contributions
Contributions are welcome.

1. Fork the repository

2. Create a feature branch: `git checkout -b feature/your-feature`

3. Commit changes: `git commit -m "Description"`

4. Push: `git push origin feature/your-feature`

5. Open a Pull Request

## 📫 Contact
Created by: I Nengah Marccel JBC
- Repo: https://github.com/marcceljanara/rover-drone-api-v2
- Issues: https://github.com/marcceljanara/rover-drone-api-v2/issues



