import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { useCallback } from 'react';

export const useHandleIndexIdentifierClick = ({
  objectMetadataItem,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );

  const objectNameSingular = objectMetadataItem.nameSingular;

  // Icehouse (perf): stable identity, it is part of RecordIndexContext.
  const indexIdentifierUrl = useCallback(
    (recordId: string) => {
      return getAppPath(
        AppPath.RecordShowPage,
        {
          objectNameSingular,
          objectRecordId: recordId,
        },
        {
          viewId: contextStoreCurrentViewId,
        },
      );
    },
    [objectNameSingular, contextStoreCurrentViewId],
  );

  return { indexIdentifierUrl };
};
