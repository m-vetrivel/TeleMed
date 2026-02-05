# 🏥 TeleMed Connect

**TeleMed Connect** is a scalable, full-stack telemedicine platform designed to bridge the gap between healthcare providers and remote patients. It features a **Hybrid Database Architecture** for optimized data management and secure, real-time video consultations.

## 📑 Table of Contents
- [📖 Problem Statement](#-problem-statement)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏛️ System Architecture](#️-system-architecture)
- [🚀 Getting Started](#-getting-started)
- [🔮 Future Enhancements](#-future-enhancements)

---

## 📖 Problem Statement
Access to specialized healthcare in remote areas is often limited by travel distance, cost, and time. **TeleMed Connect** solves this by providing a secure, reliable digital platform for:
1.  **Remote Consultations:** Eliminating the need for physical travel for preliminary checkups and follow-ups.
2.  **Efficient Data Management:** Handling both structured transactional data and unstructured medical records seamlessly.

---

## ✨ Key Features

### 🔒 Core Functionality
* **Role-Based Access Control (RBAC):** Distinct, secure dashboards for **Doctors**, **Patients**, and **Admins**, powered by **Spring Security** and **JWT Authentication**.
* **Real-Time Video Consultations:** Low-latency video conferencing integrated via **WebRTC standards (Jitsi Meet API)**.
* **Smart Scheduling:** Dynamic appointment slot booking system that prevents double-booking and manages doctor availability.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.0 |
| **Frontend** | React.js, Tailwind CSS |
| **Database** | PostgreSQL (Relational), MongoDB (Document) |
| **Security** | Spring Security, JWT (JSON Web Tokens) |
| **Real-Time** | Jitsi Meet API (WebRTC), WebSocket |
| **DevOps** | Docker, Maven, Git |

---

## 🏛️ System Architecture

The application follows a modular architecture:

1.  **Client Layer:** React.js Single Page Application (SPA).
2.  **Security Layer:** Spring Security Filter Chain intercepting requests for JWT validation.
3.  **Service Layer:** Business logic handling appointments, prescription generation, and notifications.
4.  **Data Persistence Layer:**
    * `PostgreSQL` ↔ Transactional Data
    * `MongoDB` ↔ Medical Documents

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
* Java Development Kit (JDK) 17+
* Node.js (v16+)
* PostgreSQL & MongoDB (Running locally or via Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/m-vetrivel/TeleMed
cd TeleMed
```

## 2. Backend Setup

Navigate to the backend folder and configure your database in  
`src/main/resources/application.properties`:

```properties
# PostgreSQL Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/telemed_db
spring.datasource.username=postgres
spring.datasource.password=your_password

# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/telemed_docs

# JWT Secret
app.jwtSecret=YourSecretKeyHere
```

Run the Spring Boot application:
```bash
cd backend
mvn spring-boot:run
```

## 3. Frontend Setup
Navigate to the frontend folder and install dependencies:
```bash
cd ../frontend
npm install
npm start
```
The application will launch at http://localhost:5173.


## Future Enhancements
[ ] AI Symptom Checker: Integration of an NLP-based chatbot for preliminary diagnosis.

[ ] Payment Gateway: Razorpay/Stripe integration for consultation fees.

[ ] Mobile Application: Native Android/iOS app using Flutter.
