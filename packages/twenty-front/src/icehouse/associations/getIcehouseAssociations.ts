import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isActiveFieldMetadataItem } from '@/object-metadata/utils/isActiveFieldMetadataItem';
import {
  getJunctionConfig,
  type JunctionConfig,
} from '@/object-record/record-field/ui/utils/junction/getJunctionConfig';
import { hasJunctionConfig } from '@/object-record/record-field/ui/utils/junction/hasJunctionConfig';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import {
  computeMorphRelationGqlFieldName,
  computeRelationGqlFieldJoinColumnName,
  isDefined,
} from 'twenty-shared/utils';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

// HubSpot's right-hand column lists the records a contact is associated with:
// companies, deals, tickets. Twenty's equivalent is every relation field on
// the object, minus the plumbing it uses for activities, participants,
// favourites and owners, which HubSpot never presents as an association.
//
// One entry per card. TO_ONE reads the related record straight from the
// record store (it arrives with the record); TO_MANY and JUNCTION query the
// related object with the join column that points back at this record.

export type IcehouseAssociationKind = 'TO_ONE' | 'TO_MANY' | 'JUNCTION';

export type IcehouseAssociation = {
  key: string;
  kind: IcehouseAssociationKind;
  label: string;
  fieldMetadataItem: FieldMetadataItem;
  // The object queried with the join filter: the related object, or the
  // junction object whose far side the chips show.
  relationObjectMetadataItem: EnrichedObjectMetadataItem;
  // Column on the related object holding this record's id (null for TO_ONE).
  joinColumnName: string | null;
  // Field on the related object the "View all" index link filters by.
  indexFilterFieldName: string | null;
  junctionConfig: JunctionConfig | null;
};

const EXCLUDED_TARGET_OBJECT_NAMES = new Set<string>([
  CoreObjectNameSingular.TimelineActivity,
  CoreObjectNameSingular.Attachment,
  CoreObjectNameSingular.NoteTarget,
  CoreObjectNameSingular.TaskTarget,
  CoreObjectNameSingular.ActivityTarget,
  CoreObjectNameSingular.MessageParticipant,
  'calendarEventParticipant',
  CoreObjectNameSingular.MessageThreadTarget,
  CoreObjectNameSingular.CalendarEventTarget,
  CoreObjectNameSingular.WorkspaceMember,
  'favorite',
]);

const isExcludedTarget = (objectMetadataItem: EnrichedObjectMetadataItem) =>
  EXCLUDED_TARGET_OBJECT_NAMES.has(objectMetadataItem.nameSingular) ||
  objectMetadataItem.isSystem === true ||
  objectMetadataItem.isActive === false;

// The foreign key lives on the related object, on the field that points back
// here. A morph field there (one field, several targets) is exposed to GraphQL
// under a per-target name, so its join column is computed the same way
// RecordDetailRelationSection computes it.
const getJoinColumn = ({
  sourceObjectMetadataItem,
  relationObjectMetadataItem,
  targetFieldMetadataId,
}: {
  sourceObjectMetadataItem: EnrichedObjectMetadataItem;
  relationObjectMetadataItem: EnrichedObjectMetadataItem;
  targetFieldMetadataId: string;
}): { joinColumnName: string; targetFieldName: string } | null => {
  const targetField = relationObjectMetadataItem.fields.find(
    (field) => field.id === targetFieldMetadataId,
  );

  if (!isDefined(targetField)) {
    return null;
  }

  if (targetField.type === FieldMetadataType.MORPH_RELATION) {
    const morphRelation = targetField.morphRelations?.find(
      (candidate) =>
        candidate.targetObjectMetadata.id === sourceObjectMetadataItem.id,
    );

    if (!isDefined(morphRelation)) {
      return null;
    }

    return {
      joinColumnName: computeRelationGqlFieldJoinColumnName({
        name: computeMorphRelationGqlFieldName({
          fieldName: targetField.name,
          relationType: morphRelation.type,
          targetObjectMetadataNameSingular:
            sourceObjectMetadataItem.nameSingular,
          targetObjectMetadataNamePlural: sourceObjectMetadataItem.namePlural,
        }),
      }),
      targetFieldName: targetField.name,
    };
  }

  return {
    joinColumnName: computeRelationGqlFieldJoinColumnName({
      name: targetField.name,
    }),
    targetFieldName: targetField.name,
  };
};

