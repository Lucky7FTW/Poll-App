# PollVote 📊

[![Deployment Status](https://img.shields.io/badge/deployment-active-brightgreen)](https://pollvote-app.vercel.app)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFA000)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6)](https://www.typescriptlang.org/)


## 🔍 Overview

PollVote is a modern, intuitive polling application developed with Angular and Firebase as part of the NTT DATA Tech Trek program. This powerful platform enables users to create, share, and analyze polls with real-time results visualization, providing valuable insights through an elegant and responsive interface.

## ✨ Features

* **Instant Poll Creation**: Create custom polls with multiple options in seconds
* **Real-time Results**: Watch votes come in and update instantly with Firebase integration
* **Responsive Design**: Perfect experience across all devices - desktop, tablet, and mobile
* **Secure Authentication**: User authentication with email/password and social login options
* **Advanced Analytics**: Comprehensive data visualization with interactive charts and graphs
* **Customizable Polls**: Multiple question types, custom themes, and branding options
* **Sharing Capabilities**: Easy sharing via direct links, QR codes, and social media integration
* **Vote Verification**: Prevent duplicate voting with various verification methods
* **Export Options**: Download results in multiple formats (PDF, CSV, Excel)

## 🚀 Getting Started

### Prerequisites

* Node.js (v20.0 or higher)
* Angular CLI (v19.0 or higher)
* npm (v10.0 or higher)
* Firebase account

## 🔥 Firebase Configuration

This project leverages Firebase's powerful real-time capabilities and requires proper configuration via environment variables.

### 📋 Prerequisites:

1. Create a Firebase account at [firebase.google.com](https://firebase.google.com/)
2. Set up a new Firebase project or use an existing one
3. Configure the following Firebase services:
   * Firebase Authentication
   * Cloud Firestore
   * Realtime Database
   * Firebase Storage
   * Firebase Hosting (for deployment)

> [!NOTE]
> Real-time functionality depends on proper Firebase configuration. All services must be correctly set up for optimal performance.

### 🔑 Getting your Firebase Configuration Keys:

1. Navigate to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to access Project settings
4. Under the "Your apps" section, select your web app (or create one by clicking the web icon </>)
5. Copy the Firebase configuration object containing your API keys and credentials

### 🛠️ Additional Firebase Setup:

1. **Authentication**: Enable Email/Password and Google authentication methods
2. **Firestore**: Create a database with the following collections:
   * `polls` - Store poll information
   * `votes` - Record user votes
   * `users` - User profiles and preferences
3. **Storage**: Configure storage for poll images and assets
4. **Security Rules**: Implement proper security rules to protect your data

> [!TIP]
> Use Firebase's development environment for testing to keep your production data clean.

## 💻 Installation

### Clone the repository:
```bash
git clone https://github.com/yourusername/pollvote.git
```

### Navigate to the project directory:
```bash
cd ./pollvote
```

### Install dependencies:
```bash
npm install
```

### Set up environment variables

Create a .env file in the root directory of the project with the following structure:

```javascript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-firebase-auth-domain',
    projectId: 'your-firebase-project-id',
    storageBucket: 'your-firebase-storage-bucket',
    messagingSenderId: 'your-firebase-messaging-sender-id',
    appId: 'your-firebase-app-id',
    measurementId: 'your-firebase-measurement-id'
  }
};
```

> [!CAUTION]
> Never commit your .env or environment.ts file to version control. These files contain sensitive API keys and credentials that should remain private.

### Start the development server

```bash
ng serve
```

> [!NOTE]
> Open your browser and navigate to http://localhost:4200

## 🏗️ Architecture
The application follows a modular architecture with:

- **Core Module**: Authentication, guards, and services
- **Shared Module**: Reusable components, directives, and pipes
- **Feature Modules**:

- Poll Creation
- Poll Voting
- Results Visualization
- User Management



- **State Management**: Reactive approach with RxJS and Firebase observables

### Tech Stack

- **Frontend**: Angular 19 with TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Custom CSS with responsive design
- **Visualization**: Chart.js for poll results
- **CI/CD**: GitHub Actions and Vercel

## 👥 Team

PollVote was developed by the following Tech Trek Angular team at NTT DATA:

| Name | Role
|-----|-----
| Gengiu Robert | Frontend Architect & UI/UX Designe
| Maxim Francesco | Firebase Integration & Data Visualization
| Tibrea Mihai | Authentication & Security Specialist

## 🌟 Key Differentiators

- **Lightning-Fast Performance**: Optimized Angular application with lazy-loading modules
- **Intuitive User Experience**: Thoughtfully designed interfaces for both poll creators and voters
- **Real-time Collaboration**: Multiple users can view results simultaneously with live updates
- **Advanced Analytics**: Gain insights through comprehensive data visualization
- **Robust Security**: Secure authentication and data protection measures
- **Accessibility**: WCAG compliant design ensuring everyone can participate


## 📱 Mobile Experience

PollVote is designed with a mobile-first approach, ensuring a seamless experience across all devices:

- Responsive layouts that adapt to any screen size
- Touch-optimized interfaces for easy interaction
- Offline capabilities for voting without constant connectivity
- Progressive Web App (PWA) features for installation on mobile devices


## 🔒 Security Measures

- **Authentication**: Secure user authentication through Firebase Auth
- **Data Validation**: Client and server-side validation to prevent malicious data
- **Rate Limiting**: Protection against spam and abuse
- **Data Encryption**: Sensitive information is encrypted in transit and at rest
- **Access Control**: Granular permissions system for poll management


## 📝 License

This project was developed during the TechTrek program at NTT DATA. All rights reserved.

© 2025 NTT DATA | Developed by Gengiu Robert, Maxim Francesco, and Tibrea Mihai