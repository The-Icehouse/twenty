import { RecordTableBodyContextProvider } from '@/object-record/record-table/contexts/RecordTableBodyContext';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useRecordTableMoveFocusedCell } from '@/object-record/record-table/hooks/useRecordTableMoveFocusedCell';
import { useCloseRecordTableCellNoGroup } from '@/object-record/record-table/record-table-cell/hooks/internal/useCloseRecordTableCellNoGroup';
import { useMoveHoverToCurrentCell } from '@/object-record/record-table/record-table-cell/hooks/useMoveHoverToCurrentCell';
import {
  type OpenTableCellArgs,
  useOpenRecordTableCell,
} from '@/object-record/record-table/record-table-cell/hooks/useOpenRecordTableCell';
import { useTriggerCommandMenuDropdown } from '@/object-record/record-table/record-table-cell/hooks/useTriggerCommandMenuDropdown';
import { hasUserSelectedAllRowsComponentState } from '@/object-record/record-table/record-table-row/states/hasUserSelectedAllRowsFamilyState';
import { type MoveFocusDirection } from '@/object-record/record-table/types/MoveFocusDirection';
import { type TableCellPosition } from '@/object-record/record-table/types/TableCellPosition';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { type ReactNode, useMemo } from 'react';
import { useLatestCallback } from '~/icehouse/perf/useLatestCallback';

type RecordTableNoRecordGroupBodyContextProviderProps = {
  children?: ReactNode;
};

export const RecordTableNoRecordGroupBodyContextProvider = ({
  children,
}: RecordTableNoRecordGroupBodyContextProviderProps) => {
  const { recordTableId } = useRecordTableContextOrThrow();

  const { openTableCell } = useOpenRecordTableCell(recordTableId);

  // Icehouse (perf): stable handlers + memoised value, so the loading-state
  // flips that re-render this provider do not re-render every cell below.
  const handleOpenTableCell = useLatestCallback((args: OpenTableCellArgs) => {
    openTableCell(args);
  });

  const { moveFocus } = useRecordTableMoveFocusedCell(recordTableId);

  const handleMoveFocus = useLatestCallback((direction: MoveFocusDirection) => {
    moveFocus(direction);
  });

  const { closeTableCellNoGroup } = useCloseRecordTableCellNoGroup();

  const handleCloseTableCell = useLatestCallback(() => {
    closeTableCellNoGroup();
  });

  const { moveHoverToCurrentCell } = useMoveHoverToCurrentCell(recordTableId);

  const handleMoveHoverToCurrentCell = useLatestCallback(
    (cellPosition: TableCellPosition) => {
      moveHoverToCurrentCell(cellPosition);
    },
  );

  const { triggerCommandMenuDropdown } = useTriggerCommandMenuDropdown({
    recordTableId,
  });

  const handleCommandMenuDropdown = useLatestCallback(
    (event: React.MouseEvent, recordId: string) => {
      triggerCommandMenuDropdown(event, recordId);
    },
  );

  const hasUserSelectedAllRows = useAtomComponentStateValue(
    hasUserSelectedAllRowsComponentState,
    recordTableId,
  );

  const recordTableBodyContextValue = useMemo(
    () => ({
      onOpenTableCell: handleOpenTableCell,
      onMoveFocus: handleMoveFocus,
      onCloseTableCell: handleCloseTableCell,
      onMoveHoverToCurrentCell: handleMoveHoverToCurrentCell,
      onCommandMenuDropdownOpened: handleCommandMenuDropdown,
      hasUserSelectedAllRows,
    }),
    [
      handleOpenTableCell,
      handleMoveFocus,
      handleCloseTableCell,
      handleMoveHoverToCurrentCell,
      handleCommandMenuDropdown,
      hasUserSelectedAllRows,
    ],
  );

  return (
    <RecordTableBodyContextProvider value={recordTableBodyContextValue}>
      {children}
    </RecordTableBodyContextProvider>
  );
};
