FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY nirapod-core/pom.xml nirapod-core/
COPY nirapod-api/pom.xml nirapod-api/
RUN mvn dependency:go-offline -q
COPY nirapod-core/src nirapod-core/src
COPY nirapod-api/src nirapod-api/src
RUN mvn package -pl nirapod-api -am -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S nirapod && adduser -S nirapod -G nirapod
COPY --from=builder /app/nirapod-api/target/*.jar app.jar
USER nirapod
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
