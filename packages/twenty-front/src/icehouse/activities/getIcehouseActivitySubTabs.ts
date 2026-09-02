import { type TimelineActivityType } from '@/activities/timeline-activities/types/TimelineActivityType';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

// One sub-tab per object that at least one active timeline activity type is
// emitted for (Notes, Emails, Tasks, Meetings, Files …). The label is the
// object's own labelPlural, so renaming the object in Settings renames the tab.
// Types with no object (record created / updated / deleted …) only show under
// "All", which the component prepends.
export type IcehouseActivitySubTab = {
  objectUniversalIdentifier: string;
  label: string;
  timelineActivityTypeUniversalIdentifiers: string[];
};

// HubSpot's order: Notes · Emails · Tasks · Meetings · Files. Objects that apps
// add timeline types for follow, alphabetically by label.
const HUBSPOT_SUB_TAB_ORDER: string[] = [
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
];

const getSubTabRank = (objectUniversalIdentifier: string): number => {
  const rank = HUBSPOT_SUB_TAB_ORDER.indexOf(objectUniversalIdentifier);

  return rank === -1 ? HUBSPOT_SUB_TAB_ORDER.length : rank;
};

// HubSpot's names for the standard activity objects; every other object keeps its own labelPlural.
const HUBSPOT_SUB_TAB_LABELS: Record<string, string> = {
  message: 'Emails',
  calendarEvent: 'Meetings',
  attachment: 'Files',
};

export const getIcehouseActivitySubTabs = ({
  activeTimelineActivityTypes,
  objectMetadataItems,
}: {
  activeTimelineActivityTypes: TimelineActivityType[];
  objectMetadataItems: Pick<
    EnrichedObjectMetadataItem,
    'universalIdentifier' | 'labelPlural' | 'nameSingular'
  >[];
}): IcehouseActivitySubTab[] => {
  const typeUniversalIdentifiersByObject = new Map<string, string[]>();

  for (const timelineActivityType of activeTimelineActivityTypes) {
    const objectUniversalIdentifier =
      timelineActivityType.objectUniversalIdentifier;

    if (!isDefined(objectUniversalIdentifier)) {
      continue;
    }

    const typeUniversalIdentifiers =
      typeUniversalIdentifiersByObject.get(objectUniversalIdentifier) ?? [];

    typeUniversalIdentifiers.push(timelineActivityType.universalIdentifier);
    typeUniversalIdentifiersByObject.set(
      objectUniversalIdentifier,
      typeUniversalIdentifiers,
    );
  }

  return [...typeUniversalIdentifiersByObject.entries()]
    .map(
      ([
        objectUniversalIdentifier,
        timelineActivityTypeUniversalIdentifiers,
      ]) => {
        const objectMetadataItem = objectMetadataItems.find(
          (item) => item.universalIdentifier === objectUniversalIdentifier,
        );

        if (!isDefined(objectMetadataItem)) {
          return undefined;
        }

        return {
          objectUniversalIdentifier,
          label:
            HUBSPOT_SUB_TAB_LABELS[objectMetadataItem.nameSingular] ??
            objectMetadataItem.labelPlural,
          timelineActivityTypeUniversalIdentifiers,
        };
      },
    )
    .filter(isDefined)
    .sort(
      (a, b) =>
        getSubTabRank(a.objectUniversalIdentifier) -
          getSubTabRank(b.objectUniversalIdentifier) ||
        a.label.localeCompare(b.label),
    );
};
