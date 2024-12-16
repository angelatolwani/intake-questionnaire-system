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
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
import bcrypt


# revision identifiers, used by Alembic.
revision: str = 'initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def load_csv_data(filename: str) -> list:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    filepath = os.path.join(project_root, 'data', filename)
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        return list(reader)


def upgrade() -> None:
    # Drop all existing tables first
    op.execute('DROP TABLE IF EXISTS answers CASCADE')
    op.execute('DROP TABLE IF EXISTS responses CASCADE')
    op.execute('DROP TABLE IF EXISTS question_junctions CASCADE')
    op.execute('DROP TABLE IF EXISTS questions CASCADE')
    op.execute('DROP TABLE IF EXISTS questionnaires CASCADE')
    op.execute('DROP TABLE IF EXISTS users CASCADE')

    # Create users table
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

    # Create questionnaires table
    op.create_table(
        'questionnaires',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create questions table
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

    # Create question_junctions table
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

    # Create responses table with String ID
    op.create_table(
        'responses',
        sa.Column('id', sa.String(), nullable=False),  # Changed to String to match models.py
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('questionnaire_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['questionnaire_id'], ['questionnaires.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'questionnaire_id')
    )

    # Create answers table with String ID for response_id
    op.create_table(
        'answers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('response_id', sa.String(), nullable=False),  # Changed to String to match models.py
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['response_id'], ['responses.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('response_id', 'question_id')
    )

    # Insert seed data
    users = table('users',
        column('id', sa.String),
        column('username', sa.String),
        column('password', sa.String),
        column('is_admin', sa.Boolean)
    )

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

    # Insert users
    op.bulk_insert(users, [
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
    ])

    # Load and insert questionnaires
    questionnaire_data = load_csv_data('questionnaire_questionnaires.csv')
    op.bulk_insert(questionnaires, [
        {
            'id': int(row['id']),
            'name': row['name']
        }
        for row in questionnaire_data
    ])

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


def downgrade() -> None:
    op.drop_table('answers')
    op.drop_table('responses')
    op.drop_table('question_junctions')
    op.drop_table('questions')
    op.drop_table('questionnaires')
    op.drop_table('users')
