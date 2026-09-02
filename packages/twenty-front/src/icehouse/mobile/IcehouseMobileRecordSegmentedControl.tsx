import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type IcehouseMobileRecordSegment } from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';

// The phone record page's segmented control: About · Activities · Related as
// equal-width 44px tabs on one underline, the way HubSpot's app switches
// between a record's faces. Pure presentation: the page decides which
// segments exist and which one is on, and reacts to the tap.
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
  height: 44px;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  padding: 0 ${themeCssVariables.spacing[2]};
  text-overflow: ellipsis;
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

export type IcehouseMobileRecordSegmentOption = {
  id: IcehouseMobileRecordSegment;
  label: string;
};

type IcehouseMobileRecordSegmentedControlProps = {
  segments: IcehouseMobileRecordSegmentOption[];
  activeSegment: IcehouseMobileRecordSegment | undefined;
  onSegmentChange: (segment: IcehouseMobileRecordSegment) => void;
};

export const IcehouseMobileRecordSegmentedControl = ({
  segments,
  activeSegment,
  onSegmentChange,
}: IcehouseMobileRecordSegmentedControlProps) => {
  const { t } = useLingui();

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
            onClick={() => onSegmentChange(segment.id)}
          >
            {segment.label}
          </StyledSegment>
        );
      })}
    </StyledSegments>
  );
};
