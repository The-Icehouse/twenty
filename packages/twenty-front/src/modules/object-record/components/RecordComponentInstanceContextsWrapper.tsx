import { RecordCalendarComponentInstanceContext } from '@/object-record/record-calendar/states/contexts/RecordCalendarComponentInstanceContext';
import { RecordFieldsComponentInstanceContext } from '@/object-record/record-field/states/context/RecordFieldsComponentInstanceContext';
import { RecordListComponentInstanceContext } from '@/object-record/record-list/states/contexts/RecordListComponentInstanceContext';
import { RecordFilterGroupsComponentInstanceContext } from '@/object-record/record-filter-group/states/context/RecordFilterGroupsComponentInstanceContext';
import { RecordFiltersComponentInstanceContext } from '@/object-record/record-filter/states/context/RecordFiltersComponentInstanceContext';
import { RecordSortsComponentInstanceContext } from '@/object-record/record-sort/states/context/RecordSortsComponentInstanceContext';
import { type PropsWithChildren, useMemo } from 'react';

export type RecordComponentInstanceContextsWrapperProps = PropsWithChildren<{
  componentInstanceId: string;
}>;

export const RecordComponentInstanceContextsWrapper = ({
  componentInstanceId,
  children,
}: RecordComponentInstanceContextsWrapperProps) => {
  // Icehouse (perf): one memoised value for all six instance contexts, so a
  // parent render does not re-render every component-state consumer below.
  const instanceContextValue = useMemo(
    () => ({ instanceId: componentInstanceId }),
    [componentInstanceId],
  );

  return (
    <RecordFilterGroupsComponentInstanceContext.Provider
      value={instanceContextValue}
    >
      <RecordFiltersComponentInstanceContext.Provider
        value={instanceContextValue}
      >
        <RecordSortsComponentInstanceContext.Provider
          value={instanceContextValue}
        >
          <RecordFieldsComponentInstanceContext.Provider
            value={instanceContextValue}
          >
            <RecordCalendarComponentInstanceContext.Provider
              value={instanceContextValue}
            >
              <RecordListComponentInstanceContext.Provider
                value={instanceContextValue}
              >
                {children}
              </RecordListComponentInstanceContext.Provider>
            </RecordCalendarComponentInstanceContext.Provider>
          </RecordFieldsComponentInstanceContext.Provider>
        </RecordSortsComponentInstanceContext.Provider>
      </RecordFiltersComponentInstanceContext.Provider>
    </RecordFilterGroupsComponentInstanceContext.Provider>
  );
};
