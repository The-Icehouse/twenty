import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DROPDOWN_OFFSET_Y } from '@/ui/layout/dropdown/constants/DropdownOffsetY';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconChevronDown } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { ICEHOUSE_MOBILE_RECORD_MORE_DROPDOWN_ID } from '~/icehouse/mobile/constants/IcehouseMobileRecordMoreDropdownId';
import { IcehouseMobileRecordMorePicker } from '~/icehouse/mobile/IcehouseMobileRecordMorePicker';
import {
  type IcehouseMobileRecordExtraTab,
  type IcehouseMobileRecordSegment,
  type IcehouseMobileRecordSegmentSelection,
} from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';

// The phone record page's segmented control: About · Activities · Related ·
// More as equal-width 44px tabs on one underline, the way HubSpot's app
// switches between a record's faces. Pure presentation: the page decides
// which segments exist and which one is on, and reacts to the tap.
//
// More is upstream's Dropdown anchored to its own segment: tapping it opens a
// picker of the layout's remaining tabs (IcehouseMobileRecordMorePicker); once
// a tab is picked the segment shows that tab's title with a chevron and is
// marked active, and tapping it again re-opens the picker. Upstream's Dropdown
// wraps its clickable in a div (role=button, aria-haspopup); StyledSegments
// sizes that wrapper as one more segment cell so the button fills it.
//
// Stable CSS hooks: the row carries data-icehouse-part="segments"; each
// button data-icehouse-part="segment", data-icehouse-segment (its id) and
// data-active when selected. Theme tokens paint both modes; HubSpot's light
// palette (teal underline) lives in icehouse.css under `mobile-record`.

const StyledSegments = styled.div`
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  user-select: none;
  width: 100%;

  & > [role='button'][aria-haspopup] {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
  }
`;

const StyledSegment = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex: 1 1 0;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: 44px;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  padding: 0 ${themeCssVariables.spacing[2]};
  white-space: nowrap;

  &:focus-visible {
    outline: 1px solid ${themeCssVariables.color.blue};
    outline-offset: -1px;
  }

  &[data-active] {
    border-bottom-color: ${themeCssVariables.font.color.primary};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledSegmentLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export type IcehouseMobileRecordSegmentOption = {
  id: Exclude<IcehouseMobileRecordSegment, 'more'>;
  label: string;
};

type IcehouseMobileRecordSegmentedControlProps = {
  segments: IcehouseMobileRecordSegmentOption[];
  isMoreSegmentShown: boolean;
  moreTabs: IcehouseMobileRecordExtraTab[];
  activeSegment: IcehouseMobileRecordSegment | undefined;
  activeMoreTab: IcehouseMobileRecordExtraTab | undefined;
  onSegmentChange: (selection: IcehouseMobileRecordSegmentSelection) => void;
};

export const IcehouseMobileRecordSegmentedControl = ({
  segments,
  isMoreSegmentShown,
  moreTabs,
  activeSegment,
  activeMoreTab,
  onSegmentChange,
}: IcehouseMobileRecordSegmentedControlProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  const isMoreActive = activeSegment === 'more';

  return (
    <StyledSegments
      role="tablist"
      aria-label={t`Record sections`}
      data-icehouse-part="segments"
    >
      {segments.map((segment) => {
        const isActive = segment.id === activeSegment;

        return (
          <StyledSegment
            key={segment.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-icehouse-part="segment"
            data-icehouse-segment={segment.id}
            data-active={isActive || undefined}
            onClick={() => onSegmentChange({ segment: segment.id })}
          >
            <StyledSegmentLabel>{segment.label}</StyledSegmentLabel>
          </StyledSegment>
        );
      })}
      {isMoreSegmentShown && (
        <Dropdown
          dropdownId={ICEHOUSE_MOBILE_RECORD_MORE_DROPDOWN_ID}
          dropdownPlacement="bottom-end"
          dropdownOffset={{ y: DROPDOWN_OFFSET_Y }}
          clickableComponent={
            <StyledSegment
              type="button"
              role="tab"
              aria-selected={isMoreActive}
              data-icehouse-part="segment"
              data-icehouse-segment="more"
              data-active={isMoreActive || undefined}
            >
              <StyledSegmentLabel>
                {activeMoreTab?.title ?? t`More`}
              </StyledSegmentLabel>
              <IconChevronDown size={theme.icon.size.sm} aria-hidden />
            </StyledSegment>
          }
          dropdownComponents={
            <IcehouseMobileRecordMorePicker
              tabs={moreTabs}
              activeTabId={activeMoreTab?.id}
              onPick={(tabId) => onSegmentChange({ segment: 'more', tabId })}
            />
          }
        />
      )}
    </StyledSegments>
  );
};
