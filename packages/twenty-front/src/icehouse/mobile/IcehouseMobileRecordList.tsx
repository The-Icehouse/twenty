import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useOpenRecordFromIndexView } from '@/object-record/record-index/hooks/useOpenRecordFromIndexView';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useEffect, useState } from 'react';
import { OpenRecordIn } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IcehouseMobileRecordCard } from '~/icehouse/mobile/IcehouseMobileRecordCard';
import { useIcehouseMobileRecordList } from '~/icehouse/mobile/useIcehouseMobileRecordList';

// Icehouse fork — the index page as a card list on phones (HubSpot's mobile
// list), mounted by RecordIndexTableContainer around RecordTableWithWrappers:
// on desktop this renders its children (the table) untouched; on mobile
// (useIsMobile, max-width 768px) it renders the cards instead, so the table
// and its virtualiser never mount on a phone. Only TABLE views come through
// here — kanban / calendar / list views stay as upstream renders them.
//
// Data: useIcehouseMobileRecordList (the view's own filters, search and sorts
// through upstream's query hooks; cursor fetchMore for infinite scroll).
// Tap: useOpenRecordFromIndexView with RECORD_PAGE, which captures the view's
// filters/sorts as the record page's parent view so prev/next keep working.

const StyledScrollArea = styled.div`
  background: ${themeCssVariables.background.secondary};
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${themeCssVariables.spacing[3]};
  padding-bottom: calc(
    ${themeCssVariables.spacing[20]} + env(safe-area-inset-bottom, 0px)
  );
  width: 100%;
`;

const StyledCount = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 0 ${themeCssVariables.spacing[1]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[8]} ${themeCssVariables.spacing[3]};
  text-align: center;
`;

const StyledSkeletonCard = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: 12px;
  flex-shrink: 0;
  height: 64px;
  width: 100%;
`;

const StyledSentinel = styled.div`
  flex-shrink: 0;
  height: 1px;
  width: 100%;
`;

const StyledLoadingMore = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
  text-align: center;
`;

const SKELETON_CARD_COUNT = 8;

// Start the next page when the sentinel comes within this much of the
// viewport's bottom edge, so the user rarely sees the end of the list.
const FETCH_MORE_ROOT_MARGIN = '400px 0px';

const IcehouseMobileRecordListContent = () => {
  const { t } = useLingui();
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { formatNumber } = useNumberFormat();

  const {
    records,
    totalCount,
    loading,
    fetchMoreRecords,
    hasNextPage,
    isFetchingMoreRecords,
  } = useIcehouseMobileRecordList();

  const { openRecordFromIndexView } = useOpenRecordFromIndexView();

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [sentinelElement, setSentinelElement] = useState<HTMLDivElement | null>(
    null,
  );

  const recordCount = records.length;

  // Infinite scroll. The observer is re-armed whenever the page grows or a
  // fetch settles, so a short page that leaves the sentinel in view still
  // asks for the next one (IntersectionObserver reports on observe()).
  useEffect(() => {
    if (
      !isDefined(scrollElement) ||
      !isDefined(sentinelElement) ||
      recordCount === 0 ||
      !hasNextPage ||
      isFetchingMoreRecords
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchMoreRecords();
        }
      },
      { root: scrollElement, rootMargin: FETCH_MORE_ROOT_MARGIN },
    );

    observer.observe(sentinelElement);

    return () => observer.disconnect();
  }, [
    scrollElement,
    sentinelElement,
    recordCount,
    hasNextPage,
    isFetchingMoreRecords,
    fetchMoreRecords,
  ]);

  const handleOpenRecord = (recordId: string) => {
    openRecordFromIndexView({ recordId }, OpenRecordIn.RECORD_PAGE);
  };

  const objectLabel = objectMetadataItem.labelPlural.toLocaleLowerCase();
  const isInitialLoading = loading && recordCount === 0;

  return (
    <StyledScrollArea data-icehouse="mobile-list" ref={setScrollElement}>
      {isDefined(totalCount) && (
        <StyledCount data-icehouse-part="count">
          {formatNumber(totalCount)} {objectLabel}
        </StyledCount>
      )}
      {isInitialLoading &&
        Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <StyledSkeletonCard key={index} data-icehouse-part="skeleton" />
        ))}
      {!isInitialLoading && recordCount === 0 && (
        <StyledEmpty data-icehouse-part="empty">
          {t`No ${objectLabel} match this view`}
        </StyledEmpty>
      )}
      {records.map((record) => (
        <IcehouseMobileRecordCard
          key={record.id}
          record={record}
          objectMetadataItem={objectMetadataItem}
          onOpen={handleOpenRecord}
        />
      ))}
      <StyledSentinel
        ref={setSentinelElement}
        aria-hidden
        data-icehouse-part="sentinel"
      />
      {isFetchingMoreRecords && (
        <StyledLoadingMore data-icehouse-part="loading-more">
          {t`Loading more…`}
        </StyledLoadingMore>
      )}
    </StyledScrollArea>
  );
};

type IcehouseMobileRecordListProps = {
  children: ReactNode;
};

export const IcehouseMobileRecordList = ({
  children,
}: IcehouseMobileRecordListProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return <IcehouseMobileRecordListContent />;
};
