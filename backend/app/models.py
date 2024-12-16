from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    responses = relationship("Response", back_populates="user")

class Questionnaire(Base):
    __tablename__ = "questionnaires"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    junctions = relationship("QuestionJunction", back_populates="questionnaire")
    responses = relationship("Response", back_populates="questionnaire")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    type = Column(String)  # mcq or input
    options = Column(JSON)  # JSON array for mcq type questions
    question = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    junctions = relationship("QuestionJunction", back_populates="question")
    answers = relationship("Answer", back_populates="question")

class QuestionJunction(Base):
    __tablename__ = "question_junctions"

    id = Column(Integer, primary_key=True)
    questionnaire_id = Column(Integer, ForeignKey("questionnaires.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    priority = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    questionnaire = relationship("Questionnaire", back_populates="junctions")
    question = relationship("Question", back_populates="junctions")

    __table_args__ = (UniqueConstraint('questionnaire_id', 'question_id'),)

class Response(Base):
    __tablename__ = "responses"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    questionnaire_id = Column(Integer, ForeignKey("questionnaires.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="responses")
    questionnaire = relationship("Questionnaire", back_populates="responses")
    answers = relationship("Answer", back_populates="response")

    __table_args__ = (UniqueConstraint('user_id', 'questionnaire_id'),)

class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True)
    response_id = Column(String, ForeignKey("responses.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    value = Column(JSON)  # JSON array for multiple selections
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    __table_args__ = (UniqueConstraint('response_id', 'question_id'),)
