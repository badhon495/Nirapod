# Nirapod Project

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
3. Start the frontend:
   ```bash
   npm start
   ```
4. The frontend will run on `http://localhost:3000` by default.

---

## Database Setup

1. Ensure PostgreSQL is running and accessible with the credentials in `db_creation.sh`.
2. Run the script:
   ```bash
   bash db_creation.sh
   ```

---

## Notes
- Update backend `application.properties` for DB credentials if needed.
- File uploads will be stored in the backend (see backend config for details).
- For production, configure environment variables and secure credentials.
