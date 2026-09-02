import { useTimelineActivityTypes } from '@/activities/timeline-activities/hooks/useTimelineActivityTypes';
import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type TimelineActivityTypeMaps } from '@/activities/timeline-activities/types/TimelineActivityTypeMaps';
import { getTimelineActivityAction } from '@/activities/timeline-activities/utils/getTimelineActivityAction';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  type FieldMetadataItem,
  type FieldMetadataItemOption,
} from '@/object-metadata/types/FieldMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { type View } from '@/views/types/View';
import { styled } from '@linaria/react';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, useId, useMemo, useState } from 'react';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { capitalize, isDefined } from 'twenty-shared/utils';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { FieldMetadataType, ViewType } from '~/generated-metadata/graphql';

// HubSpot's "Lead stage tracker": a chevron pipeline of the object's stage
// options across the top of the record, the current stage in its own colour,
// and "Stage: Qualified for 3 days" underneath. Mounted once in
// PageLayoutRecordPageRenderer, so it renders on the full record page and in
// the side panel preview alike (the side panel and mobile get the compact
// variant: bare chevrons with tooltips, no labels).
//
// The stage field is whatever the object's kanban view groups by
// (View.mainGroupByFieldMetadataId), so a Leads board grouped by "Lead stage"
// drives this tracker with no configuration. Objects with no kanban view fall
// back to a small fork map; objects with neither render nothing. Clicking a
// chevron writes the field through useUpdateOneRecord: one field, no confirm.
//
// "for N days" is derived from the record's timeline: the newest `updated`
// activity whose diff touched the stage field, or the record's createdAt when
// the stage has never changed since creation. The lean findMany below fetches
// the 60 newest activities with four fields; if the stage change is older than
// that window the duration is simply omitted rather than guessed.

const STAGE_FIELD_NAME_BY_OBJECT_NAME_SINGULAR: Record<string, string> = {
  lead: 'status',
  opportunity: 'stage',
  agreement: 'status',
};

const TIMELINE_ACTIVITY_WINDOW = 60;

type StageState = 'done' | 'current' | 'upcoming';

type StageTimelineActivity = ObjectRecord &
  Pick<
    TimelineActivity,
    | 'happensAt'
    | 'properties'
    | 'timelineActivityTypeId'
    | 'timelineActivityTypeSnapshot'
  >;

const StyledContainer = styled.div`
  --icehouse-chevron: 10px;
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  width: 100%;

  &[data-icehouse-variant='compact'] {
    --icehouse-chevron: 6px;
    gap: ${themeCssVariables.spacing[1]};
    padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  }
`;

const StyledStages = styled.div`
  display: flex;
  width: 100%;
`;

// Chevron segments: each button is clipped to an arrow; every segment after
// the first overlaps the previous arrow by (chevron - 2px) so a 2px sliver of
// the container shows through as the seam. Borders do not survive clip-path,
// so every state is a fill.
const StyledStage = styled.button`
  align-items: center;
  appearance: none;
  background: ${themeCssVariables.background.tertiary};
  border: none;
  box-sizing: border-box;
  clip-path: polygon(
    0 0,
    calc(100% - var(--icehouse-chevron)) 0,
    100% 50%,
    calc(100% - var(--icehouse-chevron)) 100%,
    0 100%,
    var(--icehouse-chevron) 50%
  );
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex: 1 1 0;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.regular};
  height: 28px;
  justify-content: center;
  margin: 0;
  min-width: 0;
  padding: 0 calc(var(--icehouse-chevron) + ${themeCssVariables.spacing[2]});
  transition: opacity ${themeCssVariables.animation.duration.fast} ease-in-out;

  &:first-child {
    clip-path: polygon(
      0 0,
      calc(100% - var(--icehouse-chevron)) 0,
      100% 50%,
      calc(100% - var(--icehouse-chevron)) 100%,
      0 100%
    );
  }

  &:last-child {
    clip-path: polygon(
      0 0,
      100% 0,
      100% 100%,
      0 100%,
      var(--icehouse-chevron) 50%
    );
  }

  & + & {
    margin-left: calc(2px - var(--icehouse-chevron));
  }

  &[data-state='upcoming'] {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.tertiary};
  }

  &[data-state='current'] {
    background: var(--icehouse-stage-background);
    color: var(--icehouse-stage-color);
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  &:not(:disabled):hover {
    opacity: 0.8;
  }

  &:disabled {
    cursor: default;
  }

  [data-icehouse-variant='compact'] & {
    height: 12px;
    padding: 0;
  }
`;

const StyledStageLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-icehouse-variant='compact'] & {
    display: none;
  }
