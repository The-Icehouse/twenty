import { AppErrorBoundary } from '@/error-handler/components/AppErrorBoundary';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { getObjectNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/object/utils/getObjectNavigationMenuItemComputedLink';
import { useIsSettingsDrawer } from '@/navigation/hooks/useIsSettingsDrawer';
import { lastVisitedViewPerObjectMetadataItemState } from '@/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { canCreateRecordsForObjectMetadataItem } from '@/object-record/utils/canCreateRecordsForObjectMetadataItem';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconChevronLeft,
  IconDotsVertical,
  IconPlus,
  IconSearch,
} from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { IcehouseMobileRecordHeaderActions } from '~/icehouse/mobile/IcehouseMobileRecordHeaderActions';
import { useIcehouseMobileObjectContext } from '~/icehouse/mobile/useIcehouseMobileObjectContext';
import { IcehouseTopBarCreateRecordEffect } from '~/icehouse/top-bar/IcehouseTopBarCreateRecordEffect';

const StyledHeader = styled.header`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  min-height: 52px;
  padding: env(safe-area-inset-top, 0px) ${themeCssVariables.spacing[1]} 0
    ${themeCssVariables.spacing[3]};
  width: 100%;

  @media print {
    display: none;
  }
`;

const StyledTitle = styled.div`
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

// One 44px control look for a <button> and a router <Link>; a class because
// Linaria's styled() cannot retype itself per tag (the top bar does the same).
// Shared with IcehouseMobileRecordHeaderActions (passed as a prop).
const mobileHeaderControlClass = css`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 44px;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  width: 44px;

  &:active {
    background: ${themeCssVariables.background.transparent.light};
  }

  &:disabled {
    color: ${themeCssVariables.font.color.light};
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

// HubSpot's slim phone header, mounted by DefaultLayout where the desktop top
// bar goes (that bar returns null on mobile). Object pages only, plus the
// Home menu page: settings, the AI chat and the standalone pages keep their
// own headers. Left: the object's labelPlural (index) or a back chevron to
// the object's last visited view plus the label (record page); "Menu" on
// Home. Right, 44px each, on index and Home pages: "+" creating a record of
// the current object through the fork's IcehouseTopBarCreateRecordEffect
// (the CREATE_NEW_RECORD path minus the index-only parts — this header sits
// outside the record-index providers useCreateNewIndexRecord needs —
// honouring openRecordIn and shown only when upstream's own predicate says
// the member can create), the search icon opening the same side-panel search
// page as the stock pill's Search, and on index pages the command-menu "⋮"
// upstream's header carried. On record pages the right side is HubSpot's
// instead — previous record, next record, "⋮" (IcehouseMobileRecordHeaderActions)
// — with no "+" or search.
//
// On both object pages this replaces upstream's PageCardHeader row (index:
// icon + title + icon-only pinned commands + "⋮"; record: small avatar +
// editable name + pinned commands + "⋮", a second title above the fork's
// summary card). icehouse.css hides that row through the data-icehouse-page
// hook here and the data-icehouse hook on PageCardHeader. The record rule is
// additionally keyed on the fork's mobile record page (data-icehouse=
// "mobile-record", the summary card's owner) being in the DOM, so wherever
// that page stands down — layout-customization mode, a dashboard (its
// layoutType is DASHBOARD, not RECORD_PAGE), no page layout resolved yet —
// upstream's row stays as the only title. In the first two of those cases
// the record actions are not rendered here either: the row keeps its own
// "⋮", and doubling it up would gain nothing.
export const IcehouseMobileHeader = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const isSettingsDrawer = useIsSettingsDrawer();
  const { page, objectMetadataItem, objectRecordId } =
    useIcehouseMobileObjectContext();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  const { openSidePanelMenu } = useSidePanelMenu();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const [objectMetadataItemToCreate, setObjectMetadataItemToCreate] =
    useState<EnrichedObjectMetadataItem | null>(null);

  if (!isMobile || isSettingsDrawer) {
    return null;
  }

  const isObjectPage = page === 'index' || page === 'record';

  if (page === 'other' || (isObjectPage && !isDefined(objectMetadataItem))) {
    return null;
  }

  const title = isDefined(objectMetadataItem)
    ? objectMetadataItem.labelPlural
    : t`Menu`;

  const backLink =
    page === 'record' && isDefined(objectMetadataItem)
      ? getObjectNavigationMenuItemComputedLink(
          { targetObjectMetadataId: objectMetadataItem.id },
          objectMetadataItems,
          views,
          lastVisitedViewPerObjectMetadataItem?.[objectMetadataItem.id],
        )
      : undefined;

  const creatableObjectMetadataItem =
    isDefined(objectMetadataItem) &&
    canCreateRecordsForObjectMetadataItem({
      objectPermissions: getObjectPermissionsForObject(
        objectPermissionsByObjectMetadataId,
        objectMetadataItem.id,
      ),
      objectMetadataItem,
    })
      ? objectMetadataItem
      : undefined;

  // A dashboard renders under a DASHBOARD layoutType, not RECORD_PAGE
  // (PageLayoutRecordPageRenderer), so the fork's mobile record page and its
  // summary card do not take over there: upstream's row stays, "⋮" included.
  const isDashboardPage =
    isDefined(objectMetadataItem) &&
    objectMetadataItem.nameSingular === CoreObjectNameSingular.Dashboard;

  // The header sits inside DefaultLayout's outer boundary (the full-screen
  // fallback), not the page's, so a throw from the record actions' data hook
  // is fenced here: the three controls go, the rest of the layout stays, and
  // the next record remounts them (the key) for another go. Recovery is by
  // that remount rather than AppErrorBoundary's reset-on-location-change
  // because the effect behind it lives in a fallback whose element type
  // AppErrorBoundary recreates on each render, and this header re-renders on
  // every location change — the effect would be remounted holding the new
  // location before it could compare, and never fire from here. The inline
  // fallback is fine for the same reason: it renders nothing and keeps
  // nothing, so being recreated per render costs nothing.
  const recordHeaderActions =
    page === 'record' &&
    isDefined(objectMetadataItem) &&
    isDefined(objectRecordId) &&
    !isLayoutCustomizationModeEnabled &&
    !isDashboardPage ? (
      <AppErrorBoundary
        key={objectRecordId}
        resetOnLocationChange={false}
        FallbackComponent={() => null}
      >
        <IcehouseMobileRecordHeaderActions
          objectMetadataItem={objectMetadataItem}
          objectRecordId={objectRecordId}
          controlClassName={mobileHeaderControlClass}
        />
      </AppErrorBoundary>
    ) : null;

  return (
    <StyledHeader data-icehouse="mobile-header" data-icehouse-page={page}>
      {isDefined(backLink) && (
        <Link
          className={mobileHeaderControlClass}
          to={backLink}
          data-icehouse-part="back"
          aria-label={t`Back to ${title}`}
        >
          <IconChevronLeft size={theme.icon.size.lg} aria-hidden />
        </Link>
      )}
      <StyledTitle data-icehouse-part="title">{title}</StyledTitle>
      <StyledActions>
        {page === 'record' ? (
          recordHeaderActions
        ) : (
          <>
            {isDefined(creatableObjectMetadataItem) && (
              <button
                type="button"
                className={mobileHeaderControlClass}
                data-icehouse-part="create"
                aria-label={t`Create ${creatableObjectMetadataItem.labelSingular}`}
                onClick={() =>
                  setObjectMetadataItemToCreate(creatableObjectMetadataItem)
                }
              >
                <IconPlus size={theme.icon.size.lg} aria-hidden />
              </button>
            )}
            <button
              type="button"
              className={mobileHeaderControlClass}
              data-icehouse-part="search"
              aria-label={t`Search`}
              onClick={openRecordsSearchPage}
            >
              <IconSearch size={theme.icon.size.lg} aria-hidden />
            </button>
            {page === 'index' && (
              <button
                type="button"
                className={mobileHeaderControlClass}
                data-icehouse-part="actions"
                aria-label={t`Command Menu`}
                onClick={openSidePanelMenu}
              >
                <IconDotsVertical size={theme.icon.size.lg} aria-hidden />
              </button>
            )}
          </>
        )}
      </StyledActions>
      {isDefined(objectMetadataItemToCreate) && (
        <IcehouseTopBarCreateRecordEffect
          key={objectMetadataItemToCreate.id}
          objectMetadataItem={objectMetadataItemToCreate}
          onDone={() => setObjectMetadataItemToCreate(null)}
        />
      )}
    </StyledHeader>
  );
};
