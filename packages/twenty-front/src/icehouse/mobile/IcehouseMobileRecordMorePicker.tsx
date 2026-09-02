import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { isDefined } from 'twenty-shared/utils';
import { useIcons } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';
import { ICEHOUSE_MOBILE_RECORD_MORE_DROPDOWN_ID } from '~/icehouse/mobile/constants/IcehouseMobileRecordMoreDropdownId';
import { type IcehouseMobileRecordExtraTab } from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';

type IcehouseMobileRecordMorePickerProps = {
  tabs: IcehouseMobileRecordExtraTab[];
  activeTabId: string | undefined;
  onPick: (tabId: string) => void;
};

// The More segment's menu: the record layout's remaining tabs, in the order
// the desktop tab strip shows them, as upstream MenuItems inside upstream's
// dropdown containers so it reads like every other Twenty menu. Picking a tab
// closes the menu and hands the tab id to the page, which drives the tab list
// the same way the About and Activities segments do.
//
// Hooks for icehouse.css: data-icehouse-part="more-picker" around the list,
// data-icehouse-part="more-item" (data-active on the tab currently showing)
// around every row. The phone geometry (44px rows, 16px text) and HubSpot's
// light palette live in icehouse.css under `mobile-record-more`.
export const IcehouseMobileRecordMorePicker = ({
  tabs,
  activeTabId,
  onPick,
}: IcehouseMobileRecordMorePickerProps) => {
  const { getIcon } = useIcons();
  const { closeDropdown } = useCloseDropdown();

  const handlePick = (tabId: string) => {
    closeDropdown(ICEHOUSE_MOBILE_RECORD_MORE_DROPDOWN_ID);
    onPick(tabId);
  };

  return (
    <DropdownContent widthInPixels={GenericDropdownContentWidth.Large}>
      <div data-icehouse-part="more-picker">
        <DropdownMenuItemsContainer>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const hasIcon = isDefined(tab.icon) && tab.icon !== '';

            return (
              <div
                key={tab.id}
                data-icehouse-part="more-item"
                data-icehouse-tab={tab.id}
                data-active={isActive || undefined}
              >
                <MenuItem
                  LeftIcon={hasIcon ? getIcon(tab.icon) : undefined}
                  text={tab.title}
                  selected={isActive}
                  onClick={() => handlePick(tab.id)}
                />
              </div>
            );
          })}
        </DropdownMenuItemsContainer>
      </div>
    </DropdownContent>
  );
};
