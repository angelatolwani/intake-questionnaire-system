# Intake Questionnaire System

A web application that allows users to answer questions and administrators to view all the answers provided by users.

## Features

### User Interface

1. **Login Page**
   - Simple username/password login
   - Navigation to questionnaire selection (users) or admin panel (admins)

2. **Questionnaire Selection Page**
   - List of available questionnaires
   - Click to start completing a questionnaire

3. **Questionnaire Page**
   - Interactive question rendering
   - Input validation (no empty/whitespace answers)
   - Pre-population of previously answered questions
   - Support for "Select all that apply" questions

4. **Admin Panel**
   - Table view of users and completed questionnaires
   - Detailed modal view of user responses
   - Q&A format display

## Technical Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: FastAPI with SQLAlchemy
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **Deployment**: Render (Full Stack)

## Development Setup

1. Install dependencies:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && pip install -r requirements.txt
   ```

2. Set up environment variables:
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

3. Run development servers:
   ```bash
   # Frontend
   cd frontend && npm run dev

   # Backend
   cd backend && uvicorn app.main:app --reload
   ```

## Deployment

### Deploying to Render

1. Push your code to GitHub

2. Visit [Render](https://render.com) and sign up/login

3. Click on "New +" and select "Blueprint"

4. Connect your GitHub repository

5. Render will automatically:
   - Create a PostgreSQL database
   - Deploy the backend service
   - Deploy the frontend service
   - Set up environment variables

6. Your application will be available at:
   - Frontend: https://questionnaire-frontend.onrender.com
   - Backend: https://questionnaire-backend.onrender.com
   - API Docs: https://questionnaire-backend.onrender.com/docs

### Post-Deployment

1. The first build might take a few minutes

2. You can monitor the deployment status in the Render dashboard

3. Database migrations will run automatically during deployment

4. You can view logs and metrics in the Render dashboard

## Security Notes

- JWT is used for authentication
- Passwords are hashed using bcrypt
- CORS is configured for security
- Environment variables are used for sensitive data

## Database Migrations

To run database migrations locally:
```bash
cd backend
alembic upgrade head
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
