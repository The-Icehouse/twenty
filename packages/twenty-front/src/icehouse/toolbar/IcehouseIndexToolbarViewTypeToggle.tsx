import { useSetViewTypeFromLayoutOptionsMenu } from '@/object-record/object-options-dropdown/hooks/useSetViewTypeFromLayoutOptionsMenu';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { ViewKey } from '@/views/types/ViewKey';
import { ViewType } from '@/views/types/ViewType';
import { useGetAvailableFieldsToGroupRecordsBy } from '@/views/view-picker/hooks/useGetAvailableFieldsToGroupRecordsBy';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useId } from 'react';
import { IconLayoutKanban, IconTable } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { AppTooltip, TooltipDelay, TooltipPosition } from 'twenty-ui/surfaces';

const StyledToggleGroup = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
`;

// Table / board icons over upstream's view-type switch. Twenty persists the
// switch on the shared view (it is not a transient mode), hence the explicit
// "Switch view to …" labels. Kanban is refused on the default INDEX view and
// needs a SELECT field to group by, exactly as ObjectOptionsDropdownLayoutContent.
export const IcehouseIndexToolbarViewTypeToggle = () => {
  const { t } = useLingui();
  const tooltipAnchorId = useId();

  const { currentView } = useGetCurrentViewOnly();
  const { availableFieldsForGrouping } =
    useGetAvailableFieldsToGroupRecordsBy();
  const { setAndPersistViewType } = useSetViewTypeFromLayoutOptionsMenu();

  const currentViewType = currentView?.type;
  const isDefaultView = currentView?.key === ViewKey.INDEX;
  const hasGroupableField = availableFieldsForGrouping.length > 0;
  const isBoardDisabled = isDefaultView || !hasGroupableField;

  const tableTooltip = t`Switch view to table`;
  const boardTooltip = isDefaultView
    ? t`Board is not available for the default view`
    : !hasGroupableField
      ? t`Board needs a Select field to group by`
      : t`Switch view to board (saved on this view for everyone)`;

  const handleTableClick = async () => {
    if (currentViewType !== ViewType.TABLE) {
      await setAndPersistViewType(ViewType.TABLE);
    }
  };

  const handleBoardClick = async () => {
    if (isBoardDisabled || currentViewType === ViewType.KANBAN) {
      return;
    }
    await setAndPersistViewType(ViewType.KANBAN);
  };

  const tableAnchorId = `${tooltipAnchorId}-table`;
  const boardAnchorId = `${tooltipAnchorId}-board`;

  return (
    <StyledToggleGroup
      data-icehouse="view-type-toggle"
      role="group"
      aria-label={t`View type`}
    >
      <span
        data-tooltip-id={tableAnchorId}
        data-active={currentViewType === ViewType.TABLE || undefined}
      >
        <IconButton
          Icon={IconTable}
          variant="secondary"
          size="medium"
          position="left"
          ariaLabel={tableTooltip}
          onClick={handleTableClick}
        />
      </span>
      <span
        data-tooltip-id={boardAnchorId}
        data-active={currentViewType === ViewType.KANBAN || undefined}
      >
        <IconButton
          Icon={IconLayoutKanban}
          variant="secondary"
          size="medium"
          position="right"
          ariaLabel={t`Switch view to board`}
          disabled={isBoardDisabled}
          onClick={handleBoardClick}
        />
      </span>
      <AppTooltip
        anchorSelect={`[data-tooltip-id='${tableAnchorId}']`}
        content={tableTooltip}
        place={TooltipPosition.Bottom}
        delay={TooltipDelay.shortDelay}
        noArrow
      />
      <AppTooltip
        anchorSelect={`[data-tooltip-id='${boardAnchorId}']`}
        content={boardTooltip}
        place={TooltipPosition.Bottom}
        delay={TooltipDelay.shortDelay}
        noArrow
      />
    </StyledToggleGroup>
  );
};
