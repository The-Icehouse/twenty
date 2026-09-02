import { ObjectFilterDropdownComponentInstanceContext } from '@/object-record/object-filter-dropdown/states/contexts/ObjectFilterDropdownComponentInstanceContext';
import { useCheckIsSoftDeleteFilter } from '@/object-record/record-filter/hooks/useCheckIsSoftDeleteFilter';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { useToggleDropdown } from '@/ui/layout/dropdown/hooks/useToggleDropdown';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { ViewBarFilterDropdown } from '@/views/components/ViewBarFilterDropdown';
import { ViewBarFilterDropdownIds } from '@/views/constants/ViewBarFilterDropdownIds';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFilterButtonContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
`;

const StyledFilterCountBadge = styled.button`
  align-items: center;
  background: ${themeCssVariables.color.blue};
  border: none;
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 16px;
  justify-content: center;
  line-height: 16px;
  min-width: 16px;
  padding: 0 ${themeCssVariables.spacing[1]};
`;

type IcehouseIndexToolbarFilterButtonProps = {
  viewBarId: string;
};

// Upstream's own Filter dropdown (ViewBarFilterDropdown, dropdown id
// ViewBarFilterDropdownIds.MAIN) rendered as-is, plus a count badge for the
// active filters. The badge toggles the same dropdown through useToggleDropdown.
export const IcehouseIndexToolbarFilterButton = ({
  viewBarId,
}: IcehouseIndexToolbarFilterButtonProps) => {
  const { t } = useLingui();

  const currentRecordFilters = useAtomComponentStateValue(
    currentRecordFiltersComponentState,
    viewBarId,
  );

  const { isSeeDeletedRecordsFilter } = useCheckIsSoftDeleteFilter();

  const { toggleDropdown } = useToggleDropdown();

  // The "Deleted" trash toggle is a record filter too; HubSpot does not count it.
  const activeFilterCount = currentRecordFilters.filter(
    (recordFilter) => !isSeeDeletedRecordsFilter(recordFilter),
  ).length;

  const handleBadgeClick = () => {
    toggleDropdown({
      dropdownComponentInstanceIdFromProps: ViewBarFilterDropdownIds.MAIN,
    });
  };

  return (
    <StyledFilterButtonContainer
      data-icehouse="filter-button"
      data-active={activeFilterCount > 0 || undefined}
    >
      <ObjectFilterDropdownComponentInstanceContext.Provider
        value={{ instanceId: ViewBarFilterDropdownIds.MAIN }}
      >
        <ViewBarFilterDropdown />
      </ObjectFilterDropdownComponentInstanceContext.Provider>
      {activeFilterCount > 0 && (
        <StyledFilterCountBadge
          type="button"
          data-icehouse="filter-count"
          aria-label={t`${activeFilterCount} active filters`}
          onClick={handleBadgeClick}
        >
          {activeFilterCount}
        </StyledFilterCountBadge>
      )}
    </StyledFilterButtonContainer>
  );
};
