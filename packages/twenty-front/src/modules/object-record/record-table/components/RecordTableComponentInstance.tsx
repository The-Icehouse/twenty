import { type ReactNode, useMemo } from 'react';

import { RecordTableComponentInstanceContext } from '@/object-record/record-table/states/context/RecordTableComponentInstanceContext';

type RecordTableComponentInstanceProps = {
  children: ReactNode;
  recordTableId: string;
};

export const RecordTableComponentInstance = ({
  children,
  recordTableId,
}: RecordTableComponentInstanceProps) => {
  // Icehouse (perf): every component-state hook in the table reads this
  // context; an inline object re-rendered all of them on each parent render.
  const instanceContextValue = useMemo(
    () => ({ instanceId: recordTableId }),
    [recordTableId],
  );

  return (
    <RecordTableComponentInstanceContext.Provider value={instanceContextValue}>
      {children}
    </RecordTableComponentInstanceContext.Provider>
  );
};
