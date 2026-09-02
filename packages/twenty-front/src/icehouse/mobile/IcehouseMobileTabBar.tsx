import { lastClickedNavigationMenuItemIdState } from '@/navigation-menu-item/common/states/lastClickedNavigationMenuItemIdState';
import { useIsSettingsDrawer } from '@/navigation/hooks/useIsSettingsDrawer';
import { currentMobileNavigationDrawerState } from '@/navigation/states/currentMobileNavigationDrawerState';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconApps, useIcons } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { useIcehouseMobileObjectContext } from '~/icehouse/mobile/useIcehouseMobileObjectContext';
import {
  type IcehouseMobileTabItem,
  useIcehouseMobileTabItems,
} from '~/icehouse/mobile/useIcehouseMobileTabItems';

const StyledTabBar = styled.nav`
  align-items: stretch;
  background: ${themeCssVariables.background.secondary};
  border-top: 1px solid ${themeCssVariables.border.color.medium};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  width: 100%;

  @media print {
    display: none;
  }
`;

const StyledTab = styled(Link)`
  align-items: center;
  border-top: 2px solid transparent;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  min-height: 56px;
  min-width: 0;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[1]} 0;
  text-decoration: none;

  &[data-active] {
    border-top-color: ${themeCssVariables.color.blue};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

const StyledTabLabel = styled.span`
  font-size: 11px;
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 14px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// HubSpot's phone tab bar in place of the stock floating pill: four object
// tabs (useIcehouseMobileTabItems — the sidebar's Contacts, Companies, Deals,
// Leads, icon and label from object metadata) plus More, which opens the
// page the pill's Home opened (AppPath.Home, the navigation drawer rendered
// as a page on mobile, with Search, Settings, Tasks, Notes and everything
// else). Search itself sits in IcehouseMobileHeader, so it is one tap away
// on every object page without a fifth object tab giving way.
//
// Full width and in flow: DefaultLayout mounts it as the last child of its
// 100dvh column, so the page container above shrinks by the bar's height and
// nothing scrolls behind it — no padding-bottom hook on the content is
// needed, and the safe-area inset is the bar's own bottom padding. Always
// visible (HubSpot's is), so the stock scroll-hide effect is not mounted; the
// mobile side panel is a fixed full-screen surface that covers it. Tabs are
// router Links (the drawer items are too), with the stock pill's side
// effects on tap: close the side panel, and leave the mobile settings drawer
// for the main one. Active = the object of the current index or record
// route; More = the Home page. Renders only on mobile.
export const IcehouseMobileTabBar = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const { getIcon } = useIcons();
  const tabItems = useIcehouseMobileTabItems();
  const { page, objectMetadataItem: currentObjectMetadataItem } =
    useIcehouseMobileObjectContext();
  const { closeSidePanelMenu } = useSidePanelMenu();
  const isSettingsDrawer = useIsSettingsDrawer();
  const setCurrentMobileNavigationDrawer = useSetAtomState(
    currentMobileNavigationDrawerState,
  );
  const setIsNavigationDrawerExpanded = useSetAtomState(
    isNavigationDrawerExpandedState,
  );
  const setLastClickedNavigationMenuItemId = useSetAtomState(
    lastClickedNavigationMenuItemIdState,
  );

  if (!isMobile) {
    return null;
  }

  // The expansion flag is shared with the desktop drawer, so only a tap made
  // from the settings drawer resets it (the stock pill's guard).
  const leaveCurrentSurface = () => {
    closeSidePanelMenu();

    if (isSettingsDrawer) {
      setCurrentMobileNavigationDrawer('main');
      setIsNavigationDrawerExpanded(false);
    }
  };

  const handleTabClick = (tabItem: IcehouseMobileTabItem) => {
    leaveCurrentSurface();
    setLastClickedNavigationMenuItemId(tabItem.navigationMenuItemId);
  };

  const isMoreActive = page === 'home';

  return (
    <StyledTabBar
      data-icehouse="mobile-tab-bar"
      aria-label={t`Main navigation`}
    >
      {tabItems.map((tabItem) => {
        const { objectMetadataItem } = tabItem;
        const Icon = getIcon(objectMetadataItem.icon);
        const isActive =
          objectMetadataItem.id === currentObjectMetadataItem?.id;

        return (
          <StyledTab
            key={objectMetadataItem.id}
            to={tabItem.link}
            data-icehouse-part="tab"
            data-active={isActive ? '' : undefined}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => handleTabClick(tabItem)}
          >
            <Icon
              size={theme.icon.size.lg}
              stroke={theme.icon.stroke.sm}
              aria-hidden
            />
            <StyledTabLabel>{objectMetadataItem.labelPlural}</StyledTabLabel>
          </StyledTab>
        );
      })}
      <StyledTab
        to={AppPath.Home}
        data-icehouse-part="more"
        data-active={isMoreActive ? '' : undefined}
        aria-current={isMoreActive ? 'page' : undefined}
        onClick={leaveCurrentSurface}
      >
        <IconApps
          size={theme.icon.size.lg}
          stroke={theme.icon.stroke.sm}
          aria-hidden
        />
        <StyledTabLabel>{t`More`}</StyledTabLabel>
      </StyledTab>
    </StyledTabBar>
  );
};
