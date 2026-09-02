import { CombinedGraphQLErrors } from '@apollo/client/errors';

import { useIsHeadlessEngineCommandEffectInitialized } from '@/command-menu-item/engine-command/hooks/useIsHeadlessEngineCommandEffectInitialized';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import { useBuildRecordInputFromRLSPredicates } from '@/object-record/hooks/useBuildRecordInputFromRLSPredicates';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useResolveOpenRecordIn } from '@/object-record/record-index/hooks/useResolveOpenRecordIn';
import { newRecordTitleCellToOpenState } from '@/object-record/record-title-cell/states/newRecordTitleCellToOpenState';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useEffect } from 'react';
import { AppPath, OpenRecordIn } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { useNavigateApp } from '~/hooks/useNavigateApp';

type IcehouseTopBarCreateRecordEffectProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  onDone: () => void;
};

// Headless. The "+" dropdown mounts this for the chosen object; it creates a
// blank record on mount, opens it, and asks to be unmounted. It is the
// CREATE_NEW_RECORD path (useCreateNewIndexRecord) minus the index-only parts:
// there are no view filters to prefill from and no record-group list to splice
// into, so the record input is the RLS predicates alone, and the open target
// follows the object's openRecordIn / the member's preference exactly as the
// index command does. useCreateOneRecord binds to one object at hook time,
// which is why this is a component keyed by the object rather than a hook in
// the dropdown. The initialised ref is upstream's own StrictMode guard.
export const IcehouseTopBarCreateRecordEffect = ({
  objectMetadataItem,
  onDone,
}: IcehouseTopBarCreateRecordEffectProps) => {
  const { isInitializedRef, setIsInitialized } =
    useIsHeadlessEngineCommandEffectInitialized();

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
  });

  const { buildRecordInputFromRLSPredicates } =
    useBuildRecordInputFromRLSPredicates({ objectMetadataItem });

  const openRecordIn = useResolveOpenRecordIn(objectMetadataItem.nameSingular);

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { closeSidePanelMenu } = useSidePanelMenu();
  const setNewRecordTitleCellToOpen = useSetAtomState(
    newRecordTitleCellToOpenState,
  );
  const navigate = useNavigateApp();
  const { enqueueErrorSnackBar } = useSnackBar();

  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }

    setIsInitialized(true);

    const run = async () => {
      try {
        const recordId = v4();

        await createOneRecord({
          id: recordId,
          ...buildRecordInputFromRLSPredicates(),
        });

        if (openRecordIn === OpenRecordIn.SIDE_PANEL) {
          openRecordInSidePanel({
            recordId,
            objectNameSingular: objectMetadataItem.nameSingular,
            isNewRecord: true,
          });
          return;
        }

        const labelIdentifierFieldMetadataItem =
          getLabelIdentifierFieldMetadataItem(objectMetadataItem);

        if (isDefined(labelIdentifierFieldMetadataItem)) {
          setNewRecordTitleCellToOpen({
            recordId,
            fieldName: labelIdentifierFieldMetadataItem.name,
          });
        }

        closeSidePanelMenu();
        navigate(AppPath.RecordShowPage, {
          objectNameSingular: objectMetadataItem.nameSingular,
          objectRecordId: recordId,
        });
      } catch (error) {
        enqueueErrorSnackBar({
          ...(CombinedGraphQLErrors.is(error) ? { apolloError: error } : {}),
        });
      } finally {
        onDone();
      }
    };

    void run();
  }, [
    buildRecordInputFromRLSPredicates,
    closeSidePanelMenu,
    createOneRecord,
    enqueueErrorSnackBar,
    isInitializedRef,
    navigate,
    objectMetadataItem,
    onDone,
    openRecordIn,
    openRecordInSidePanel,
    setIsInitialized,
    setNewRecordTitleCellToOpen,
  ]);

  return null;
};
