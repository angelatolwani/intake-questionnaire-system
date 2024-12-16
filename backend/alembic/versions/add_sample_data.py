"""add sample data

Revision ID: add_sample_data
Revises: remove_timestamps
Create Date: 2024-12-16 05:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
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


def upgrade() -> None:
    logger.info("Starting sample data migration")
    
    # Ensure tables exist
    logger.info("Ensuring tables exist")
    op.execute("""
        CREATE TABLE IF NOT EXISTS questionnaires (
            id INTEGER PRIMARY KEY,
            name VARCHAR NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """)
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            type VARCHAR NOT NULL,
            options JSON,
            question VARCHAR NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """)
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS question_junctions (
            id INTEGER PRIMARY KEY,
            questionnaire_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            priority INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE,
            FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (id),
            FOREIGN KEY (question_id) REFERENCES questions (id),
            UNIQUE (questionnaire_id, question_id)
        )
    """)
    
    # Define tables for data insertion
    questionnaires = table('questionnaires',
        column('id', sa.Integer),
        column('name', sa.String),
        column('created_at', sa.DateTime(timezone=True)),
        column('updated_at', sa.DateTime(timezone=True))
    )
    
    questions = table('questions',
        column('id', sa.Integer),
        column('type', sa.String),
        column('options', sa.JSON),
        column('question', sa.String),
        column('created_at', sa.DateTime(timezone=True)),
        column('updated_at', sa.DateTime(timezone=True))
    )
    
    question_junctions = table('question_junctions',
        column('id', sa.Integer),
        column('questionnaire_id', sa.Integer),
        column('question_id', sa.Integer),
        column('priority', sa.Integer),
        column('created_at', sa.DateTime(timezone=True)),
        column('updated_at', sa.DateTime(timezone=True))
    )
    
    # Load and insert questionnaires
    logger.info("Loading questionnaires from CSV")
    questionnaire_data = load_csv_data('questionnaire_questionnaires.csv')
    op.bulk_insert(questionnaires, [
        {
            'id': int(q['id']),
            'name': q['name'],
            'created_at': sa.func.now(),
            'updated_at': None
        }
        for q in questionnaire_data
    ])
    
    # Load and insert questions
    logger.info("Loading questions from CSV")
    question_data = load_csv_data('questionnaire_questions.csv')
    for q in question_data:
        q_data = json.loads(q['question'])
        op.bulk_insert(questions, [{
            'id': int(q['id']),
            'type': q_data['type'],
            'options': q_data.get('options', []),
            'question': q_data['question'],
            'created_at': sa.func.now(),
            'updated_at': None
        }])
    
    # Load and insert question junctions
    logger.info("Loading question junctions from CSV")
    junction_data = load_csv_data('questionnaire_junction.csv')
    op.bulk_insert(question_junctions, [
        {
            'id': int(j['id']),
            'questionnaire_id': int(j['questionnaire_id']),
            'question_id': int(j['question_id']),
            'priority': int(j['priority']),
            'created_at': sa.func.now(),
            'updated_at': None
        }
        for j in junction_data
    ])
    
    logger.info("Sample data migration completed")


def downgrade() -> None:
    # Remove all sample data
    op.execute('DELETE FROM question_junctions')
    op.execute('DELETE FROM questions')
    op.execute('DELETE FROM questionnaires')
