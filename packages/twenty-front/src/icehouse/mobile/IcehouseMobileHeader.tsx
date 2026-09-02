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
import { isDefined } from 'twenty-shared/utils';
import {
  IconChevronLeft,
  IconDotsVertical,
  IconPlus,
  IconSearch,
} from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
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
// Home. Right, 44px each: "+" creating a record of the current object through
// the fork's IcehouseTopBarCreateRecordEffect (the CREATE_NEW_RECORD path
// minus the index-only parts — this header sits outside the record-index
// providers useCreateNewIndexRecord needs — honouring openRecordIn and shown
// only when upstream's own predicate says the member can create), the search
// icon opening the same side-panel search page as the stock pill's Search,
// and on index pages the command-menu "⋮" upstream's header carried.
//
// On index pages this replaces upstream's PageCardHeader row (icon + title +
// icon-only pinned commands + "⋮"); icehouse.css hides that row through the
// data-icehouse-page="index" hook here and the data-icehouse hook on
// PageCardHeader. The record page keeps upstream's row — it holds the avatar,
// the editable record name and the record actions — so there this is a
// navigation row above it, not a second title.
export const IcehouseMobileHeader = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const isSettingsDrawer = useIsSettingsDrawer();
  const { page, objectMetadataItem } = useIcehouseMobileObjectContext();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  const { openSidePanelMenu } = useSidePanelMenu();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
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
