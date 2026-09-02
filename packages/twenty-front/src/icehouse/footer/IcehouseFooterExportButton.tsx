import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { EngineComponentKey } from '~/generated-metadata/graphql';
import { IcehouseCommandMenuItemButton } from '~/icehouse/footer/IcehouseCommandMenuItemButton';

// The index page's export lives in the standard command-menu item "Export View"
// (EngineComponentKey.EXPORT_VIEW, GLOBAL_OBJECT_CONTEXT, gated by the EXPORT_CSV
// permission flag). EXPORT_FROM_RECORD_INDEX is the legacy key kept for workspaces
// whose items predate the rename; both mount the same ExportRecordsCommand.
const EXPORT_ENGINE_COMPONENT_KEYS: EngineComponentKey[] = [
  EngineComponentKey.EXPORT_VIEW,
  EngineComponentKey.EXPORT_FROM_RECORD_INDEX,
];

// Renders nothing when the item is filtered out (no EXPORT_CSV permission, or the
// admin deactivated it) — the same rule the header applies.
export const IcehouseFooterExportButton = () => {
  const { commandMenuItems } = useContext(CommandMenuContext);

  const exportItem = commandMenuItems.find((item) =>
    EXPORT_ENGINE_COMPONENT_KEYS.includes(item.engineComponentKey),
  );

  if (!isDefined(exportItem)) {
    return null;
  }

  return <IcehouseCommandMenuItemButton item={exportItem} />;
};
