import { NavigationDrawerFixedContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerFixedContent';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useColorScheme } from '@/ui/theme/hooks/useColorScheme';
import { useSystemColorScheme } from '@/ui/theme/hooks/useSystemColorScheme';
import { useLingui } from '@lingui/react/macro';
import { IconMoon, IconSun } from 'twenty-ui/icon';

// Icehouse fork: one-click Light <-> Dark toggle at the foot of the main
// navigation drawer. The item shows the mode you will get, not the one you are
// in. Persistence is upstream's useColorScheme (workspace-member setting plus
// the local persisted state BaseThemeProvider reads). A member on "System" is
// moved to the explicit opposite of their effective mode, so the click always
// produces a visible change. Renders on desktop (expanded and icon rail, where
// NavigationDrawerItem handles its own tooltip) and on mobile.
export const IcehouseNavFooter = () => {
  const { t } = useLingui();
  const { colorScheme, setColorScheme } = useColorScheme();
  const systemColorScheme = useSystemColorScheme();

  const effectiveColorScheme =
    colorScheme === 'System' ? systemColorScheme : colorScheme;
  const isDark = effectiveColorScheme === 'Dark';

  return (
    <NavigationDrawerFixedContent>
      <div data-icehouse="nav-footer">
        <NavigationDrawerItem
          label={isDark ? t`Light mode` : t`Dark mode`}
          Icon={isDark ? IconSun : IconMoon}
          onClick={() => void setColorScheme(isDark ? 'Light' : 'Dark')}
          preventCollapseOnMobile
        />
      </div>
    </NavigationDrawerFixedContent>
  );
};
