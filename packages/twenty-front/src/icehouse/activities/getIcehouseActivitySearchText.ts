import { getAuthorizedLinkedRecordName } from '@/activities/timeline-activities/rows/generic/utils/getAuthorizedLinkedRecordName';
import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type TimelineActivityTypeMaps } from '@/activities/timeline-activities/types/TimelineActivityTypeMaps';
import { findFieldMetadataItemByDiffKey } from '@/activities/timeline-activities/utils/findFieldMetadataItemByDiffKey';
import { getTimelineActivityAuthorFullName } from '@/activities/timeline-activities/utils/getTimelineActivityAuthorFullName';
import { getTimelineActivityLinkedObjectMetadataItem } from '@/activities/timeline-activities/utils/getTimelineActivityLinkedObjectMetadataItem';
import { getTimelineActivityType } from '@/activities/timeline-activities/utils/getTimelineActivityType';
import { type CurrentWorkspaceMember } from '@/auth/states/currentWorkspaceMemberState';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { isDefined } from 'twenty-shared/utils';
import { normalizeSearchText } from '~/utils/normalizeSearchText';

// The text an event row puts on screen, flattened for "Search activities":
// author, the type label ("linked a related note"), the linked record's name
// (the note / task title, the email subject …) or the main record's label, and
// for updates the changed field labels with their primitive before/after values.
// Mirrors what EventRowGenericLinked / EventRowMainObject render, without
// touching them.

const MAX_DIFF_VALUE_DEPTH = 2;

const flattenPrimitiveValues = (value: unknown, depth = 0): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }

  if (
    depth < MAX_DIFF_VALUE_DEPTH &&
    isDefined(value) &&
    typeof value === 'object'
  ) {
    return Object.values(value as Record<string, unknown>).flatMap(
      (nestedValue) => flattenPrimitiveValues(nestedValue, depth + 1),
    );
  }

  return [];
};

export const getIcehouseActivitySearchText = ({
  event,
  timelineActivityTypeMaps,
  objectMetadataItems,
  mainObjectMetadataItem,
  mainRecordLabel,
  linkedRecordNameById,
  currentWorkspaceMember,
}: {
  event: TimelineActivity;
  timelineActivityTypeMaps: TimelineActivityTypeMaps;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  mainObjectMetadataItem: EnrichedObjectMetadataItem;
  mainRecordLabel: string | undefined;
  linkedRecordNameById: ReadonlyMap<string, string>;
  currentWorkspaceMember: CurrentWorkspaceMember | null;
}): string => {
  const timelineActivityType = getTimelineActivityType(
    event,
    timelineActivityTypeMaps,
  );

  const linkedObjectMetadataItem = getTimelineActivityLinkedObjectMetadataItem({
    timelineActivity: event,
    timelineActivityTypeMaps,
    objectMetadataItems,
  });

  const linkedRecordName = isDefined(event.linkedRecordId)
    ? getAuthorizedLinkedRecordName(
        linkedRecordNameById.get(event.linkedRecordId),
      )
    : undefined;

  const diffFields = (linkedObjectMetadataItem ?? mainObjectMetadataItem)
    .fields;

  const diffParts = Object.entries(event.properties.diff ?? {}).flatMap(
    ([diffKey, fieldDiff]) => [
      findFieldMetadataItemByDiffKey(diffFields, diffKey)?.label ?? diffKey,
      ...flattenPrimitiveValues(fieldDiff?.before),
      ...flattenPrimitiveValues(fieldDiff?.after),
    ],
  );

  const parts = [
    isDefined(currentWorkspaceMember)
      ? getTimelineActivityAuthorFullName(event, currentWorkspaceMember)
      : undefined,
    timelineActivityType?.label,
    linkedObjectMetadataItem?.labelSingular,
    linkedRecordName,
    isDefined(event.linkedRecordId) ? undefined : mainRecordLabel,
    ...diffParts,
  ];

  return normalizeSearchText(parts.filter(isDefined).join(' '));
};

// Every whitespace-separated term must appear (order-free), so "note pricing"
// finds a note titled "Pricing" as well as "Pricing note".
export const getIcehouseActivitySearchTerms = (searchValue: string): string[] =>
  normalizeSearchText(searchValue)
    .split(/\s+/)
    .filter((term) => term.length > 0);

export const matchesIcehouseActivitySearch = (
  searchText: string,
  searchTerms: string[],
): boolean => searchTerms.every((term) => searchText.includes(term));
