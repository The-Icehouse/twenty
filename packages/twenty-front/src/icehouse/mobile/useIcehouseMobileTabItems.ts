import { useNavigationMenuItemSectionItems } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemSectionItems';
import { getObjectMetadataForNavigationMenuItem } from '@/navigation-menu-item/display/object/utils/getObjectMetadataForNavigationMenuItem';
import { getNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink';
import { lastVisitedViewPerObjectMetadataItemState } from '@/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { useMemo } from 'react';
import {
  CoreObjectNameSingular,
  NavigationMenuItemType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type IcehouseMobileTabItem = {
  navigationMenuItemId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  link: string;
};

// HubSpot's four tabs: Contacts, Companies, Deals, Leads. Person, company and
// opportunity are core objects; lead is the workspace's own object and has no
// enum member, so its API name is spelt out.
const PREFERRED_OBJECT_NAME_SINGULARS: readonly string[] = [
  CoreObjectNameSingular.Person,
  CoreObjectNameSingular.Company,
  CoreObjectNameSingular.Opportunity,
  'lead',
];

const TAB_COUNT = 4;

// The object tabs of the mobile tab bar: the workspace sidebar's OBJECT items
// in the order the drawer shows them (useNavigationMenuItemSectionItems — the
// same display-order, read-permission-filtered list WorkspaceSection renders,
// folder children included), the four HubSpot objects first, then any other
// object item in sidebar order should fewer than four of those be present.
// Labels come from labelPlural and links from the same computed-link helper
// the drawer uses, so a tab lands on the member's last visited view exactly
// as the drawer item does.
export const useIcehouseMobileTabItems = (): IcehouseMobileTabItem[] => {
  const sidebarNavigationMenuItems = useNavigationMenuItemSectionItems();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );

  return useMemo(() => {
    const objectTabItems: IcehouseMobileTabItem[] = [];
    const seenObjectMetadataIds = new Set<string>();

    for (const item of sidebarNavigationMenuItems) {
      if (item.type !== NavigationMenuItemType.OBJECT) {
        continue;
      }

      const objectMetadataItem = getObjectMetadataForNavigationMenuItem(
        item,
        objectMetadataItems,
        views,
      );

      if (
        !isDefined(objectMetadataItem) ||
        seenObjectMetadataIds.has(objectMetadataItem.id)
      ) {
        continue;
      }

      seenObjectMetadataIds.add(objectMetadataItem.id);
      objectTabItems.push({
        navigationMenuItemId: item.id,
        objectMetadataItem,
        link: getNavigationMenuItemComputedLink({
          item,
          objectMetadataItems,
          views,
          lastVisitedViewPerObjectMetadataItem,
        }),
      });
    }

    const isPreferred = (tabItem: IcehouseMobileTabItem) =>
      PREFERRED_OBJECT_NAME_SINGULARS.includes(
        tabItem.objectMetadataItem.nameSingular,
      );

    return [
      ...objectTabItems.filter(isPreferred),
      ...objectTabItems.filter((tabItem) => !isPreferred(tabItem)),
    ].slice(0, TAB_COUNT);
  }, [
    lastVisitedViewPerObjectMetadataItem,
    objectMetadataItems,
    sidebarNavigationMenuItems,
    views,
  ]);
};
