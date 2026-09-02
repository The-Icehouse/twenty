import { ObjectSortDropdownButton } from '@/object-record/object-sort-dropdown/components/ObjectSortDropdownButton';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IcehouseIndexToolbarColumnsDropdown } from '~/icehouse/toolbar/IcehouseIndexToolbarColumnsDropdown';
import { IcehouseIndexToolbarFilterButton } from '~/icehouse/toolbar/IcehouseIndexToolbarFilterButton';
import { IcehouseIndexToolbarSearchInput } from '~/icehouse/toolbar/IcehouseIndexToolbarSearchInput';
import { IcehouseIndexToolbarViewTypeToggle } from '~/icehouse/toolbar/IcehouseIndexToolbarViewTypeToggle';

const StyledToolbar = styled.div`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  min-height: 44px;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[1]} 0;
`;

const StyledGroup = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[2]};
`;

type IcehouseIndexToolbarProps = {
  viewBarId: string;
};

// HubSpot's index toolbar: search | Filter (count) | Sort … table/board | columns.
// Desktop only. Every dropdown here is upstream's own component or upstream's
// dropdown id, so Update view / Reset in ViewBarDetails keep working unchanged.
export const IcehouseIndexToolbar = ({
  viewBarId,
}: IcehouseIndexToolbarProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <StyledToolbar data-icehouse="index-toolbar">
      <StyledGroup>
        <IcehouseIndexToolbarSearchInput viewBarId={viewBarId} />
        <IcehouseIndexToolbarFilterButton viewBarId={viewBarId} />
        <span data-icehouse="sort-button">
          <ObjectSortDropdownButton />
        </span>
      </StyledGroup>
      <StyledGroup>
        <IcehouseIndexToolbarViewTypeToggle />
        <IcehouseIndexToolbarColumnsDropdown />
      </StyledGroup>
    </StyledToolbar>
  );
};
