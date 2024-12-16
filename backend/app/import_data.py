import pandas as pd
import json
import uuid
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal, engine

def import_data():
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(models.Answer).delete()
        db.query(models.Response).delete()
        db.query(models.QuestionJunction).delete()
        db.query(models.Question).delete()
        db.query(models.Questionnaire).delete()
        db.query(models.User).delete()
        
        # Import questionnaires
        questionnaires_df = pd.read_csv('../data/questionnaire_questionnaires.csv')
        for _, row in questionnaires_df.iterrows():
            questionnaire = models.Questionnaire(
                id=row['id'],
                name=row['name']
            )
            db.add(questionnaire)
        
        # Import questions
        questions_df = pd.read_csv('../data/questionnaire_questions.csv')
        for _, row in questions_df.iterrows():
            question_data = json.loads(row['question'])
            question = models.Question(
                id=row['id'],
                type=question_data['type'],
                options=question_data.get('options', []),
                question=question_data['question']
            )
            db.add(question)
        
        # Import junctions
        junctions_df = pd.read_csv('../data/questionnaire_junction.csv')
        for _, row in junctions_df.iterrows():
            junction = models.QuestionJunction(
                id=row['id'],
                question_id=row['question_id'],
                questionnaire_id=row['questionnaire_id'],
                priority=row['priority']
            )
            db.add(junction)
        
        # Create admin user
        admin = models.User(
            id=str(uuid.uuid4()),
            username='admin',
            password='admin123',  # In production, this should be hashed
            is_admin=True
        )
        db.add(admin)
        
        db.commit()
        print("Data import completed successfully")
        
    except Exception as e:
        print(f"Error importing data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
