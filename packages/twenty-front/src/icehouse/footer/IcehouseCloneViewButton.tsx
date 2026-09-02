import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useOpenDropdown } from '@/ui/layout/dropdown/hooks/useOpenDropdown';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { VIEW_PICKER_DROPDOWN_ID } from '@/views/view-picker/constants/ViewPickerDropdownId';
import { useViewPickerMode } from '@/views/view-picker/hooks/useViewPickerMode';
import { viewPickerReferenceViewIdComponentState } from '@/views/view-picker/states/viewPickerReferenceViewIdComponentState';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconCopy } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

// HubSpot's "Clone" mapped onto Twenty's own view-picker flow: open the picker in
// 'create-from-current' mode with the current view as the reference — exactly what
// the view bar's "Save as new view" does (UpdateViewButtonGroup). The picker then
// copies fields, filters, sorts and the aggregate into the new view once the user
// names it; nothing is persisted before that confirmation.
export const IcehouseCloneViewButton = () => {
  const { t } = useLingui();
  const { viewBarInstanceId } = useRecordIndexContextOrThrow();

  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );

  const { openDropdown } = useOpenDropdown();
  const { setViewPickerMode } = useViewPickerMode(viewBarInstanceId);

  const setViewPickerReferenceViewId = useSetAtomComponentState(
    viewPickerReferenceViewIdComponentState,
    viewBarInstanceId,
  );

  const handleClick = () => {
    if (!isDefined(contextStoreCurrentViewId)) {
      return;
    }

    openDropdown({
      dropdownComponentInstanceIdFromProps: VIEW_PICKER_DROPDOWN_ID,
    });
    setViewPickerReferenceViewId(contextStoreCurrentViewId);
    setViewPickerMode('create-from-current');
  };

  return (
    <Button
      Icon={IconCopy}
      title={t`Clone`}
      size="small"
      variant="secondary"
      disabled={!isDefined(contextStoreCurrentViewId)}
      onClick={handleClick}
    />
  );
};
