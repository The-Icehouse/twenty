import { useTimelineActivityTypeFilter } from '@/activities/timeline-activities/hooks/useTimelineActivityTypeFilter';
import { timelineActivityTypeUniversalIdentifiersFilterFamilyState } from '@/activities/timeline-activities/states/timelineActivityTypeUniversalIdentifiersFilterFamilyState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useSetAtomFamilyState } from '@/ui/utilities/state/jotai/hooks/useSetAtomFamilyState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { getIcehouseActivitySubTabs } from '~/icehouse/activities/getIcehouseActivitySubTabs';

// HubSpot's Activities sub-tabs (All · Notes · Emails · Tasks · Meetings · Files).
// They are a second face of upstream's timeline activity-type filter: a tab
// writes the same per-record selection the widget header's "Filter timeline"
// dropdown writes, so both stay in sync and EventList filters as it always did.
// "All" clears the selection (upstream's "no filter" value).
//
// Stable CSS hooks: the row carries data-icehouse-part="sub-tabs"; each tab
// carries data-icehouse-tab (= "all" or the object's universal identifier) and
// data-active when the current selection sits inside that tab's types.

const StyledTabRow = styled.div`
  align-items: stretch;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  user-select: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledTab = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: ${themeCssVariables.spacing[9]};
  padding: 0 ${themeCssVariables.spacing[3]};
  white-space: nowrap;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 1px solid ${themeCssVariables.color.blue};
    outline-offset: -1px;
  }

  &[data-active] {
    border-bottom-color: ${themeCssVariables.font.color.primary};
    color: ${themeCssVariables.font.color.primary};
  }
`;

type IcehouseActivitiesSubTabsProps = {
  targetRecordId: string;
};

export const IcehouseActivitiesSubTabs = ({
  targetRecordId,
}: IcehouseActivitiesSubTabsProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();

  const {
    activeTimelineActivityTypes,
    selectedTimelineActivityTypeUniversalIdentifiers,
  } = useTimelineActivityTypeFilter(targetRecordId);

  const setTimelineActivityTypeUniversalIdentifiersFilter =
    useSetAtomFamilyState(
      timelineActivityTypeUniversalIdentifiersFilterFamilyState,
      targetRecordId,
    );

  const subTabs = useMemo(
    () =>
      getIcehouseActivitySubTabs({
        activeTimelineActivityTypes,
        objectMetadataItems,
      }),
    [activeTimelineActivityTypes, objectMetadataItems],
  );

  const isAllActive =
    selectedTimelineActivityTypeUniversalIdentifiers.length === 0;

  const isSubTabActive = (
    timelineActivityTypeUniversalIdentifiers: string[],
  ): boolean =>
    !isAllActive &&
    selectedTimelineActivityTypeUniversalIdentifiers.every(
      (universalIdentifier) =>
        timelineActivityTypeUniversalIdentifiers.includes(universalIdentifier),
    );

  return (
    <StyledTabRow
      role="tablist"
      aria-label={t`Activity types`}
      data-icehouse-part="sub-tabs"
    >
      <StyledTab
        type="button"
        role="tab"
        aria-selected={isAllActive}
        data-icehouse-tab="all"
        data-active={isAllActive || undefined}
        onClick={() => {
          if (!isAllActive) {
            setTimelineActivityTypeUniversalIdentifiersFilter([]);
          }
        }}
      >
        {t`All`}
      </StyledTab>
      {subTabs.map((subTab) => {
        const isActive = isSubTabActive(
          subTab.timelineActivityTypeUniversalIdentifiers,
        );

        return (
          <StyledTab
            key={subTab.objectUniversalIdentifier}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-icehouse-tab={subTab.objectUniversalIdentifier}
            data-active={isActive || undefined}
            title={subTab.label}
            onClick={() => {
              if (!isActive) {
                setTimelineActivityTypeUniversalIdentifiersFilter(
                  subTab.timelineActivityTypeUniversalIdentifiers,
                );
              }
            }}
          >
            {subTab.label}
          </StyledTab>
        );
      })}
    </StyledTabRow>
  );
};
