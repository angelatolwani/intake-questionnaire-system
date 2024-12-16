"""add sample data

Revision ID: add_sample_data
Revises: remove_timestamps
Create Date: 2024-12-16 05:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
import logging
import uuid
import json
import csv
import os

# Configure logging
logger = logging.getLogger(__name__)

# revision identifiers, used by Alembic.
revision: str = 'add_sample_data'
down_revision: Union[str, None] = 'remove_timestamps'  # This ensures it runs after remove_timestamps
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = 'initial'  # This ensures initial migration runs first


def load_csv_data(filename: str) -> list:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    filepath = os.path.join(project_root, 'data', filename)
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        return list(reader)


def verify_table_structure(connection):
    # Check if questionnaires table exists and has the correct structure
    result = connection.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'questionnaires'
        ORDER BY column_name;
    """))
    columns = {row[0]: row[1] for row in result}
    logger.info(f"Found columns in questionnaires table: {columns}")
    
    if 'name' not in columns:
        # Drop all dependent tables first
        logger.info("Dropping existing tables")
        connection.execute(text("""
            DROP TABLE IF EXISTS responses CASCADE;
            DROP TABLE IF EXISTS questionnaire_questions CASCADE;
            DROP TABLE IF EXISTS question_junctions CASCADE;
            DROP TABLE IF EXISTS questions CASCADE;
            DROP TABLE IF EXISTS questionnaires CASCADE;
        """))
        
        # Create tables in correct order
        logger.info("Creating tables")
        connection.execute(text("""
            CREATE TABLE questionnaires (
                id INTEGER PRIMARY KEY,
                name VARCHAR NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE TABLE questions (
                id INTEGER PRIMARY KEY,
                type VARCHAR NOT NULL,
                options JSON,
                question VARCHAR NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE TABLE question_junctions (
                id INTEGER PRIMARY KEY,
                questionnaire_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                priority INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE,
                FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (id),
                FOREIGN KEY (question_id) REFERENCES questions (id),
                UNIQUE (questionnaire_id, question_id)
            );
        """))
        return True
    return True


def upgrade() -> None:
    logger.info("Starting sample data migration")
    
    connection = op.get_bind()
    
    # First verify and potentially fix table structure
    if not verify_table_structure(connection):
        raise Exception("Failed to verify or create table structure")
    
    # Load and insert questionnaires
    logger.info("Loading questionnaires from CSV")
    questionnaire_data = load_csv_data('questionnaire_questionnaires.csv')
    for q in questionnaire_data:
        connection.execute(
            text("INSERT INTO questionnaires (id, name) VALUES (:id, :name)"),
            {
                'id': int(q['id']),
                'name': q['name']
            }
        )
    
    # Load and insert questions
    logger.info("Loading questions from CSV")
    question_data = load_csv_data('questionnaire_questions.csv')
    for q in question_data:
        q_data = json.loads(q['question'])
        connection.execute(
            text("INSERT INTO questions (id, type, options, question) VALUES (:id, :type, :options, :question)"),
            {
                'id': int(q['id']),
                'type': q_data['type'],
                'options': json.dumps(q_data.get('options', [])),
                'question': q_data['question']
            }
        )
    
    # Load and insert question junctions
    logger.info("Loading question junctions from CSV")
    junction_data = load_csv_data('questionnaire_junction.csv')
    for j in junction_data:
        connection.execute(
            text("INSERT INTO question_junctions (id, questionnaire_id, question_id, priority) VALUES (:id, :questionnaire_id, :question_id, :priority)"),
            {
                'id': int(j['id']),
                'questionnaire_id': int(j['questionnaire_id']),
                'question_id': int(j['question_id']),
                'priority': int(j['priority'])
            }
        )
    
    logger.info("Sample data migration completed")


def downgrade() -> None:
    # Remove all sample data
    op.execute('DELETE FROM question_junctions')
    op.execute('DELETE FROM questions')
    op.execute('DELETE FROM questionnaires')
