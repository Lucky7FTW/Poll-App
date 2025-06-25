# PollVote 📊

[![Deployment Status](https://img.shields.io/badge/deployment-active-brightgreen)](https://pollvote-app.vercel.app)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFA000)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6)](https://www.typescriptlang.org/)

---

## 🔍 Overview

PollVote is a modern, intuitive polling application developed with Angular and Firebase as part of the NTT DATA Tech Trek program. This powerful platform enables users to create, share, and analyze polls with real‑time results visualization, providing valuable insights through an elegant and responsive interface.

---

## 🔄 Fork & Clone — Bring PollVote into **your** GitHub account

> **Quick TL;DR**
>
> 1. Click **Fork** at the top‑right of the [original repo](https://github.com/Lucky7FTW/Poll-App)
> 2. Clone *your fork*:
>
>    ```bash
>    git clone https://github.com/<your‑github‑username>/Poll-App.git
>    cd Poll-App
>    ```
> 3. Keep the original repo handy for future pulls:
>
>    ```bash
>    git remote add upstream https://github.com/Lucky7FTW/Poll-App.git
>    ```
> 4. Work locally → `git push origin <branch>` to publish changes to *your* repo.
>
> ✨  Now you can open PRs back to the upstream project or keep PollVote fully detached in your own space.

### Why fork first?

Forking gives you full write access to your own copy while preserving an easy path to pull improvements from the original team.

If you **don’t** need that upstream link (e.g. you’re starting a proprietary variant), you can also duplicate without the “fork” badge:

```bash
# One‑liner mirror copy (keeps history, strips fork banner)
# Replace NEW_URL with the empty GitHub repo you just created

git clone --mirror https://github.com/Lucky7FTW/Poll-App.git  poll-app-mirror
cd poll-app-mirror
git remote set-url origin <NEW_URL>
git push --mirror
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v20.0 or higher)
* Angular CLI (v19.0 or higher)
* npm (v10.0 or higher)
* Firebase account

### 1️⃣ Clone your fork (or the repo you mirrored)

```bash
git clone https://github.com/<your‑github‑username>/Poll-App.git
cd Poll-App
```

> If you used the **mirror** method, substitute the URL of that new repo instead.

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure Firebase

Create a file **`src/environments/environment.ts`** (or use your favourite secrets manager) with:

```ts
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

> **Never** commit environment files to version control.

### 4️⃣ Run the dev server

```bash
ng serve
```

Navigate to **[http://localhost:4200](http://localhost:4200)** — PollVote will hot‑reload on file changes.

---

## ✨ Features

* **Instant Poll Creation** – Create custom polls with multiple options in seconds
* **Real‑time Results** – Watch votes update instantly with Firebase integration
* **Responsive Design** – Seamless experience on desktop, tablet, and mobile
* **Secure Authentication** – Email/password & social logins
* **Advanced Analytics** – Interactive charts and graphs
* **Customizable Polls** – Multiple question types, themes, branding
* **Easy Sharing** – Direct links
* **Vote Verification** – Prevent duplicate voting
---

## 🏗️ Architecture

The application follows a modular architecture:

| Layer               | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| **Core Module**     | Authentication, guards, base services                              |
| **Shared Module**   | Reusable components, directives, pipes                             |
| **Feature Modules** | Poll Creation, Poll Voting, Results Visualization, User Management |
| **State**           | Reactive with RxJS & Firebase observables                          |

### Tech Stack

* **Frontend** – Angular 19 + TypeScript
* **Backend** – Firebase (Authentication, Firestore, Storage)
* **Styling** – Custom CSS, responsive design
* **Charts** – Chart.js for results visualisation
* **CI/CD** – GitHub Actions → Vercel

---

## 👥 Team

| Name                | Responsibility                            |
| ------------------- | ----------------------------------------- |
| **Gengiu Robert**   | Frontend Architect & UI/UX Designer       |
| **Maxim Francesco** | Firebase Integration & Data Visualisation |
| **Tibrea Mihai**    | Authentication & Security Specialist      |

---

## 🌟 Key Differentiators

* **Lightning‑Fast** lazy‑loaded Angular modules
* **Intuitive UX** for poll creators and voters alike
* **Live Collaboration** – everyone sees updates in real time
* **Deep Analytics** via rich charting dashboards
* **Robust Security** & WCAG‑compliant accessibility

---

## 📱 Mobile Experience

* Responsive layouts for any screen
* Touch‑optimised components
* Offline voting support
* PWA install prompts for iOS/Android

---

## 🔒 Security Measures

* Secure Firebase Auth flow
* Client & server‑side data validation
* Rate limiting & spam protection
* TLS in transit, encryption at rest
* Granular Firestore rules

---

## 📝 License

This project was developed during the TechTrek program at NTT DATA. All rights reserved.

© 2025 NTT DATA | Developed by Gengiu Robert, Maxim Francesco, and Tibrea Mihai
