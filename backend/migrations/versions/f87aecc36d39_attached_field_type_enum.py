"""attached_field_type_enum

Revision ID: f87aecc36d39
Revises: 9efe5f7c69a1
Create Date: 2024-08-17 13:31:54.386554

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f87aecc36d39'
down_revision = 'd274e756f0ae'
branch_labels = None
depends_on = None


def upgrade():
    # ### create ENUM type and set field_type as enum ###
    op.execute("CREATE TYPE metadataformfieldtype AS ENUM('String', 'Integer', 'Boolean', 'GlossaryTerm')")
    op.execute(
        'alter table attached_metadata_form_field alter column type TYPE metadataformfieldtype USING (type::metadataformfieldtype)'
    )
    # ### end create ENUM ###

    # ### foreign keys naming + cascade deletion ###
    op.drop_constraint('fk_attached_mf_uri', 'attached_metadata_form', type_='foreignkey')
    op.create_foreign_key(
        'fk_attached_mf_uri',
        'attached_metadata_form',
        'metadata_form',
        ['metadataFormUri'],
        ['uri'],
        ondelete='CASCADE',
    )
    op.drop_constraint('fk_attached_field_mf_uri', 'attached_metadata_form_field', type_='foreignkey')
    op.drop_constraint('fk_attached_field_uri', 'attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_attached_field_mf_uri',
        'attached_metadata_form_field',
        'attached_metadata_form',
        ['attachedFormUri'],
        ['uri'],
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_attached_field_uri',
        'attached_metadata_form_field',
        'metadata_form_field',
        ['fieldUri'],
        ['uri'],
        ondelete='CASCADE',
    )
    op.drop_constraint('fk_b_field', 'boolean_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_b_field',
        'boolean_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
        ondelete='CASCADE',
    )
    op.drop_constraint('fk_gt_field', 'glossary_term_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_gt_field',
        'glossary_term_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
        ondelete='CASCADE',
    )
    op.drop_constraint('fk_i_field', 'integer_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_i_field',
        'integer_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'f_key_enforcement_metadata',
        'metadata_form_enforcement_rule',
        'metadata_form',
        ['metadataFormUri'],
        ['uri'],
        ondelete='CASCADE',
    )
    op.drop_constraint('fk_mf_filed_form_uri', 'metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_mf_filed_form_uri',
        'metadata_form_field',
        'metadata_form',
        ['metadataFormUri'],
        ['uri'],
        ondelete='CASCADE',
    )
    op.drop_constraint('fk_s_field', 'string_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_s_field',
        'string_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
        ondelete='CASCADE',
    )
    # ### end foreign keys naming ###

    # ### MF field values can be nullable ###
    op.alter_column('boolean_attached_metadata_form_field', 'value', existing_type=sa.BOOLEAN(), nullable=True)
    op.alter_column('glossary_term_attached_metadata_form_field', 'value', existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('integer_attached_metadata_form_field', 'value', existing_type=sa.INTEGER(), nullable=True)
    op.alter_column('string_attached_metadata_form_field', 'value', existing_type=sa.VARCHAR(), nullable=True)
    # ### end ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('attached_metadata_form_field', 'type', type_=sa.VARCHAR(), existing_nullable=True)
    op.execute('DROP TYPE metadataformfieldtype CASCADE')
    # ### end Alembic commands ###

    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('fk_s_field', 'string_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_s_field',
        'string_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
    )
    op.drop_constraint('fk_mf_filed_form_uri', 'metadata_form_field', type_='foreignkey')
    op.create_foreign_key('fk_mf_filed_form_uri', 'metadata_form_field', 'metadata_form', ['metadataFormUri'], ['uri'])
    op.drop_constraint('f_key_enforcement_metadata', 'metadata_form_enforcement_rule', type_='foreignkey')
    op.drop_constraint('fk_i_field', 'integer_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_i_field',
        'integer_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
    )
    op.drop_constraint('fk_gt_field', 'glossary_term_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_gt_field',
        'glossary_term_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
    )
    op.drop_constraint('fk_b_field', 'boolean_attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_b_field',
        'boolean_attached_metadata_form_field',
        'attached_metadata_form_field',
        ['attachedFormUri', 'fieldUri'],
        ['attachedFormUri', 'fieldUri'],
    )
    op.drop_constraint('fk_attached_field_uri', 'attached_metadata_form_field', type_='foreignkey')
    op.drop_constraint('fk_attached_field_mf_uri', 'attached_metadata_form_field', type_='foreignkey')
    op.create_foreign_key(
        'fk_attached_field_uri', 'attached_metadata_form_field', 'metadata_form_field', ['fieldUri'], ['uri']
    )
    op.create_foreign_key(
        'fk_attached_field_mf_uri',
        'attached_metadata_form_field',
        'attached_metadata_form',
        ['attachedFormUri'],
        ['uri'],
    )
    op.drop_constraint('fk_attached_mf_uri', 'attached_metadata_form', type_='foreignkey')
    op.create_foreign_key('fk_attached_mf_uri', 'attached_metadata_form', 'metadata_form', ['metadataFormUri'], ['uri'])
    # ### end Alembic commands ###

    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('string_attached_metadata_form_field', 'value', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('integer_attached_metadata_form_field', 'value', existing_type=sa.INTEGER(), nullable=False)
    op.alter_column('glossary_term_attached_metadata_form_field', 'value', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('boolean_attached_metadata_form_field', 'value', existing_type=sa.BOOLEAN(), nullable=False)
    # ### end Alembic commands ###
