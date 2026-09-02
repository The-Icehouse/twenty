import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { SummaryCard } from '@/object-record/record-show/components/SummaryCard';
import { getTabListInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getTabListInstanceIdFromPageLayoutAndRecord';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { PageLayoutType } from '~/generated-metadata/graphql';
import { getIcehouseAssociations } from '~/icehouse/associations/getIcehouseAssociations';
import { IcehouseAssociationsColumn } from '~/icehouse/associations/IcehouseAssociationsColumn';
import { useIcehouseMobileRecordTabs } from '~/icehouse/mobile/hooks/useIcehouseMobileRecordTabs';
import { useIsIcehouseMobileRecordPage } from '~/icehouse/mobile/hooks/useIsIcehouseMobileRecordPage';
import {
  IcehouseMobileRecordSegmentedControl,
  type IcehouseMobileRecordSegmentOption,
} from '~/icehouse/mobile/IcehouseMobileRecordSegmentedControl';
import { icehouseMobileRecordSegmentState } from '~/icehouse/mobile/states/icehouseMobileRecordSegmentState';
import { type IcehouseMobileRecordSegment } from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';
import { IcehouseQuickActionRow } from '~/icehouse/quick-actions/IcehouseQuickActionRow';
import { IcehouseStageTracker } from '~/icehouse/stage-tracker/IcehouseStageTracker';

// Icehouse fork — HubSpot's phone record page. Mounted by
// PageLayoutRecordPageRenderer around the page layout (the same wrap that
// adds the association column on desktop); anywhere but the phone record page
// it renders its children untouched, so desktop and the side panel are
// byte-identical. On the phone it lays the record out in one column:
//
//   header card (upstream SummaryCard: avatar, name, "Added …")
//   quick-action row (Note · Email · Call · Task · Meeting · File · More)
//   stage tracker, compact variant, when the object has a stage field
//   About · Activities · Related segments
//   the face the segment selects
//
// About and Activities are upstream's own tabs (the pinned FIELDS tab and
// the TIMELINE tab), rendered by the very PageLayoutRenderer this component
// wraps: its tab list is hidden with CSS and the segments write the tab list's
// activeTabIdComponentState instead, so widgets, scroll reset and the fork's
// Activities sub-tabs all keep working as upstream built them. Related is the
// fork's association cards stacked full width. The chosen segment is kept per
// browser session (never in the URL).
//
// The one thing that can overrule a segment is upstream's tab hash: on the
// record page PageLayoutTabList navigates to `#<tabId>` and
// TabListFromUrlOptionalEffect re-applies that hash over any other active tab.
// A hash naming a different tab of this layout (a deep link, or a tab clicked
// on desktop before the window shrank) is therefore left in charge until a
// segment is tapped, at which point the hash is replaced — not pushed — with
// the segment's tab so the two agree again.

const StyledPage = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-x: hidden;
  width: 100%;
`;

const StyledTopBlock = styled.div`
  flex-shrink: 0;
`;

const StyledLayoutPane = styled.div`
  display: grid;
  flex: 1;
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;

  &[hidden] {
    display: none;
  }
`;

const StyledRelatedPane = styled.div`
  display: grid;
  flex: 1;
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
`;

type IcehouseMobileRecordPageContentProps = {
  pageLayoutId: string;
  children: ReactNode;
};

const IcehouseMobileRecordPageContent = ({
  pageLayoutId,
  children,
}: IcehouseMobileRecordPageContentProps) => {
  const { t } = useLingui();
  const targetRecord = useTargetRecord();
  const { layoutType } = useLayoutRenderingContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [icehouseMobileRecordSegment, setIcehouseMobileRecordSegment] =
    useAtomState(icehouseMobileRecordSegmentState);

  const tabListInstanceId = getTabListInstanceIdFromPageLayoutAndRecord({
    pageLayoutId,
    layoutType,
    targetRecordIdentifier: targetRecord,
  });

  const [activeTabId, setActiveTabId] = useAtomComponentState(
    activeTabIdComponentState,
    tabListInstanceId,
  );

  const { isPageLayoutLoaded, aboutTabId, activitiesTabId, tabIds } =
    useIcehouseMobileRecordTabs({ pageLayoutId });

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });
  const { objectMetadataItems } = useObjectMetadataItems();

  const hasAssociations =
    getIcehouseAssociations({ objectMetadataItem, objectMetadataItems })
      .length > 0;

  // Until the layout is in the store every face is offered, so the control
  // does not reflow the moment the layout lands.
  const hasActivities = !isPageLayoutLoaded || isDefined(activitiesTabId);

  const segments: IcehouseMobileRecordSegmentOption[] = [
    { id: 'about', label: t`About` },
    ...(hasActivities
      ? [{ id: 'activities' as const, label: t`Activities` }]
      : []),
    ...(hasAssociations ? [{ id: 'related' as const, label: t`Related` }] : []),
  ];

  const segment: IcehouseMobileRecordSegment = segments.some(
    (option) => option.id === icehouseMobileRecordSegment,
  )
    ? icehouseMobileRecordSegment
    : 'about';

  const getTabIdForSegment = (
    candidate: IcehouseMobileRecordSegment,
  ): string | undefined =>
    candidate === 'about'
      ? aboutTabId
      : candidate === 'activities'
        ? activitiesTabId
        : undefined;

  const getSegmentForTabId = (
    tabId: string,
  ): IcehouseMobileRecordSegment | undefined =>
    tabId === aboutTabId
      ? 'about'
      : tabId === activitiesTabId
        ? 'activities'
        : undefined;

  const preferredTabId = getTabIdForSegment(segment);

  const hashTabId = location.hash.replace('#', '');

  const isHashInCharge =
    isDefined(preferredTabId) &&
    hashTabId !== '' &&
    hashTabId !== preferredTabId &&
    tabIds.includes(hashTabId);

  useEffect(() => {
    if (
      !isDefined(preferredTabId) ||
      isHashInCharge ||
      activeTabId === preferredTabId
    ) {
      return;
    }

    setActiveTabId(preferredTabId);
  }, [preferredTabId, isHashInCharge, activeTabId, setActiveTabId]);

  const handleSegmentChange = (nextSegment: IcehouseMobileRecordSegment) => {
    setIcehouseMobileRecordSegment(nextSegment);

    const nextTabId = getTabIdForSegment(nextSegment);

    if (isDefined(nextTabId) && hashTabId !== '' && hashTabId !== nextTabId) {
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: `#${nextTabId}`,
        },
        { replace: true },
      );
    }
  };

  const activeSegment = isHashInCharge
    ? getSegmentForTabId(hashTabId)
    : segment;

  const isRelatedOpen = activeSegment === 'related';

  return (
    <StyledPage
      data-icehouse="mobile-record"
      data-icehouse-active-segment={activeSegment}
    >
      <StyledTopBlock data-icehouse-part="header">
        <SummaryCard
          objectNameSingular={targetRecord.targetObjectNameSingular}
          objectRecordId={targetRecord.id}
          isInSidePanel={false}
        />
      </StyledTopBlock>
      <StyledTopBlock data-icehouse-part="actions">
        <IcehouseQuickActionRow isInMobileRecordPage />
      </StyledTopBlock>
      <IcehouseStageTracker
        targetRecordIdentifier={targetRecord}
        isInSidePanel={false}
        isInMobileRecordPage
      />
      <IcehouseMobileRecordSegmentedControl
        segments={segments}
        activeSegment={activeSegment}
        onSegmentChange={handleSegmentChange}
      />
      <StyledLayoutPane data-icehouse-part="layout" hidden={isRelatedOpen}>
        {children}
      </StyledLayoutPane>
      {isRelatedOpen && (
        <StyledRelatedPane data-icehouse-part="related">
          <IcehouseAssociationsColumn variant="stack" />
        </StyledRelatedPane>
      )}
    </StyledPage>
  );
};

type IcehouseMobileRecordPageProps = {
  pageLayoutId: string;
  children: ReactNode;
};

export const IcehouseMobileRecordPage = ({
  pageLayoutId,
  children,
}: IcehouseMobileRecordPageProps) => {
  const { isInSidePanel, layoutType } = useLayoutRenderingContext();
  const isIcehouseMobileRecordPage = useIsIcehouseMobileRecordPage({
    isInSidePanel,
  });

  if (
    !isIcehouseMobileRecordPage ||
    layoutType !== PageLayoutType.RECORD_PAGE
  ) {
    return <>{children}</>;
  }

  return (
    <IcehouseMobileRecordPageContent pageLayoutId={pageLayoutId}>
      {children}
    </IcehouseMobileRecordPageContent>
  );
};
