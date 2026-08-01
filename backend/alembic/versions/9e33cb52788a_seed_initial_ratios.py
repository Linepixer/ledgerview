"""seed initial ratios

Revision ID: 9e33cb52788a
Revises: 8d22ba416879
Create Date: 2026-08-01 20:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e33cb52788a'
down_revision: Union[str, Sequence[str], None] = '8d22ba416879'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Seed initial ratios for SPY, QQQ, GLD
    op.execute("UPDATE assets SET current_ratio = 20.0 WHERE ticker = 'SPY'")
    op.execute("UPDATE assets SET current_ratio = 20.0 WHERE ticker = 'QQQ'")
    op.execute("UPDATE assets SET current_ratio = 50.0 WHERE ticker = 'GLD'")


def downgrade() -> None:
    pass
