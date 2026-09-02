import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { interpolateCommandMenuItemFields } from '@/command-menu-item/display/utils/interpolateCommandMenuItemFields';
import { useCommandMenuItemClick } from '@/command-menu-item/hooks/useCommandMenuItemClick';
import { COMMAND_MENU_DEFAULT_ICON } from '@/workflow/workflow-trigger/constants/CommandMenuDefaultIcon';
import { useContext } from 'react';
import { useIcons } from 'twenty-ui/icon';
import {
  Button,
  type ButtonAccent,
  type ButtonVariant,
} from 'twenty-ui/input';
import { type CommandMenuItemFieldsFragment } from '~/generated-metadata/graphql';

type IcehouseCommandMenuItemButtonProps = {
  item: CommandMenuItemFieldsFragment;
  variant?: ButtonVariant;
  accent?: ButtonAccent;
};

// One command-menu item rendered as a plain twenty-ui Button. It executes through
// useCommandMenuItemClick — the exact hook behind the header's pinned buttons — so
// engine commands, headless front components and side-panel components all behave
// as they do in the header. Must sit inside a CommandMenuContextProvider, which
// supplies the context API used to interpolate the label.
export const IcehouseCommandMenuItemButton = ({
  item,
  variant = 'secondary',
  accent = 'default',
}: IcehouseCommandMenuItemButtonProps) => {
  const { commandMenuContextApi } = useContext(CommandMenuContext);
  const { getIcon } = useIcons();

  const { iconKey, label, shortLabel } = interpolateCommandMenuItemFields(
    item,
    commandMenuContextApi,
  );

  const Icon = getIcon(iconKey, COMMAND_MENU_DEFAULT_ICON);

  const { handleClick, disabled } = useCommandMenuItemClick({
    item,
    Icon,
    label,
  });

  return (
    <Button
      Icon={Icon}
      title={shortLabel ?? label}
      ariaLabel={label}
      size="small"
      variant={variant}
      accent={accent}
      disabled={disabled}
      onClick={handleClick}
    />
  );
};
