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



