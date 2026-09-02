import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useRelevantRecordsGqlFields } from '@/object-record/record-field/hooks/useRelevantRecordsGqlFields';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useFindManyRecordIndexTableParams } from '@/object-record/record-index/hooks/useFindManyRecordIndexTableParams';
import { isFetchingMoreRecordsFamilyState } from '@/object-record/states/isFetchingMoreRecordsFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { isDefined } from 'twenty-shared/utils';
import { getIcehouseMobileCardFieldNames } from '~/icehouse/mobile/mobileCardFields';

// One cursor page; about seven phone screens of 64px cards.
export const ICEHOUSE_MOBILE_LIST_PAGE_SIZE = 30;

// Data path for the mobile card list. Same composition as upstream's
// useRecordIndexTableQuery (useFindManyRecordIndexTableParams +
// useRelevantRecordsGqlFields + useFindManyRecords), so the query carries the
// view's filters, any-field search, sorts and visible columns exactly as the
// table's does — plus the card fields (company, emails, stage…) a view may not
// show as columns. Paging is upstream's cursor fetchMore, so filter and sort
// changes restart the list the way they restart the table.
//
// The table's own loader (record-table/virtualization useTriggerFetchPages)
// is deliberately not reused: it turns the table ScrollWrapper's pixel
// scrollTop and RECORD_TABLE_ROW_HEIGHT into page numbers and needs the
// RecordTable context mounted, i.e. it is inseparable from the table DOM.
export const useIcehouseMobileRecordList = () => {
  const { objectNameSingular, objectMetadataItem, recordIndexId } =
    useRecordIndexContextOrThrow();

  const { filter, orderBy } = useFindManyRecordIndexTableParams(
    objectNameSingular,
    recordIndexId,
  );

  const cardFieldMetadataIds = getIcehouseMobileCardFieldNames(
    objectNameSingular,
  )
    .map(
      (fieldName) =>
        objectMetadataItem.fields.find((field) => field.name === fieldName)?.id,
    )
    .filter(isDefined);

  const recordGqlFields = useRelevantRecordsGqlFields({
    objectMetadataItem,
    additionalFieldMetadataIds: cardFieldMetadataIds,
  });

  const {
    records,
    totalCount,
    loading,
    error,
    fetchMoreRecords,
    hasNextPage,
    queryIdentifier,
  } = useFindManyRecords({
    objectNameSingular,
    filter,
    orderBy,
    limit: ICEHOUSE_MOBILE_LIST_PAGE_SIZE,
    recordGqlFields,
  });

  const isFetchingMoreRecords = useAtomFamilyStateValue(
    isFetchingMoreRecordsFamilyState,
    queryIdentifier,
  );

  return {
    records,
    totalCount,
    loading,
    error,
    fetchMoreRecords,
    hasNextPage,
    isFetchingMoreRecords,
  };
};
