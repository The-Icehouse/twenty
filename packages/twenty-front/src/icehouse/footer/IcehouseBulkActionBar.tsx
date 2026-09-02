import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { CommandMenuContextProvider } from '@/command-menu-item/contexts/CommandMenuContextProvider';
import { CommandMenuItemContainerType } from '@/command-menu-item/types/CommandMenuItemContainerType';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useResetTableRowSelection } from '@/object-record/record-table/hooks/internal/useResetTableRowSelection';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';
import { IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { CommandMenuItemAvailabilityType } from '~/generated-metadata/graphql';
import { IcehouseCommandMenuItemButton } from '~/icehouse/footer/IcehouseCommandMenuItemButton';

// Floats above the footer, centred over the last rows of the table. The footer is
// position: relative, so bottom: 100% anchors the bar to the footer's top edge.
const StyledBar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  bottom: calc(100% + ${themeCssVariables.spacing[3]});
  box-shadow: ${themeCssVariables.boxShadow.strong};
  box-sizing: border-box;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  left: 50%;
  max-width: calc(100% - ${themeCssVariables.spacing[6]});
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  position: absolute;
  transform: translateX(-50%);
  z-index: 20;
`;

const StyledSelectedCount = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  white-space: nowrap;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

// The pinned RECORD_SELECTION items as buttons: the same list the header shows, read
// from the same CommandMenuContextProvider the header mounts. Unpinned selection
// items stay in the header's "..." dropdown; an admin pins more via the in-app
// command-menu editor and they appear here with no code change.
const IcehouseBulkActions = () => {
  const { commandMenuItems } = useContext(CommandMenuContext);

  const pinnedSelectionItems = commandMenuItems.filter(
    (item) =>
      item.isPinned &&
      item.availabilityType ===
        CommandMenuItemAvailabilityType.RECORD_SELECTION,
  );

  return (
    <>
      {pinnedSelectionItems.map((item) => (
        <IcehouseCommandMenuItemButton key={item.id} item={item} />
      ))}
    </>
  );
};

type IcehouseBulkActionBarProps = {
  recordTableId: string;
  numberOfSelectedRecords: number;
};

export const IcehouseBulkActionBar = ({
  recordTableId,
  numberOfSelectedRecords,
}: IcehouseBulkActionBarProps) => {
  const { t } = useLingui();
  const { formatNumber } = useNumberFormat();

  // Same reset the header's actions use after they complete: unticks every row,
  // clears select-all and closes the index command dropdown.
  const { resetTableRowSelection } = useResetTableRowSelection(recordTableId);

  return (
    <StyledBar data-icehouse="bulk-bar" data-select-disable="true">
      <StyledSelectedCount>
        {t`${formatNumber(numberOfSelectedRecords)} selected`}
      </StyledSelectedCount>
      <StyledActions>
        <CommandMenuContextProvider
          isInSidePanel={false}
          displayType="button"
          containerType={CommandMenuItemContainerType.IndexPageHeader}
        >
          <IcehouseBulkActions />
        </CommandMenuContextProvider>
      </StyledActions>
      <Button
        Icon={IconX}
        title={t`Clear`}
        size="small"
        variant="tertiary"
        onClick={resetTableRowSelection}
      />
    </StyledBar>
  );
};
