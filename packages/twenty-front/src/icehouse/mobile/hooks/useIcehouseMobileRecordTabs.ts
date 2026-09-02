import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useWidgetVisibilityContext } from '@/page-layout/hooks/useWidgetVisibilityContext';
import { pageLayoutPersistedComponentState } from '@/page-layout/states/pageLayoutPersistedComponentState';
import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { getTabsRenderableForTargetObject } from '@/page-layout/utils/getTabsRenderableForTargetObject';
import { getTabsWithVisibleWidgets } from '@/page-layout/utils/getTabsWithVisibleWidgets';
import { sortTabsByPosition } from '@/page-layout/utils/sortTabsByPosition';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { WidgetType } from '~/generated-metadata/graphql';
import { type IcehouseMobileRecordExtraTab } from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';

type UseIcehouseMobileRecordTabsParams = {
  pageLayoutId: string;
};

type IcehouseMobileRecordTabs = {
  isPageLayoutLoaded: boolean;
  aboutTabId: string | undefined;
  activitiesTabId: string | undefined;
  extraTabs: IcehouseMobileRecordExtraTab[];
  tabIds: string[];
};

const hasActiveWidgetOfType = (tab: PageLayoutTab, widgetType: WidgetType) =>
  tab.widgets.some((widget) => widget.isActive && widget.type === widgetType);

// Which of the record layout's tabs the phone's About and Activities segments
// stand for, and which are left for the More picker. Read from the same
// persisted layout PageLayoutRenderer loads, filtered exactly as upstream's
// usePageLayoutRenderableTabs filters in view mode (widget visibility for the
// device, relation fields of the object), so the id written to
// activeTabIdComponentState is one the tabs renderer will show. Edit mode is
// not a concern: the mobile page hands the whole record page back to upstream
// while the layout is being edited.
//
// About is the first tab carrying a FIELDS widget (the tab desktop pins on
// the left), falling back to the first tab; Activities is the first tab
// carrying a TIMELINE widget, or undefined when the layout has none. The
// extra tabs are every other renderable tab (Tasks, Notes, Files, Emails,
// Calendar, custom ones) in upstream's position order — the order the desktop
// tab strip shows them.
export const useIcehouseMobileRecordTabs = ({
  pageLayoutId,
}: UseIcehouseMobileRecordTabsParams): IcehouseMobileRecordTabs => {
  const targetRecord = useTargetRecord();

  const pageLayoutPersisted = useAtomComponentStateValue(
    pageLayoutPersistedComponentState,
    pageLayoutId,
  );

  const widgetVisibilityContext = useWidgetVisibilityContext();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });

  const targetObjectFields = objectMetadataItem.fields;

  return useMemo(() => {
    if (!isDefined(pageLayoutPersisted)) {
      return {
        isPageLayoutLoaded: false,
        aboutTabId: undefined,
        activitiesTabId: undefined,
        extraTabs: [],
        tabIds: [],
      };
    }

    const renderableTabs = getTabsRenderableForTargetObject({
      tabs: getTabsWithVisibleWidgets({
        tabs: pageLayoutPersisted.tabs,
        isEditMode: false,
        context: widgetVisibilityContext,
      }),
      targetObjectFields,
    });

    const sortedTabs = sortTabsByPosition(renderableTabs);

    const aboutTab =
      sortedTabs.find((tab) => hasActiveWidgetOfType(tab, WidgetType.FIELDS)) ??
      sortedTabs[0];

    const activitiesTab = sortedTabs.find((tab) =>
      hasActiveWidgetOfType(tab, WidgetType.TIMELINE),
    );

    const extraTabs = sortedTabs
      .filter((tab) => tab.id !== aboutTab?.id && tab.id !== activitiesTab?.id)
      .map((tab) => ({ id: tab.id, title: tab.title, icon: tab.icon }));

    return {
      isPageLayoutLoaded: true,
      aboutTabId: aboutTab?.id,
      activitiesTabId: activitiesTab?.id,
      extraTabs,
      tabIds: sortedTabs.map((tab) => tab.id),
    };
  }, [pageLayoutPersisted, widgetVisibilityContext, targetObjectFields]);
};
