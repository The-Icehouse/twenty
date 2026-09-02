import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';
import { RecordTableRowVirtualizedDebugRowHelper } from '@/object-record/record-table/virtualization/components/RecordTableRowVirtualizedDebugRowHelper';
import { RecordTableRowVirtualizedRouterLevel1 } from '@/object-record/record-table/virtualization/components/RecordTableRowVirtualizedRouterLevel1';
import { TABLE_VIRTUALIZATION_DEBUG_ACTIVATED } from '@/object-record/record-table/virtualization/constants/TableVirtualizationDebugActivated';

import { realIndexByVirtualIndexComponentFamilyState } from '@/object-record/record-table/virtualization/states/realIndexByVirtualIndexComponentFamilyState';
import { totalNumberOfRecordsToVirtualizeComponentState } from '@/object-record/record-table/virtualization/states/totalNumberOfRecordsToVirtualizeComponentState';

import { useAtomComponentFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { memo } from 'react';
import { isDefined } from 'twenty-shared/utils';

const StyledVirtualizedRowContainer = styled.div<{
  pixelsFromTop: number;
}>`
  height: 33px;
  position: absolute;
  top: ${({ pixelsFromTop }) => pixelsFromTop}px;
`;

type RecordTableRowVirtualizedContainerUnmemoizedProps = {
  virtualIndex: number;
};

const RecordTableRowVirtualizedContainerUnmemoized = ({
  virtualIndex,
}: RecordTableRowVirtualizedContainerUnmemoizedProps) => {
  const realIndexByVirtualIndex = useAtomComponentFamilyStateValue(
    realIndexByVirtualIndexComponentFamilyState,
    { virtualIndex },
  );

  const totalNumberOfRecordsToVirtualize =
    useAtomComponentStateValue(
      totalNumberOfRecordsToVirtualizeComponentState,
    ) ?? 0;

  if (
    !isDefined(realIndexByVirtualIndex) ||
    realIndexByVirtualIndex >= totalNumberOfRecordsToVirtualize
  ) {
    return null;
  }

  const pixelsFromTop =
    realIndexByVirtualIndex * (RECORD_TABLE_ROW_HEIGHT + 1) +
    (RECORD_TABLE_ROW_HEIGHT + 1);

  return (
    <StyledVirtualizedRowContainer
      id={`row-virtual-index-${virtualIndex}`}
      pixelsFromTop={pixelsFromTop}
      data-replay-ignore-mutations="true"
    >
      {TABLE_VIRTUALIZATION_DEBUG_ACTIVATED && (
        <RecordTableRowVirtualizedDebugRowHelper virtualIndex={virtualIndex} />
      )}
      <RecordTableRowVirtualizedRouterLevel1
        realIndex={realIndexByVirtualIndex}
      />
    </StyledVirtualizedRowContainer>
  );
};

// Icehouse (perf): memoised so a re-render above the rows (view or loading
// state flips) does not cascade into all 120 virtual rows. Rows read everything
// from atoms and contexts; virtualIndex is a stable number.
export const RecordTableRowVirtualizedContainer = memo(
  RecordTableRowVirtualizedContainerUnmemoized,
);
