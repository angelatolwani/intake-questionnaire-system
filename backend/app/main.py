from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import timedelta, datetime
import logging
from . import models, schemas, auth
from .database import engine, SessionLocal
from .import_data import import_data
import sqlalchemy as sa
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Intake Questionnaire System")

# CORS middleware
origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://questionnaire-frontend.onrender.com",
    "https://questionnaire-frontend-l0bs.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {request.headers}")
    
    response = await call_next(request)
    
    logger.info(f"Response status: {response.status_code}")
    logger.info(f"Response headers: {dict(response.headers)}")
    return response

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/db-test")
async def test_db(db: Session = Depends(auth.get_db)):
    try:
        # Try to query users table
        users = db.query(models.User).all()
        
        # Check alembic_version table
        inspector = sa.inspect(engine)
        tables = inspector.get_table_names()
        
        # Check if alembic_version exists and get current version
        current_version = None
        if 'alembic_version' in tables:
            result = db.execute(sa.text('SELECT version_num FROM alembic_version')).first()
            current_version = result[0] if result else None
        
        return {
            "status": "success",
            "database_tables": tables,
            "alembic_version": current_version,
            "user_count": len(users),
            "users": [{"username": user.username, "is_admin": user.is_admin} for user in users]
        }
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/test-db")
async def test_db(db: Session = Depends(auth.get_db)):
    try:
        # Try to execute a simple query
        result = db.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Database connection successful"}
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.options("/token")
async def token_preflight():
    return {}

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(auth.get_db)
):
    logger.info("Login attempt for user: %s", form_data.username)
    try:
        user = auth.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.error("Invalid credentials for user: %s", form_data.username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        logger.info("Login successful for user: %s", form_data.username)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error("Login error for user %s: %s", form_data.username, str(e))
        raise

# User endpoints
@app.post("/users/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(auth.get_db)
):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        id=str(uuid.uuid4()),
        username=user.username,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.options("/users/me")
@app.options("/users/me/")
async def users_me_preflight():
    return {}

@app.get("/users/me")
@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": current_user.is_admin
    }

# Questionnaire endpoints
@app.get("/questionnaires/", response_model=List[schemas.Questionnaire])
async def list_questionnaires(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return db.query(models.Questionnaire).all()

@app.get("/questionnaires/{questionnaire_id}", response_model=schemas.QuestionnaireWithQuestions)
async def get_questionnaire(
    questionnaire_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    questionnaire = db.query(models.Questionnaire).filter(models.Questionnaire.id == questionnaire_id).first()
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    
    # Get questions ordered by priority
    questions = []
    junctions = (
        db.query(models.QuestionJunction)
        .filter(models.QuestionJunction.questionnaire_id == questionnaire_id)
        .order_by(models.QuestionJunction.priority)
        .all()
    )
    
    for junction in junctions:
        questions.append(junction.question)
    
    return {
        **questionnaire.__dict__,
        "questions": questions
    }

# Response endpoints
@app.post("/responses/", response_model=schemas.Response)
async def create_response(
    response: schemas.ResponseCreate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    logger.info(f"Creating response for user {current_user.id} questionnaire {response.questionnaire_id}")
    logger.info(f"Answers: {response.answers}")
    
    try:
        # Validate that all questions exist
        for answer in response.answers:
            question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
            if not question:
                raise HTTPException(status_code=400, detail=f"Question {answer.question_id} not found")
            logger.info(f"Question {answer.question_id} exists, type: {question.type}, value: {answer.value}")

        # Check if user has already submitted a response for this questionnaire
        existing_response = db.query(models.Response).filter(
            models.Response.user_id == current_user.id,
            models.Response.questionnaire_id == response.questionnaire_id
        ).first()

        if existing_response:
            logger.info(f"Found existing response {existing_response.id}, deleting it")
            # Delete existing response and its answers
            db.query(models.Answer).filter(models.Answer.response_id == existing_response.id).delete()
            db.delete(existing_response)
            db.commit()

        # Create new response
        db_response = models.Response(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            questionnaire_id=response.questionnaire_id
        )
        db.add(db_response)
        db.commit()  # Commit to get the response ID
        
        logger.info(f"Created new response {db_response.id}")
        
        # Create answers
        for answer_data in response.answers:
            logger.info(f"Creating answer for question {answer_data.question_id}")
            logger.info(f"Answer value type: {type(answer_data.value)}")
            logger.info(f"Answer value: {answer_data.value}")
            
            answer = models.Answer(
                id=str(uuid.uuid4()),
                response_id=db_response.id,
                question_id=answer_data.question_id,
                value=answer_data.value
            )
            db.add(answer)
        
        db.commit()
        db.refresh(db_response)
        return db_response
        
    except Exception as e:
        logger.error(f"Error creating response: {str(e)}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints
@app.get("/admin/responses/", response_model=List[schemas.Response])
async def list_all_responses(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Response).all()

@app.get("/admin/users/{user_id}/responses", response_model=List[schemas.Response])
async def get_user_responses(
    user_id: str,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Response).filter(models.Response.user_id == user_id).all()

@app.get("/admin/user-responses")
async def get_user_responses(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all non-admin users and their response counts
    user_responses = db.query(
        models.User.username,
        sa.func.count(models.Response.id).label('response_count')
    ).outerjoin(
        models.Response
    ).filter(
        models.User.is_admin == False  # Only get non-admin users
    ).group_by(
        models.User.username
    ).all()
    
    return [{"username": username, "response_count": count} for username, count in user_responses]

@app.get("/admin/user-responses/{username}")
async def get_user_response_details(
    username: str,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get user's responses with questionnaire details
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    responses = db.query(
        models.Response,
        models.Questionnaire.name.label('questionnaire_name')
    ).join(
        models.Questionnaire
    ).filter(
        models.Response.user_id == user.id
    ).all()
    
    result = []
    for response, questionnaire_name in responses:
        # Get answers with questions
        answers = db.query(
            models.Answer,
            models.Question
        ).join(
            models.Question
        ).filter(
            models.Answer.response_id == response.id
        ).order_by(
            models.Question.id
        ).all()
        
        formatted_answers = []
        for answer, question in answers:
            formatted_answers.append({
                "question": question.question,
                "answer": answer.value
            })
        
        result.append({
            "username": username,
            "questionnaire_name": questionnaire_name,
            "answers": formatted_answers
        })
    
    return result

# Data import endpoint (admin only)
@app.post("/admin/import-data")
async def import_csv_data(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        import_data()
        return {"message": "Data imported successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-test-users")
async def create_test_users(db: Session = Depends(auth.get_db)):
    try:
        # Check if users already exist
        if db.query(models.User).count() > 0:
            return {"status": "error", "message": "Users already exist"}
        
        # Create test users
        users = [
            models.User(
                id=str(uuid.uuid4()),
                username="admin",
                password=auth.get_password_hash("admin123"),
                is_admin=True
            ),
            models.User(
                id=str(uuid.uuid4()),
                username="user",
                password=auth.get_password_hash("user123"),
                is_admin=False
            )
        ]
        
        # Add users to database
        for user in users:
            db.add(user)
        db.commit()
        
        return {
            "status": "success",
            "message": "Test users created",
            "users": [{"username": user.username, "is_admin": user.is_admin} for user in users]
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating test users: {str(e)}")
        return {"status": "error", "message": str(e)}
