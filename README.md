# Intake Questionnaire System

A  web application that allows users to answer questionnaires and administrators to view and manage user responses. Built with Next.js, FastAPI, and Material UI for a clean, professional user experience.

Deployed on Render: [https://questionnaire-frontend.onrender.com/](https://questionnaire-frontend.onrender.com/)

### Test Accounts
```
Admin User:
Username: admin
Password: admin123

Regular User:
Username: user
Password: user123
```

## Features

### User Interface

1. **Landing Page**
   - Quick access to login via "Get Started" button

2. **Login Page**
   - Simple username/password authentication
   - Automatic redirection based on user role (admin/user)
   - Secure session management with JWT

3. **Questionnaire Selection Page**
   - List of available questionnaires
   - Ability to retake questionnaires (keeps latest response)

4. **Questionnaire Page**
   - Support for multiple question types:
     - Multiple choice (radio buttons)
     - Multiple choice (checkboxes)
     - Text input fields
   - Input validation
   - Back navigation to questionnaire list

5. **Admin Panel**
   - Comprehensive view of user responses
   - Table view of users and their response counts
   - Detailed modal view of individual responses
   - Q&A format display

## Technical Stack

- **Frontend**: 
  - React / Next.js with TypeScript
  - Material UI for components and styling

- **Backend**: 
  - FastAPI with SQLAlchemy
  - PostgreSQL database
  - JWT authentication

## Development Setup

1. Install dependencies:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && pip install -r requirements.txt
   ```

2. Run development servers:
   ```bash
   # Frontend
   cd frontend && npm run dev

   # Backend
   cd backend && uvicorn app.main:app --reload
   ```

## User Guide

### Regular Users
1. Click "Get Started" on the landing page
2. Log in with your credentials
3. View available questionnaires
4. Complete questionnaires or update previous responses
5. Use the logout button when finished

### Administrators
1. Log in with admin credentials
2. View the admin dashboard
3. See all user responses in the table
4. Click on a user to view their detailed responses
5. Use the logout button when finished


