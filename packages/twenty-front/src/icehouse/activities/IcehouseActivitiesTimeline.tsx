import { EventList } from '@/activities/timeline-activities/components/EventList';
import { useTimelineActivityTypes } from '@/activities/timeline-activities/hooks/useTimelineActivityTypes';
import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { isDefined, uncapitalize } from 'twenty-shared/utils';
import {
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  getIcehouseActivitySearchTerms,
  getIcehouseActivitySearchText,
  matchesIcehouseActivitySearch,
} from '~/icehouse/activities/getIcehouseActivitySearchText';
import { IcehouseActivitiesSearchInput } from '~/icehouse/activities/IcehouseActivitiesSearchInput';
import { IcehouseActivitiesSubTabs } from '~/icehouse/activities/IcehouseActivitiesSubTabs';

// Icehouse fork — HubSpot's Activities tab chrome on top of upstream's
// timeline. Mounted by TimelineCard in place of a bare <EventList>: it renders
// the sub-tab row and the "Search activities" box above the very same
// EventList, which keeps doing the type filtering / month grouping. The search
// narrows the events handed to EventList by the text their rows display, so it
// is purely client-side over the pages already loaded (the fetch-more loader
// below keeps paging while a match is scarce, exactly as when scrolling).
//
// Desktop record page and side panel (the tab row scrolls, the search box goes
// full width). On mobile the toolbar is skipped and EventList renders as
// upstream ships it.
//
// Not here: "Collapse all / Expand all". Each row's open state is a useState
// inside EventRowDynamicComponent / EventRowGenericLinked /
// EventRowMainObjectUpdated (not lifted), so driving it would mean editing
// row internals — deliberately left out.

const StyledToolbar = styled.div`
  align-self: stretch;
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  position: sticky;
  top: 0;
  z-index: 3;
`;

const StyledSearchRow = styled.div`
  display: flex;
`;

type IcehouseActivitiesTimelineProps = {
  targetableObject: ActivityTargetableObject;
  title: string;
  events: TimelineActivity[];
  linkedRecords: ObjectRecord[];
};

export const IcehouseActivitiesTimeline = ({
  targetableObject,
  title,
  events,
  linkedRecords,
}: IcehouseActivitiesTimelineProps) => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const { isInSidePanel } = useLayoutRenderingContext();
  const [searchValue, setSearchValue] = useState('');

  const { objectMetadataItem: mainObjectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetableObject.targetObjectNameSingular,
  });
  const { objectMetadataItems } = useObjectMetadataItems();
  const { timelineActivityTypeMaps } = useTimelineActivityTypes();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const recordStore = useAtomFamilyStateValue(
    recordStoreFamilyState,
    targetableObject.id,
  );

  const mainRecordLabel = isDefined(recordStore)
    ? getObjectRecordIdentifier({
        objectMetadataItem: mainObjectMetadataItem,
        record: recordStore,
        allowRequestsToTwentyIcons: false,
      }).name
    : undefined;

  // The same records TimelineCard upserts into the store for the rows; their
  // label identifier is what EventRowGenericLinked prints as the linked name.
  const linkedRecordNameById = useMemo(() => {
    const objectMetadataItemByNameSingular = new Map(
      objectMetadataItems.map((objectMetadataItem) => [
        objectMetadataItem.nameSingular,
        objectMetadataItem,
      ]),
    );
    const nameById = new Map<string, string>();

    for (const linkedRecord of linkedRecords) {
      const objectMetadataItem = objectMetadataItemByNameSingular.get(
        uncapitalize(linkedRecord.__typename ?? ''),
      );

      if (!isDefined(objectMetadataItem)) {
        continue;
      }

      nameById.set(
        linkedRecord.id,
        getObjectRecordIdentifier({
          objectMetadataItem,
          record: linkedRecord,
          allowRequestsToTwentyIcons: false,
        }).name,
      );
    }

    return nameById;
  }, [linkedRecords, objectMetadataItems]);

  const searchTexts = useMemo(
    () =>
      events.map((event) =>
        getIcehouseActivitySearchText({
          event,
          timelineActivityTypeMaps,
          objectMetadataItems,
          mainObjectMetadataItem,
          mainRecordLabel,
          linkedRecordNameById,
          currentWorkspaceMember,
        }),
      ),
    [
      events,
      timelineActivityTypeMaps,
      objectMetadataItems,
      mainObjectMetadataItem,
      mainRecordLabel,
      linkedRecordNameById,
      currentWorkspaceMember,
    ],
  );

  if (isMobile) {
    return (
      <EventList
        targetableObject={targetableObject}
        title={title}
        events={events}
      />
    );
  }

  const searchTerms = getIcehouseActivitySearchTerms(searchValue);
  const isSearching = searchTerms.length > 0;

  const searchedEvents = isSearching
    ? events.filter((_event, index) =>
        matchesIcehouseActivitySearch(searchTexts[index], searchTerms),
      )
    : events;

  return (
    <>
      <StyledToolbar
        data-icehouse="activities"
        data-icehouse-context={isInSidePanel ? 'side-panel' : 'page'}
      >
        <IcehouseActivitiesSubTabs targetRecordId={targetableObject.id} />
        <StyledSearchRow data-icehouse-part="search-row">
          <IcehouseActivitiesSearchInput
            value={searchValue}
            onChange={setSearchValue}
            fullWidth={isInSidePanel}
          />
        </StyledSearchRow>
      </StyledToolbar>
      {isSearching && searchedEvents.length === 0 ? (
        <AnimatedPlaceholderEmptyContainer>
          <AnimatedPlaceholderEmptyTextContainer>
            <AnimatedPlaceholderEmptyTitle>
              {t`No matching activity`}
            </AnimatedPlaceholderEmptyTitle>
            <AnimatedPlaceholderEmptySubTitle>
              {t`No loaded activity matches "${searchValue}".`}
            </AnimatedPlaceholderEmptySubTitle>
          </AnimatedPlaceholderEmptyTextContainer>
        </AnimatedPlaceholderEmptyContainer>
      ) : (
        <EventList
          targetableObject={targetableObject}
          title={title}
          events={searchedEvents}
        />
      )}
    </>
  );
};
