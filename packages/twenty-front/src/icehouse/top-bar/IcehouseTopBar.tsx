import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useOpenSettingsMenu } from '@/navigation/hooks/useOpenSettings';
import { getDocumentationUrl } from '@/support/utils/getDocumentationUrl';
import { useShowFullscreen } from '@/ui/layout/fullscreen/hooks/useShowFullscreen';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { IconHelpCircle, IconSettings } from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay, TooltipPosition } from 'twenty-ui/surfaces';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { icehouseTopBarControlClass } from '~/icehouse/top-bar/icehouseTopBarControlClass';
import { IcehouseTopBarCreateDropdown } from '~/icehouse/top-bar/IcehouseTopBarCreateDropdown';
import { IcehouseTopBarFindOrAsk } from '~/icehouse/top-bar/IcehouseTopBarFindOrAsk';

const StyledTopBar = styled.header`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  height: 54px;
  justify-content: space-between;
  padding: 0 ${themeCssVariables.spacing[4]};
  width: 100%;

  @media print {
    display: none;
  }
`;

const StyledGroup = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

// HubSpot's persistent bar, spanning the full width above the drawer and the
// content (DefaultLayout mounts it as a child of its column layout, above the
// drawer + content row, so the drawer starts below it as HubSpot's does).
// Left: "Find or Ask" (upstream's side-panel search and Ask-AI pages). Right:
// "+" quick-create, settings, help. Each control is one upstream hook or path;
// the bar owns no state. Desktop only — mobile has its own navigation bar and
// the side panel there is a page — and hidden with the drawer on the
// fullscreen playground routes. The workspace switcher is deliberately not
// repeated here: MultiWorkspaceDropdownButton and its menu hard-code
// MULTI_WORKSPACE_DROPDOWN_ID for open state and closeDropdown, so a second
// instance would open both panels at once; the drawer header keeps the one.
export const IcehouseTopBar = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const showFullscreen = useShowFullscreen();
  const { openSettingsMenu } = useOpenSettingsMenu();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  if (isMobile || showFullscreen) {
    return null;
  }

  const settingsLabel = t`Settings`;
  const helpLabel = t`Help and documentation`;

  return (
    <StyledTopBar data-icehouse="top-bar">
      <StyledGroup>
        <IcehouseTopBarFindOrAsk />
      </StyledGroup>
      <StyledGroup>
        <IcehouseTopBarCreateDropdown />
        <Link
          className={icehouseTopBarControlClass}
          to={getSettingsPath(SettingsPath.ProfilePage)}
          onClick={openSettingsMenu}
          data-icehouse-part="settings"
          aria-label={settingsLabel}
        >
          <IconSettings size={theme.icon.size.md} aria-hidden />
        </Link>
        <a
          className={icehouseTopBarControlClass}
          href={getDocumentationUrl({
            locale: currentWorkspaceMember?.locale,
          })}
          target="_blank"
          rel="noopener noreferrer"
          data-icehouse-part="help"
          aria-label={helpLabel}
        >
          <IconHelpCircle size={theme.icon.size.md} aria-hidden />
        </a>
      </StyledGroup>
      <AppTooltip
        anchorSelect={
          '[data-icehouse="top-bar"] [data-icehouse-part="settings"]'
        }
        content={settingsLabel}
        place={TooltipPosition.Bottom}
        delay={TooltipDelay.shortDelay}
        noArrow
      />
      <AppTooltip
        anchorSelect={'[data-icehouse="top-bar"] [data-icehouse-part="help"]'}
        content={helpLabel}
        place={TooltipPosition.Bottom}
        delay={TooltipDelay.shortDelay}
        noArrow
      />
    </StyledTopBar>
  );
};
