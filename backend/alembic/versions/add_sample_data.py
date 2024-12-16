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
down_revision: str = 'remove_timestamps'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def load_csv_data(filename: str) -> list:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    filepath = os.path.join(project_root, 'data', filename)
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        return list(reader)


def upgrade() -> None:
    logger.info("Starting sample data migration")
    
    # Define tables
    questionnaires = table('questionnaires',
        column('id', sa.Integer),
        column('name', sa.String)
    )
    
    questions = table('questions',
        column('id', sa.Integer),
        column('type', sa.String),
        column('options', sa.JSON),
        column('question', sa.String)
    )
    
    question_junctions = table('question_junctions',
        column('id', sa.Integer),
        column('questionnaire_id', sa.Integer),
        column('question_id', sa.Integer),
        column('priority', sa.Integer)
    )
    
    # Load and insert questionnaires
    logger.info("Loading questionnaires from CSV")
    questionnaire_data = load_csv_data('questionnaire_questionnaires.csv')
    op.bulk_insert(questionnaires, [
        {
            'id': int(q['id']),
            'name': q['name']
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
            'options': q_data['options'],
            'question': q_data['question']
        }])
    
    # Load and insert question junctions
    logger.info("Loading question junctions from CSV")
    junction_data = load_csv_data('questionnaire_junction.csv')
    op.bulk_insert(question_junctions, [
        {
            'id': int(j['id']),
            'questionnaire_id': int(j['questionnaire_id']),
            'question_id': int(j['question_id']),
            'priority': int(j['priority'])
        }
        for j in junction_data
    ])
    
    logger.info("Sample data migration completed")


def downgrade() -> None:
    # Remove all sample data
    op.execute('DELETE FROM question_junctions')
    op.execute('DELETE FROM questions')
    op.execute('DELETE FROM questionnaires')
