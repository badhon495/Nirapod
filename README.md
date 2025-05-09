# Nirapod Project
This is a full-stack web application built with Spring Boot for the backend and React for the frontend. The application includes features such as user authentication, file uploads, live location sharing and a live chat system. User can complain to the privileged person and the privileged person takes action on the complaint.

## Project Structure

- backend/  (Spring Boot backend)
- frontend/ (React frontend)
- db_creation.sh (Postgres DB setup)

---

## Backend Setup (Spring Boot)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Build the project (requires Java 17+ and Maven):
   ```bash
   mvn clean install
   ```
3. Run the backend:
   ```bash
   mvn spring-boot:run
   ```
4. The backend will run on `http://localhost:8080` by default.

---

## Frontend Setup (React)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Map dependencies:
   ```bash
   npm install leaflet

   npm install leaflet-control-geocoder
   ```

4. Install Google auth dependencies:
   ```bash
   npm install @react-oauth/google
   ```

5. Start the frontend:
   ```bash
   npm start
   ```
6. The frontend will run on `http://localhost:3000` by default.

---

## Live Chat Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install the required package:
   ```bash
   - Install the required package:
     ```bash
     npm install ws
     ```
   - Start the live chat server:
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

---

## Notes
- Update backend `application.properties` for DB credentials if needed.
- File uploads will be stored in the backend (see backend config for details).
- For production, configure environment variables and secure credentials.
- Get the Google APP ID and APP SECRET from the Google Developer Console and set them in the frontend `.env` file and backend `application.properties`.
- For mail service, you can use any SMTP server. The example uses Gmail, but you can replace it with your own SMTP server details in the `application.properties` file.
- Ensure you have the required permissions for file uploads and location sharing in your browser settings.
