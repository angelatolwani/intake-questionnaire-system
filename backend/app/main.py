from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import timedelta
import logging
from . import models, schemas, auth
from .database import engine, SessionLocal
from .import_data import import_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Intake Questionnaire System")

# CORS middleware
origins = [
    "http://localhost:3000",
    "https://questionnaire-frontend.onrender.com"
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

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return current_user

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
    # Create response
    db_response = models.Response(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        questionnaire_id=response.questionnaire_id
    )
    db.add(db_response)
    
    # Create answers
    for answer_data in response.answers:
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
