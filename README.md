<div align="center">

# Nirapod

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=flat-square&logo=spring-boot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

A Bangladesh-focused civic engagement platform where citizens report local issues to relevant authorities — police, fire service, city corporation, animal welfare. Authorities respond, update status, and communicate transparently with the public.

</div>

---

## Quick Start (Docker — Recommended)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose
- Your user must be in the `docker` group:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

### 1. Clone the repo

```bash
git clone https://github.com/badhon495/Nirapod.git
cd Nirapod
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```bash
# Generate these two secrets (run each command separately):
openssl rand -base64 32   # paste as JWT_SECRET
openssl rand -base64 32   # paste as AUTH_SECRET
```

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes | Min 32 chars — generate with `openssl rand -base64 32` |
| `AUTH_SECRET` | Yes | Min 32 chars — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Optional | Needed for Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | Optional | Needed for Google OAuth login |
| `MAIL_USERNAME` | Optional | Gmail address for OTP emails |
| `MAIL_PASSWORD` | Optional | Gmail [App Password](https://myaccount.google.com/apppasswords), not account password |
| `CLOUDINARY_*` | Optional | For photo uploads — get from [cloudinary.com/console](https://cloudinary.com/console) |

> Without optional vars, OAuth login and photo uploads won't work, but core complaint reporting still functions.

### 3. Build and run

```bash
docker compose up --build
```

First build takes ~3–5 minutes (Maven + npm). Subsequent starts are fast.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| API Docs (Swagger) | http://localhost:8080/swagger-ui.html |
| MinIO Console | http://localhost:9001 (user: `minioadmin` / pass: `minioadmin`) |

### 4. Stop

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers, delete all data (clean slate)
```

---

## Project Structure

```
Nirapod/
├── backend/                 # Spring Boot 3.5 (Java 21)
│   ├── nirapod-core/        # Shared models and repositories
│   ├── nirapod-api/         # REST API, services, controllers
│   └── Dockerfile
├── nirapod-web/             # Next.js 16 frontend
│   └── Dockerfile
├── docker-compose.yml       # Postgres + Redis + MinIO + backend + frontend
└── .env.example             # Environment variable template
```

---

## Local Development (Without Docker)

Use this when you want hot reload for active development.

### Step 1 — Start infrastructure only

```bash
docker compose up postgres redis minio
```

### Step 2 — Run the backend

Requires Java 21 and Maven.

```bash
cd backend
# Copy and edit the config
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Edit application.properties with your local DB/Redis/mail credentials

# Run
mvn spring-boot:run
```

Backend starts at http://localhost:8080

### Step 3 — Run the frontend

Requires Node.js 20+.

```bash
cd nirapod-web
npm install
npm run dev
```

Frontend starts at http://localhost:3000 with hot reload.

---

## Environment Notes

- Set `SPRING_PROFILES_ACTIVE=dev` in `.env` for local dev (less strict config validation)
- Google OAuth requires redirect URI `http://localhost:3000/api/auth/callback/google` registered in [Google Cloud Console](https://console.cloud.google.com/)
- MinIO acts as a local S3 replacement; Cloudinary is only needed for production deployments

---

## Contributing

Contributions are welcome! Please submit a Pull Request.

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