export const getIcehouseAssociations = ({
  objectMetadataItem,
  objectMetadataItems,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
}): IcehouseAssociation[] => {
  const findObjectMetadataItem = (id: string) =>
    objectMetadataItems.find((candidate) => candidate.id === id);

  const associations: IcehouseAssociation[] = [];

  for (const field of objectMetadataItem.fields) {
    if (!isActiveFieldMetadataItem({ fieldMetadata: field })) {
      continue;
    }

    if (
      field.type === FieldMetadataType.RELATION &&
      isDefined(field.relation)
    ) {
      const relation = field.relation;
      const relationObjectMetadataItem = findObjectMetadataItem(
        relation.targetObjectMetadata.id,
      );

      if (
        !isDefined(relationObjectMetadataItem) ||
        isExcludedTarget(relationObjectMetadataItem)
      ) {
        continue;
      }

      if (relation.type === RelationType.MANY_TO_ONE) {
        associations.push({
          key: field.id,
          kind: 'TO_ONE',
          label: field.label,
          fieldMetadataItem: field,
          relationObjectMetadataItem,
          joinColumnName: null,
          indexFilterFieldName: null,
          junctionConfig: null,
        });
        continue;
      }

      if (relation.type !== RelationType.ONE_TO_MANY) {
        continue;
      }

      const join = getJoinColumn({
        sourceObjectMetadataItem: objectMetadataItem,
        relationObjectMetadataItem,
        targetFieldMetadataId: relation.targetFieldMetadata.id,
      });

      if (!isDefined(join)) {
        continue;
      }

      const junctionConfig = hasJunctionConfig(field.settings)
        ? getJunctionConfig({
            settings: field.settings,
            relationObjectMetadataId: relationObjectMetadataItem.id,
            relationTargetFieldMetadataId: relation.targetFieldMetadata.id,
            sourceObjectMetadataId: objectMetadataItem.id,
            objectMetadataItems,
          })
        : null;

      associations.push({
        key: field.id,
        kind: isDefined(junctionConfig) ? 'JUNCTION' : 'TO_MANY',
        label: field.label,
        fieldMetadataItem: field,
        relationObjectMetadataItem,
        joinColumnName: join.joinColumnName,
        // A junction index lists link rows, not the far-side records, so the
        // "View all" link would show the wrong object; the card lists them.
        indexFilterFieldName: isDefined(junctionConfig)
          ? null
          : join.targetFieldName,
        junctionConfig,
      });
      continue;
    }

    if (field.type === FieldMetadataType.MORPH_RELATION) {
      const morphRelations = (field.morphRelations ?? []).filter(
        (morphRelation) => morphRelation.type === RelationType.ONE_TO_MANY,
      );

      for (const morphRelation of morphRelations) {
        const relationObjectMetadataItem = findObjectMetadataItem(
          morphRelation.targetObjectMetadata.id,
        );

        if (
          !isDefined(relationObjectMetadataItem) ||
          isExcludedTarget(relationObjectMetadataItem)
        ) {
          continue;
        }

        const join = getJoinColumn({
          sourceObjectMetadataItem: objectMetadataItem,
          relationObjectMetadataItem,
          targetFieldMetadataId: morphRelation.targetFieldMetadata.id,
        });

        if (!isDefined(join)) {
          continue;
        }

        associations.push({
          key: `${field.id}:${relationObjectMetadataItem.id}`,
          kind: 'TO_MANY',
          label:
            morphRelations.length > 1
              ? `${field.label} · ${relationObjectMetadataItem.labelPlural}`
              : field.label,
          fieldMetadataItem: field,
          relationObjectMetadataItem,
          joinColumnName: join.joinColumnName,
          indexFilterFieldName: join.targetFieldName,
          junctionConfig: null,
        });
      }
    }
  }

  return associations.sort((left, right) =>
    left.label.localeCompare(right.label),
  );
};
