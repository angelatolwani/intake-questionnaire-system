"""remove timestamp fields from users

Revision ID: remove_timestamps
Revises: initial
Create Date: 2024-12-16 04:31:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_timestamps'
down_revision = 'initial'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the timestamp columns from users table
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'updated_at')


def downgrade():
    # Add back the timestamp columns if needed
    op.add_column('users', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
