<div align="center">

# Nirapod

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?style=flat-square&logo=spring-boot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-316192?style=flat-square&logo=postgresql)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=flat-square&logo=apache-maven)

This is a full-stack web application built with Spring Boot for the backend and React for the frontend. The application includes features such as user authentication, file uploads, live location sharing and a live chat system. User can complain to the privileged person and the privileged person takes action on the complaint.



</div>

## Project Structure

- backend/  (Spring Boot backend)
- frontend/ (React frontend)
- db_creation.sh (Postgres DB setup)


## Backend Setup (Spring Boot)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Copy the example environment file:
   ```bash
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   ```
3. Edit `application.properties` to set your database, email, and Google credentials.
4. Build the project (requires Java 17+ and Maven):
   ```bash
   mvn clean install
   ```
5. Run the backend:
   ```bash
   mvn spring-boot:run
   ```
6. The backend will run on `http://localhost:8080` by default.


## Frontend Setup (React)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file to set your environment variables.
4. Start the frontend (dependencies are already installed from root):
   ```bash
   npm start
   ```
5. The frontend will run on `http://localhost:3000` by default.

---

## Live Chat Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Start the live chat server (ws package is already installed from root):
   ```bash
   node livechat-server.js
   ```

---

## Database Setup

1. Ensure PostgreSQL is running and accessible with the credentials in `db_creation.sh`.
2. Run the script:
   ```bash
   ./db_creation.sh
   ```

---

## Environment Configuration

To set up your environment variables and configuration files:

1. **Backend application.properties**
   - Copy the example file to create your actual config:
     ```bash
     cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
     ```
   - Edit `application.properties` and fill in your real database, email, and Google credentials.

2. **Backend .env file**
   - Copy the example file to create your actual .env:
     ```bash
     cp frontend/.env.example frontend/.env
     ```
   - Edit `.env` and fill in your real secrets and environment variables.


## Notes
- Update backend `application.properties` for DB credentials if needed.
- File uploads will be stored in the backend (see backend config for details).
- For production, configure environment variables and secure credentials.
- Get the Google APP ID and APP SECRET from the Google Developer Console and set them in the frontend `.env` file and backend `application.properties`.
- For mail service, you can use any SMTP server. The example uses Gmail, but you can replace it with your own SMTP server details in the `application.properties` file.
- Ensure you have the required permissions for file uploads and location sharing in your browser settings.