`;

const StyledSummary = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.spacing[4]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSummaryStage = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const findStageFieldMetadataItem = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  views: View[],
): FieldMetadataItem | undefined => {
  const selectFieldMetadataItems = objectMetadataItem.fields.filter(
    (fieldMetadataItem) =>
      fieldMetadataItem.type === FieldMetadataType.SELECT &&
      fieldMetadataItem.isActive !== false &&
      isDefined(fieldMetadataItem.options) &&
      fieldMetadataItem.options.length > 0,
  );

  const kanbanView = views.find(
    (view) =>
      view.type === ViewType.KANBAN &&
      isDefined(view.mainGroupByFieldMetadataId),
  );

  const kanbanGroupFieldMetadataItem = isDefined(kanbanView)
    ? selectFieldMetadataItems.find(
        (fieldMetadataItem) =>
          fieldMetadataItem.id === kanbanView.mainGroupByFieldMetadataId,
      )
    : undefined;

  if (isDefined(kanbanGroupFieldMetadataItem)) {
    return kanbanGroupFieldMetadataItem;
  }

  const fallbackFieldName =
    STAGE_FIELD_NAME_BY_OBJECT_NAME_SINGULAR[objectMetadataItem.nameSingular];

  if (!isDefined(fallbackFieldName)) {
    return undefined;
  }

  return selectFieldMetadataItems.find(
    (fieldMetadataItem) => fieldMetadataItem.name === fallbackFieldName,
  );
};

// HubSpot rounds the way people talk about it: minutes under an hour, hours
// under two days, days beyond.
const formatTimeInStage = (
  enteredAt: string,
  now: Date,
): string | undefined => {
  const elapsedMs = now.getTime() - new Date(enteredAt).getTime();

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return undefined;
  }

  const minutes = Math.floor(elapsedMs / 60_000);

  if (minutes < 60) {
    return plural(minutes, { one: '# minute', other: '# minutes' });
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 48) {
    return plural(hours, { one: '# hour', other: '# hours' });
  }

  const days = Math.floor(hours / 24);

  return plural(days, { one: '# day', other: '# days' });
};

// Walk the timeline newest-first. The first `updated` activity that touched
// the stage field dates the current stage, provided it actually produced the
// value we are showing (a mismatch means a newer change has not been logged
// yet, so no date is claimed). Reaching the `created` activity, or the end of
// the record's history, means the stage has never changed: use createdAt.
const getStageEnteredAt = ({
  timelineActivities,
  timelineActivityTypeMaps,
  stageFieldName,
  currentValue,
  recordCreatedAt,
  historyIsComplete,
}: {
  timelineActivities: StageTimelineActivity[];
  timelineActivityTypeMaps: TimelineActivityTypeMaps;
  stageFieldName: string;
  currentValue: string;
  recordCreatedAt: string | undefined;
  historyIsComplete: boolean;
}): string | undefined => {
  for (const timelineActivity of timelineActivities) {
    const action = getTimelineActivityAction(
      timelineActivity,
      timelineActivityTypeMaps,
    );

    if (action === 'created') {
      return recordCreatedAt ?? timelineActivity.happensAt;
    }

    if (action !== 'updated') {
      continue;
    }

    const stageDiff = timelineActivity.properties?.diff?.[stageFieldName];

    if (!isDefined(stageDiff)) {
      continue;
    }

    return stageDiff.after === currentValue
      ? timelineActivity.happensAt
      : undefined;
  }

  return historyIsComplete ? recordCreatedAt : undefined;
};

const IcehouseStageTrackerContent = ({
  targetRecordIdentifier,
  objectMetadataItem,
  stageFieldMetadataItem,
  compact,
}: {
  targetRecordIdentifier: TargetRecordIdentifier;
  objectMetadataItem: EnrichedObjectMetadataItem;
  stageFieldMetadataItem: FieldMetadataItem;
  compact: boolean;
}) => {
  const { t } = useLingui();
  const instanceId = useId();
  const { updateOneRecord } = useUpdateOneRecord();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStageChangeAt, setLocalStageChangeAt] = useState<
    string | undefined
  >(undefined);

  const recordId = targetRecordIdentifier.id;
  const objectNameSingular = targetRecordIdentifier.targetObjectNameSingular;
  const stageFieldName = stageFieldMetadataItem.name;

  const currentValue = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: stageFieldName,
  }) as string | null | undefined;

  const recordCreatedAt = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    { recordId, fieldName: 'createdAt' },
  ) as string | null | undefined;

  const recordDeletedAt = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    { recordId, fieldName: 'deletedAt' },
  ) as string | null | undefined;

  const canUpdateStage =
    !isDefined(recordDeletedAt) &&
    objectMetadataItem.updatableFields.some(
      (fieldMetadataItem) => fieldMetadataItem.id === stageFieldMetadataItem.id,
    );

  const options = useMemo(
    () =>
      [...(stageFieldMetadataItem.options ?? [])].sort(
        (optionA, optionB) => optionA.position - optionB.position,
      ),
    [stageFieldMetadataItem.options],
  );

  const currentIndex = options.findIndex(
    (option) => option.value === currentValue,
  );
  const currentOption: FieldMetadataItemOption | undefined =
    currentIndex >= 0 ? options[currentIndex] : undefined;

  // Same guard as useTimelineActivities: skip the query for objects the
  // timeline does not target (no morph relation → no target<Object>Id column).
  const { objectMetadataItem: timelineActivityMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.TimelineActivity,
    });

  const hasTimelineActivityField = timelineActivityMetadataItem.fields.some(
    (fieldMetadataItem) =>
      isDefined(fieldMetadataItem.morphRelations) &&
      fieldMetadataItem.morphRelations.some(
        (morphRelation) =>
          morphRelation.targetObjectMetadata?.nameSingular ===
          objectNameSingular,
      ),
  );

  const timelineFilter: RecordGqlOperationFilter = useMemo(
    () => ({
      [`target${capitalize(objectNameSingular)}Id`]: { eq: recordId },
    }),
    [objectNameSingular, recordId],
  );

  const { timelineActivityTypeMaps } = useTimelineActivityTypes();

  const {
    records: timelineActivities,
    loading: timelineLoading,
    hasNextPage: timelineHasNextPage,
  } = useFindManyRecords<StageTimelineActivity>({
    objectNameSingular: CoreObjectNameSingular.TimelineActivity,
    filter: timelineFilter,
    orderBy: [{ happensAt: 'DescNullsFirst' }],
    recordGqlFields: {
      id: true,
      happensAt: true,
      properties: true,
      timelineActivityTypeId: true,
      timelineActivityTypeSnapshot: true,
    },
    limit: TIMELINE_ACTIVITY_WINDOW,
    skip: !hasTimelineActivityField || !isDefined(currentOption),
  });

  const stageEnteredAt = isDefined(currentOption)
    ? (localStageChangeAt ??
      getStageEnteredAt({
        timelineActivities,
        timelineActivityTypeMaps,
        stageFieldName,
        currentValue: currentOption.value,
        recordCreatedAt: recordCreatedAt ?? undefined,
        historyIsComplete: !timelineLoading && !timelineHasNextPage,
      }))
    : undefined;

  const timeInStage = isDefined(stageEnteredAt)
    ? formatTimeInStage(stageEnteredAt, new Date())
    : undefined;

  const handleStageClick = async (option: FieldMetadataItemOption) => {
    if (!canUpdateStage || isUpdating || option.value === currentValue) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateOneRecord({
        objectNameSingular,
        idToUpdate: recordId,
        updateOneRecordInput: { [stageFieldName]: option.value },
      });
      setLocalStageChangeAt(new Date().toISOString());
    } catch {
      enqueueErrorSnackBar({
        message: t`Could not update ${stageFieldMetadataItem.label}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <StyledContainer
      data-icehouse="stage-tracker"
      data-icehouse-variant={compact ? 'compact' : 'full'}
      aria-busy={isUpdating}
    >
      <StyledStages
        data-icehouse-part="stages"
        role="group"
        aria-label={stageFieldMetadataItem.label}
      >
        {options.map((option, index) => {
          const state: StageState =
            index === currentIndex
              ? 'current'
              : currentIndex >= 0 && index < currentIndex
                ? 'done'
                : 'upcoming';
          const buttonId = `icehouse-stage-${instanceId}-${option.id}`;
          const stageStyle = {
            '--icehouse-stage-background':
              themeCssVariables.tag.background[option.color] ??
              themeCssVariables.tag.background.gray,
            '--icehouse-stage-color':
              themeCssVariables.tag.text[option.color] ??
              themeCssVariables.font.color.primary,
          } as CSSProperties;

          return (
            <StyledStage
              key={option.id}
              id={buttonId}
              type="button"
              data-icehouse-part="stage"
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={option.label}
              disabled={!canUpdateStage || isUpdating}
              onClick={() => handleStageClick(option)}
              style={stageStyle}
            >
              <StyledStageLabel data-icehouse-part="label">
                {option.label}
              </StyledStageLabel>
              <AppTooltip
                anchorSelect={`#${buttonId}`}
                content={option.label}
                delay={TooltipDelay.shortDelay}
                place="bottom"
                noArrow
              />
            </StyledStage>
          );
        })}
      </StyledStages>
      <StyledSummary data-icehouse-part="summary">
        {isDefined(currentOption) ? (
          <>
            {t`Stage:`}{' '}
            <StyledSummaryStage>{currentOption.label}</StyledSummaryStage>
            {isDefined(timeInStage) ? ` ${t`for ${timeInStage}`}` : null}
          </>
        ) : (
          t`No ${stageFieldMetadataItem.label} set`
        )}
      </StyledSummary>
    </StyledContainer>
  );
};

export const IcehouseStageTracker = ({
  targetRecordIdentifier,
  isInSidePanel,
}: {
  targetRecordIdentifier: TargetRecordIdentifier;
  isInSidePanel: boolean;
}) => {
  const isMobile = useIsMobile();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecordIdentifier.targetObjectNameSingular,
  });

  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const stageFieldMetadataItem = findStageFieldMetadataItem(
    objectMetadataItem,
    views,
  );

  if (!isDefined(stageFieldMetadataItem)) {
    return null;
  }

  return (
    <IcehouseStageTrackerContent
      targetRecordIdentifier={targetRecordIdentifier}
      objectMetadataItem={objectMetadataItem}
      stageFieldMetadataItem={stageFieldMetadataItem}
      compact={isInSidePanel || isMobile}
    />
  );
};
