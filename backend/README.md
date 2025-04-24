# Nirapod Backend

This folder will contain the Spring Boot backend for the Nirapod project.

- Source code will be placed in `src/main/java/`
- Configuration files in `src/main/resources/`

See the main project README for setup instructions.

Update the `application.properties` file with your database connection details. 

For OTP email functionality, configure your Gmail account credentials in `application.properties`. You must use a Google App Password (not your regular Gmail password). To generate an App Password, visit [Google App Password](https://myaccount.google.com/apppasswords) and follow the instructions. Copy the generated password and paste it into the `spring.mail.password` property in your `application.properties` file.