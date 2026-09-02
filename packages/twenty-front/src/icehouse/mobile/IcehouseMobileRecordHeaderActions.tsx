import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRecordShowPagePagination } from '@/object-record/record-show/hooks/useRecordShowPagePagination';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useLingui } from '@lingui/react/macro';
import {
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
} from 'twenty-ui/icon';
import { useTheme } from 'twenty-ui/theme-constants';

type IcehouseMobileRecordHeaderActionsProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectRecordId: string;
  // The header's 44px control class, passed in rather than imported so this
  // file and IcehouseMobileHeader do not import each other.
  controlClassName: string;
};

// The right-hand side of the phone record header: previous record, next
// record, "⋮". These are the three controls upstream's PageCardHeader row
// carried on a record page that the fork's summary card below does not
// already cover (the row's other pinned commands — favourite, export,
// delete — are reached through "⋮", see the mobile-record-header section of
// icehouse.css). Prev/next reuse upstream's own hook: its NAVIGATE_TO_NEXT /
// PREVIOUS_RECORD command menu items are headless commands that call the same
// useRecordShowPagePagination, which orders by the parent view's sorts and
// filters (read from the MAIN context store by instance id, so no provider is
// needed up here in DefaultLayout) and wraps around at either end exactly as
// those commands do; the buttons are disabled while the neighbour queries
// are loading, which is the `ready` gate those commands wait on. The hook
// throws without an object name and a record id, so this only mounts on a
// matched record route, and only on the phone (the header returns null on
// desktop before rendering it). The chevrons point up and down — the glyphs
// upstream seeds for these two commands, a view being a vertical list — so
// "previous record" is not the same left-pointing chevron as the header's
// back link in the same 52px row.
export const IcehouseMobileRecordHeaderActions = ({
  objectMetadataItem,
  objectRecordId,
  controlClassName,
}: IcehouseMobileRecordHeaderActionsProps) => {
  const { t } = useLingui();
  const theme = useTheme();
  const { openSidePanelMenu } = useSidePanelMenu();
  const {
    navigateToPreviousRecord,
    navigateToNextRecord,
    isLoadingPagination,
  } = useRecordShowPagePagination(
    objectMetadataItem.nameSingular,
    objectRecordId,
  );

  const objectLabelSingular = objectMetadataItem.labelSingular;

  return (
    <>
      <button
        type="button"
        className={controlClassName}
        data-icehouse-part="previous"
        aria-label={t`Navigate to previous ${objectLabelSingular}`}
        disabled={isLoadingPagination}
        onClick={navigateToPreviousRecord}
      >
        <IconChevronUp size={theme.icon.size.lg} aria-hidden />
      </button>
      <button
        type="button"
        className={controlClassName}
        data-icehouse-part="next"
        aria-label={t`Navigate to next ${objectLabelSingular}`}
        disabled={isLoadingPagination}
        onClick={navigateToNextRecord}
      >
        <IconChevronDown size={theme.icon.size.lg} aria-hidden />
      </button>
      <button
        type="button"
        className={controlClassName}
        data-icehouse-part="actions"
        aria-label={t`Command Menu`}
        onClick={openSidePanelMenu}
      >
        <IconDotsVertical size={theme.icon.size.lg} aria-hidden />
      </button>
    </>
  );
};
