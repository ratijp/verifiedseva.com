# verifiedseva.com

A full-stack service marketplace for house-related work. This repository contains:

- `backend/`: Node.js + Express API with user registration, OTP validation, job posting, and hiring notifications.
- `mobile/`: Android-first React Native (Expo) mobile app.
- `web/`: Responsive React web application for desktop and mobile browsers.

## Next steps

1. Configure backend environment values in `backend/.env.example` and copy to `backend/.env`.
2. Install dependencies in each package:
   - `cd backend && npm install`
   - `cd mobile && npm install`
   - `cd mobile && npm install @react-native-async-storage/async-storage`
   - `cd web && npm install`
3. Start services:
   - `cd backend && npm run dev`
   - `cd mobile && npm start`
   - `cd web && npm run dev`

## Architecture

- Administrator, hirer, and worker users.
- Registration requires OTP validation via SMS/email.
- Users can post jobs and search/hire workers.
- Notifications are sent on registration and hiring.
- Mobile app is built with Expo for Android-first development.
- Web app is built with Vite + React for responsive browser access.
