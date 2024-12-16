"""add missing tables

Revision ID: add_missing_tables
Revises: add_sample_data
Create Date: 2024-12-16 06:33:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import logging

# Configure logging
logger = logging.getLogger(__name__)

# revision identifiers, used by Alembic.
revision: str = 'add_missing_tables'
down_revision: Union[str, None] = 'add_sample_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    logger.info("Creating responses and answers tables")
    
    # Create responses table
    op.create_table(
        'responses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('questionnaire_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['questionnaire_id'], ['questionnaires.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'questionnaire_id')
    )
    
    # Create answers table
    op.create_table(
        'answers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('response_id', sa.String(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.ForeignKeyConstraint(['response_id'], ['responses.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('response_id', 'question_id')
    )
    
    logger.info("Tables created successfully")


def downgrade() -> None:
    op.drop_table('answers')
    op.drop_table('responses')
