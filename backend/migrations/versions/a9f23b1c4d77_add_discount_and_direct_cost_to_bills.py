"""Add discount_amount and direct_cost columns to bills table

Revision ID: a9f23b1c4d77
Revises: 1ab630ce33ef
Create Date: 2026-04-25 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9f23b1c4d77'
down_revision = '1ab630ce33ef'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('bills', schema=None) as batch_op:
        batch_op.add_column(sa.Column('discount_amount', sa.Float(), nullable=True, server_default='0.0'))
        batch_op.add_column(sa.Column('direct_cost', sa.Float(), nullable=True, server_default='0.0'))


def downgrade():
    with op.batch_alter_table('bills', schema=None) as batch_op:
        batch_op.drop_column('direct_cost')
        batch_op.drop_column('discount_amount')
