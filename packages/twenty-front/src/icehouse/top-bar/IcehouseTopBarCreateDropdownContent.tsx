import { useReadableObjectMetadataItems } from '@/object-metadata/hooks/useReadableObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { canCreateRecordsForObjectMetadataItem } from '@/object-record/utils/canCreateRecordsForObjectMetadataItem';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { selectedItemIdComponentState } from '@/ui/layout/selectable-list/states/selectedItemIdComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { OBJECTS_WITH_CHANNEL_VISIBILITY_CONSTRAINTS } from 'twenty-shared/constants';
import { useIcons } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';
import { ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID } from '~/icehouse/top-bar/constants/IcehouseTopBarCreateDropdownId';

const CHANNEL_CONSTRAINED_OBJECT_NAME_SINGULARS: readonly string[] =
  OBJECTS_WITH_CHANNEL_VISIBILITY_CONSTRAINTS;

type IcehouseTopBarCreateDropdownContentProps = {
  onSelectObjectMetadataItem: (
    objectMetadataItem: EnrichedObjectMetadataItem,
  ) => void;
};

// The "+" menu: every object the member can create a record of, under its own
// label (Contacts, Deals, Leads, Agreements … come from metadata, never from
// code). Readable and active (useReadableObjectMetadataItems), not a system
// object (workflow runs, message threads and the like), and creatable by
// upstream's own predicate (isUICreatable, plus the update permission that
// stands in for a create permission). The objects global search refuses on
// channel-visibility grounds are left out, as the search filter leaves them
// out. Arrow keys and Enter work through upstream's SelectableList keyed on
// the dropdown id, the same as the side panel's object filter.
export const IcehouseTopBarCreateDropdownContent = ({
  onSelectObjectMetadataItem,
}: IcehouseTopBarCreateDropdownContentProps) => {
  const { t } = useLingui();
  const { getIcon } = useIcons();
  const { closeDropdown } = useCloseDropdown();
  const { readableObjectMetadataItems } = useReadableObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const creatableObjectMetadataItems = useMemo(
    () =>
      readableObjectMetadataItems
        .filter(
          (objectMetadataItem) =>
            !objectMetadataItem.isSystem &&
            !CHANNEL_CONSTRAINED_OBJECT_NAME_SINGULARS.includes(
              objectMetadataItem.nameSingular,
            ) &&
            canCreateRecordsForObjectMetadataItem({
              objectPermissions: getObjectPermissionsForObject(
                objectPermissionsByObjectMetadataId,
                objectMetadataItem.id,
              ),
              objectMetadataItem,
            }),
        )
        .sort((a, b) => a.labelSingular.localeCompare(b.labelSingular)),
    [objectPermissionsByObjectMetadataId, readableObjectMetadataItems],
  );

  const selectedItemId = useAtomComponentStateValue(
    selectedItemIdComponentState,
    ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID,
  );

  const handleSelect = (objectMetadataItem: EnrichedObjectMetadataItem) => {
    closeDropdown(ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID);
    onSelectObjectMetadataItem(objectMetadataItem);
  };

  return (
    <DropdownContent>
      <DropdownMenuHeader>{t`Create`}</DropdownMenuHeader>
      <SelectableList
        selectableListInstanceId={ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID}
        focusId={ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID}
        selectableItemIdArray={creatableObjectMetadataItems.map(
          (objectMetadataItem) => objectMetadataItem.id,
        )}
      >
        <DropdownMenuItemsContainer hasMaxHeight>
          {creatableObjectMetadataItems.length === 0 && (
            <MenuItem text={t`Nothing you can create`} disabled />
          )}
          {creatableObjectMetadataItems.map((objectMetadataItem) => (
            <SelectableListItem
              key={objectMetadataItem.id}
              itemId={objectMetadataItem.id}
              onEnter={() => handleSelect(objectMetadataItem)}
            >
              <MenuItem
                LeftIcon={getIcon(objectMetadataItem.icon)}
                text={objectMetadataItem.labelSingular}
                focused={selectedItemId === objectMetadataItem.id}
                onClick={() => handleSelect(objectMetadataItem)}
              />
            </SelectableListItem>
          ))}
        </DropdownMenuItemsContainer>
      </SelectableList>
    </DropdownContent>
  );
};
