"""initial migration

Revision ID: initial
Revises: 
Create Date: 2024-12-16 02:05:00.000000

"""
from typing import Sequence, Union
import uuid
import json
import csv
import os
import logging
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
import bcrypt

# Configure logging
logger = logging.getLogger(__name__)

# revision identifiers, used by Alembic.
revision: str = 'initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def hash_password(password: str) -> str:
    logger.info("Hashing password in migration")
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    logger.info("Password hashed successfully")
    return hashed


def load_csv_data(filename: str) -> list:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    filepath = os.path.join(project_root, 'data', filename)
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        return list(reader)


def upgrade() -> None:
    logger.info("Starting initial migration")
    
    # Drop all existing tables first
    logger.info("Dropping existing tables")
    op.execute('DROP TABLE IF EXISTS answers CASCADE')
    op.execute('DROP TABLE IF EXISTS responses CASCADE')
    op.execute('DROP TABLE IF EXISTS question_junctions CASCADE')
    op.execute('DROP TABLE IF EXISTS questions CASCADE')
    op.execute('DROP TABLE IF EXISTS questionnaires CASCADE')
    op.execute('DROP TABLE IF EXISTS users CASCADE')
    logger.info("Existing tables dropped")

    # Create users table
    logger.info("Creating users table")
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    logger.info("Users table created")

    # Insert initial users
    logger.info("Creating initial users")
    users_table = table('users',
        column('id', sa.String),
        column('username', sa.String),
        column('password', sa.String),
        column('is_admin', sa.Boolean)
    )
    
    initial_users = [
        {
            'id': str(uuid.uuid4()),
            'username': 'admin',
            'password': hash_password('admin123'),
            'is_admin': True
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'user',
            'password': hash_password('user123'),
            'is_admin': False
        }
    ]
    
    op.bulk_insert(users_table, initial_users)
    logger.info(f"Created initial users: {[user['username'] for user in initial_users]}")

    # Create questionnaires table
    logger.info("Creating questionnaires table")
    op.create_table(
        'questionnaires',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    logger.info("Questionnaires table created")

    # Create questions table
    logger.info("Creating questions table")
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('options', sa.JSON(), nullable=True),
        sa.Column('question', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    logger.info("Questions table created")

    # Create question_junctions table
    logger.info("Creating question_junctions table")
    op.create_table(
        'question_junctions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('questionnaire_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['questionnaire_id'], ['questionnaires.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('questionnaire_id', 'question_id')
    )
    logger.info("Question_junctions table created")

    # Create responses table with String ID
    logger.info("Creating responses table")
    op.create_table(
        'responses',
        sa.Column('id', sa.String(), nullable=False),  
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('questionnaire_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['questionnaire_id'], ['questionnaires.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'questionnaire_id')
    )
    logger.info("Responses table created")

    # Create answers table with String ID for response_id
    logger.info("Creating answers table")
    op.create_table(
        'answers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('response_id', sa.String(), nullable=False),  
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['response_id'], ['responses.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('response_id', 'question_id')
    )
    logger.info("Answers table created")

    # Insert seed data
    logger.info("Inserting seed data")
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
    questionnaire_data = load_csv_data('questionnaire_questionnaires.csv')
    op.bulk_insert(questionnaires, [
        {
            'id': int(row['id']),
            'name': row['name']
        }
        for row in questionnaire_data
    ])
    logger.info("Questionnaires inserted")

    # Load and insert questions
    question_data = load_csv_data('questionnaire_questions.csv')
    for row in question_data:
        question_json = json.loads(row['question'])
        op.bulk_insert(questions, [{
            'id': int(row['id']),
            'type': question_json['type'],
            'options': question_json.get('options'),
            'question': question_json['question']
        }])
    logger.info("Questions inserted")

    # Load and insert question junctions
    junction_data = load_csv_data('questionnaire_junction.csv')
    op.bulk_insert(question_junctions, [
        {
            'id': int(row['id']),
            'questionnaire_id': int(row['questionnaire_id']),
            'question_id': int(row['question_id']),
            'priority': int(row['priority'])
        }
        for row in junction_data
    ])
    logger.info("Question junctions inserted")


def downgrade() -> None:
    logger.info("Starting downgrade")
    op.drop_table('answers')
    op.drop_table('responses')
    op.drop_table('question_junctions')
    op.drop_table('questions')
    op.drop_table('questionnaires')
    op.drop_table('users')
    logger.info("Downgrade complete")
