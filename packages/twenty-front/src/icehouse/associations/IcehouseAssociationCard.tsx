import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { RecordChip } from '@/object-record/components/RecordChip';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { isFieldMorphRelation } from '@/object-record/record-field/ui/types/guards/isFieldMorphRelation';
import { isFieldRelation } from '@/object-record/record-field/ui/types/guards/isFieldRelation';
import { extractTargetRecordsFromJunction } from '@/object-record/record-field/ui/utils/junction/extractTargetRecordsFromJunction';
import { type JunctionConfig } from '@/object-record/record-field/ui/utils/junction/getJunctionConfig';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FieldWidgetRelationEditAction } from '@/page-layout/widgets/field/components/FieldWidgetRelationEditAction';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { indexViewIdFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/indexViewIdFromObjectMetadataItemFamilySelector';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppPath,
  type RecordGqlOperationFilter,
  ViewFilterOperand,
} from 'twenty-shared/types';
import {
  computeMorphRelationGqlFieldName,
  getAppPath,
  isDefined,
} from 'twenty-shared/utils';
import { ChipSize } from 'twenty-ui/data-display';
import { IconChevronDown, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { type IcehouseAssociation } from '~/icehouse/associations/getIcehouseAssociations';

// One HubSpot-style association card: a collapsible header with the relation
// label and its live count, the first few related records as chips, an
// upstream "+ Add" / edit relation action, and a "View all" link to the
// related object's index filtered by this record (the same link
// WidgetActionFieldSeeAll builds). Collapse state is remembered per object
// type in localStorage, since Twenty has no preference slot for it.

const ASSOCIATION_CHIP_LIMIT = 5;

const COLLAPSED_STORAGE_PREFIX = 'icehouse.associations.collapsed:';

const readCollapsed = (storageKey: string): boolean => {
  try {
    return (
      window.localStorage.getItem(COLLAPSED_STORAGE_PREFIX + storageKey) === '1'
    );
  } catch {
    return false;
  }
};

const writeCollapsed = (storageKey: string, isCollapsed: boolean) => {
  try {
    if (isCollapsed) {
      window.localStorage.setItem(COLLAPSED_STORAGE_PREFIX + storageKey, '1');
    } else {
      window.localStorage.removeItem(COLLAPSED_STORAGE_PREFIX + storageKey);
    }
  } catch {
    // Blocked storage (private mode): the card simply forgets its state.
  }
};

// A junction query only needs the link row's id and the far-side record it
// points at; the far side comes back with its own scalar fields, which is
// what the chip generator reads.
const getJunctionRecordGqlFields = (
  junctionConfig: JunctionConfig,
): Record<string, boolean> => {
  const targetGqlFieldNames = junctionConfig.targetFields.flatMap(
    (targetField) =>
      targetField.type === FieldMetadataType.MORPH_RELATION
        ? (targetField.morphRelations ?? []).map((morphRelation) =>
            computeMorphRelationGqlFieldName({
              fieldName: morphRelation.sourceFieldMetadata.name,
              relationType: morphRelation.type,
              targetObjectMetadataNameSingular:
                morphRelation.targetObjectMetadata.nameSingular,
              targetObjectMetadataNamePlural:
                morphRelation.targetObjectMetadata.namePlural,
            }),
          )
        : [targetField.name],
  );

  return Object.fromEntries(
    ['id', ...targetGqlFieldNames].map((gqlFieldName) => [gqlFieldName, true]),
  );
};

const StyledCard = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
`;

const StyledHeader = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledToggle = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex: 1;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: 0;
  text-align: left;
`;

const StyledChevron = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-shrink: 0;
`;

const StyledTitle = styled.span`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

const StyledBody = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledChipRow = styled.div`
  display: flex;
  min-width: 0;
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledViewAllLink = styled(Link)`
  color: ${themeCssVariables.font.color.secondary};
  display: block;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding-top: ${themeCssVariables.spacing[1]};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

type ChipItem = {
  record: ObjectRecord;
  objectNameSingular: string;
};

type IcehouseAssociationCardProps = {
  association: IcehouseAssociation;
  objectMetadataItem: EnrichedObjectMetadataItem;
  recordId: string;
};

export const IcehouseAssociationCard = ({
  association,
  objectMetadataItem,
  recordId,
}: IcehouseAssociationCardProps) => {
  const { t } = useLingui();
  const theme = useTheme();
  const { formatNumber } = useNumberFormat();
  const { objectMetadataItems } = useObjectMetadataItems();

  const {
    kind,
    label,
    fieldMetadataItem,
    relationObjectMetadataItem,
    joinColumnName,
    indexFilterFieldName,
    junctionConfig,
  } = association;

  const storageKey = `${objectMetadataItem.nameSingular}.${association.key}`;
  const [isCollapsed, setIsCollapsed] = useState(() =>
    readCollapsed(storageKey),
  );

  const handleToggle = () => {
    const nextIsCollapsed = !isCollapsed;
    setIsCollapsed(nextIsCollapsed);
    writeCollapsed(storageKey, nextIsCollapsed);
  };

  const fieldDefinition = formatFieldMetadataItemAsFieldDefinition({
    field: fieldMetadataItem,
    objectMetadataItem,
  });

  const relationFieldDefinition =
    isFieldRelation(fieldDefinition) || isFieldMorphRelation(fieldDefinition)
      ? fieldDefinition
      : null;

  const toOneValue = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: fieldMetadataItem.name,
  }) as ObjectRecord | null | undefined;

  const isQueried = kind !== 'TO_ONE' && isDefined(joinColumnName);

  const joinFilter: RecordGqlOperationFilter = {
    [joinColumnName ?? 'id']: { eq: recordId },
  };

  const { records, loading } = useFindManyRecords({
    objectNameSingular: relationObjectMetadataItem.nameSingular,
    filter: joinFilter,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: ASSOCIATION_CHIP_LIMIT,
    recordGqlFields: isDefined(junctionConfig)
      ? getJunctionRecordGqlFields(junctionConfig)
      : undefined,
    skip: !isQueried,
  });

  const { data: aggregateData } = useAggregateRecords<{
    id: { COUNT: number };
  }>({
    objectNameSingular: relationObjectMetadataItem.nameSingular,
    filter: joinFilter,
    recordGqlFieldsAggregate: { id: [AggregateOperations.COUNT] },
    skip: !isQueried,
  });

  const indexViewId = useAtomFamilySelectorValue(
    indexViewIdFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: relationObjectMetadataItem.id },
  );

  const sourceObjectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );
  const relationObjectPermissions = useObjectPermissionsForObject(
    relationObjectMetadataItem.id,
  );

  if (!relationObjectPermissions.canReadObjectRecords) {
    return null;
  }

  const chipItems: ChipItem[] =
    kind === 'TO_ONE'
      ? isDefined(toOneValue)
        ? [
            {
              record: toOneValue,
              objectNameSingular: relationObjectMetadataItem.nameSingular,
            },
          ]
        : []
      : isDefined(junctionConfig)
        ? extractTargetRecordsFromJunction({
            junctionRecords: records,
            targetFields: junctionConfig.targetFields,
            objectMetadataItems,
            includeRecord: true,
          })
            .map(({ record, objectMetadataId }) => {
              const objectNameSingular = objectMetadataItems.find(
                (candidate) => candidate.id === objectMetadataId,
              )?.nameSingular;

              return isDefined(record) && isDefined(objectNameSingular)
                ? { record, objectNameSingular }
                : undefined;
            })
            .filter(isDefined)
        : records.map((record) => ({
            record,
            objectNameSingular: relationObjectMetadataItem.nameSingular,
          }));

  const aggregateCount = aggregateData?.id?.COUNT;
  const count =
    kind === 'TO_ONE'
      ? chipItems.length
      : isDefined(aggregateCount)
        ? Number(aggregateCount)
        : undefined;

  // The foreign key lives on the related record for to-many relations, so
  // that is the object the picker will write to.
  const canEdit =
    isDefined(relationFieldDefinition) &&
    (fieldMetadataItem.isUIEditable ?? true) &&
    (kind === 'TO_ONE'
      ? sourceObjectPermissions.canUpdateObjectRecords
      : relationObjectPermissions.canUpdateObjectRecords);

  const viewAllHref = isDefined(indexFilterFieldName)
    ? getAppPath(
        AppPath.RecordIndexPage,
        { objectNamePlural: relationObjectMetadataItem.namePlural },
        {
          filter: {
            [indexFilterFieldName]: {
              [ViewFilterOperand.IS]: { selectedRecordIds: [recordId] },
            },
          },
          viewId: indexViewId,
        },
      )
    : null;

  const labelLowerCase = label.toLowerCase();
  const formattedCount = isDefined(count) ? formatNumber(count) : '';
  const viewAllLabel = t`View all ${formattedCount} ${labelLowerCase}`;
  const emptyLabel = t`No ${labelLowerCase} yet`;
  const toggleLabel = isCollapsed ? t`Expand ${label}` : t`Collapse ${label}`;

  return (
    <RecordFieldsScopeContextProvider
      value={{ scopeInstanceId: `icehouse-associations:${association.key}` }}
    >
      <StyledCard data-icehouse-part="card" data-icehouse-kind={kind}>
        <StyledHeader data-icehouse-part="header">
          <StyledToggle
            type="button"
            aria-expanded={!isCollapsed}
            aria-label={toggleLabel}
            data-icehouse-part="toggle"
            onClick={handleToggle}
          >
            <StyledChevron aria-hidden>
              {isCollapsed ? (
                <IconChevronRight size={theme.icon.size.sm} />
              ) : (
                <IconChevronDown size={theme.icon.size.sm} />
              )}
            </StyledChevron>
            <StyledTitle data-icehouse-part="title">{label}</StyledTitle>
            {isDefined(count) && (
              <StyledCount data-icehouse-part="count">
                ({formattedCount})
              </StyledCount>
            )}
          </StyledToggle>
          {canEdit && isDefined(relationFieldDefinition) && (
            <StyledActions data-icehouse-part="actions">
              <FieldWidgetRelationEditAction
                fieldDefinition={relationFieldDefinition}
                recordId={recordId}
              />
            </StyledActions>
          )}
        </StyledHeader>
        {!isCollapsed && (
          <StyledBody data-icehouse-part="body">
            {chipItems.map(({ record, objectNameSingular }) => (
              <StyledChipRow
                key={`${objectNameSingular}:${record.id}`}
                data-icehouse-part="chip"
              >
                <RecordChip
                  objectNameSingular={objectNameSingular}
                  record={record}
                  size={ChipSize.Small}
                  maxWidth={250}
                />
              </StyledChipRow>
            ))}
            {chipItems.length === 0 && !loading && (
              <StyledEmpty data-icehouse-part="empty">{emptyLabel}</StyledEmpty>
            )}
            {isDefined(viewAllHref) && isDefined(count) && count > 0 && (
              <StyledViewAllLink to={viewAllHref} data-icehouse-part="view-all">
                {viewAllLabel}
              </StyledViewAllLink>
            )}
          </StyledBody>
        )}
      </StyledCard>
    </RecordFieldsScopeContextProvider>
  );
};
