import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { ObjectSortDropdownButton } from '@/object-record/object-sort-dropdown/components/ObjectSortDropdownButton';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { recordIndexViewTypeState } from '@/object-record/record-index/states/recordIndexViewTypeState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ViewType } from '@/views/types/ViewType';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IcehouseMobileViewChips } from '~/icehouse/mobile/IcehouseMobileViewChips';
import { IcehouseIndexToolbarFilterButton } from '~/icehouse/toolbar/IcehouseIndexToolbarFilterButton';
import { IcehouseIndexToolbarSearchInput } from '~/icehouse/toolbar/IcehouseIndexToolbarSearchInput';

// The phone's compact index toolbar: search | Filter (count) | Sort | Options,
// then the saved views as a chip row. Rendered by IcehouseIndexToolbar inside
// ViewBar's bottom slot (so it sits above the scrolling body and stays put),
// which also keeps it inside ViewBar's sort-dropdown instance provider.
//
// Filter, Sort and Options are upstream's own components with their fixed
// dropdown ids — the same instances the desktop toolbar and ViewBar's TopBar
// row mount — so they must exist exactly once: IcehouseViewBarUpstreamActions
// keeps upstream's copies out, and icehouse.css collapses the now-empty TopBar
// row (the view picker inside it stays mounted, hidden, for the chip row's "+").
//
// Geometry (44px targets, 16px input text so iOS does not zoom) and HubSpot's
// light palette come from icehouse.css on data-icehouse="mobile-toolbar".

const StyledToolbar = styled.div`
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-left: calc(-1 * ${themeCssVariables.spacing[3]});
  padding-top: ${themeCssVariables.spacing[2]};
  width: calc(100% + ${themeCssVariables.spacing[3]});
`;

const StyledControls = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledControl = styled.span`
  display: flex;
  flex-shrink: 0;
`;

type IcehouseMobileIndexToolbarProps = {
  viewBarId: string;
};

export const IcehouseMobileIndexToolbar = ({
  viewBarId,
}: IcehouseMobileIndexToolbarProps) => {
  const { recordIndexId, objectMetadataItem } = useRecordIndexContextOrThrow();

  const recordIndexViewType = useAtomStateValue(recordIndexViewTypeState);

  return (
    <StyledToolbar data-icehouse="mobile-toolbar">
      <StyledControls data-icehouse-part="controls">
        <IcehouseIndexToolbarSearchInput viewBarId={viewBarId} />
        <StyledControl data-icehouse-part="filter">
          <IcehouseIndexToolbarFilterButton viewBarId={viewBarId} />
        </StyledControl>
        <StyledControl data-icehouse-part="sort">
          <ObjectSortDropdownButton />
        </StyledControl>
        <StyledControl data-icehouse-part="options">
          <ObjectOptionsDropdown
            recordIndexId={recordIndexId}
            objectMetadataItem={objectMetadataItem}
            viewType={recordIndexViewType ?? ViewType.TABLE}
          />
        </StyledControl>
      </StyledControls>
      <IcehouseMobileViewChips />
    </StyledToolbar>
  );
};
