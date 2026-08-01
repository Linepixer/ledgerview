"""Add current_ratio to Asset

Revision ID: 8d22ba416879
Revises: 80ab2a67e06c
Create Date: 2026-08-01 21:08:51.100135

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d22ba416879'
down_revision: Union[str, Sequence[str], None] = '80ab2a67e06c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('assets', sa.Column('current_ratio', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('assets', 'current_ratio')
