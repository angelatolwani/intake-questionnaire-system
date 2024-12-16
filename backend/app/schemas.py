from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class QuestionnaireBase(BaseModel):
    name: str

class Questionnaire(QuestionnaireBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    type: str
    options: List[str] = []
    question: str

class Question(QuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QuestionJunctionBase(BaseModel):
    questionnaire_id: int
    question_id: int
    priority: int

class QuestionJunction(QuestionJunctionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnswerBase(BaseModel):
    question_id: int
    value: List[str]

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: str
    response_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ResponseBase(BaseModel):
    questionnaire_id: int
    answers: List[AnswerCreate]

class ResponseCreate(ResponseBase):
    pass

class Response(ResponseBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    answers: List[Answer] = []

    class Config:
        from_attributes = True

class QuestionnaireWithQuestions(Questionnaire):
    questions: List[Question]

    class Config:
        from_attributes = True
