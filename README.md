# MoodFoodAI

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Endpoints](#endpoints)

## Prerequisites

- Java 11 or higher
- Maven 3.6.3 or higher
- npm (for the frontend)
- Firebase account and project setup

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Tiskeris/MoodFoodAI
   cd moodmealai
   ```

2. Set up Firebase:
   - Create a Firebase project.
   - Enable Firebase Authentication.
   - Download the `google-services.json` file and place it in the `src/main/resources` directory.

3. Install backend dependencies:
   ```sh
   mvn clean install
   ```

4. Install frontend dependencies:
   ```sh
   cd frontend
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```sh
   mvn spring-boot:run
   ```

2. Start the frontend server:
   ```sh
   cd frontend
   npm start
   ```

## Running Tests

To run the tests, use the following command:
```sh
mvn test
```

## Project Structure

```plaintext
moodmealai/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── org/moodmealai/moodmealai/
│   │   │       ├── AuthController.java
│   │   │       ├── AuthService.java
│   │   │       └── MoodMealAiApplication.java
│   │   └── resources/
│   │       └── application.properties
│   ├── test/
│   │   ├── java/
│   │   │   └── org/moodmealai/moodmealai/
│   │   │       ├── AuthControllerTests.java
│   │   │       ├── AuthServiceTests.java
│   │   │       └── MoodMealAiApplicationTests.java
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
├── pom.xml
└── README.md
```

## Endpoints

### Authentication

- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Login a user.
- `GET /auth/photo-url`: Get the photo URL of the authenticated user.
