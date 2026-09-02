import { labelIdentifierFieldMetadataItemSelector } from '@/object-metadata/states/labelIdentifierFieldMetadataItemSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { formatFieldMetadataItemAsColumnDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsColumnDefinition';
import { currentRecordFieldsComponentState } from '@/object-record/record-field/states/currentRecordFieldsComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

const NO_FIELDS: EnrichedObjectMetadataItem['fields'] = [];

export const useRecordIndexFieldMetadataDerivedStates = (
  objectMetadataItem: EnrichedObjectMetadataItem | undefined,
  recordIndexId?: string | undefined,
) => {
  const fieldMetadataItems = objectMetadataItem?.fields ?? NO_FIELDS;

  // Icehouse (perf): memoised — these maps feed RecordIndexContext, and a new
  // identity per render re-renders every table cell.
  const fieldMetadataItemByFieldMetadataItemId = useMemo(
    () =>
      Object.fromEntries(
        fieldMetadataItems.map((fieldMetadataItem) => [
          fieldMetadataItem.id,
          fieldMetadataItem,
        ]),
      ),
    [fieldMetadataItems],
  );

  const currentRecordFields = useAtomComponentStateValue(
    currentRecordFieldsComponentState,
    recordIndexId,
  );

  const recordFieldByFieldMetadataItemId = useMemo(
    () =>
      Object.fromEntries(
        currentRecordFields.map((recordField) => [
          recordField.fieldMetadataItemId,
          recordField,
        ]),
      ),
    [currentRecordFields],
  );

  const fieldDefinitionByFieldMetadataItemId = useMemo(
    () =>
      isDefined(objectMetadataItem)
        ? Object.fromEntries(
            fieldMetadataItems.map((fieldMetadataItem) => [
              fieldMetadataItem.id,
              formatFieldMetadataItemAsColumnDefinition({
                field: fieldMetadataItem,
                objectMetadataItem,
                position:
                  recordFieldByFieldMetadataItemId[fieldMetadataItem.id]
                    ?.position ?? 0,
                labelWidth:
                  recordFieldByFieldMetadataItemId[fieldMetadataItem.id]
                    ?.size ?? 0,
              }),
            ]),
          )
        : {},
    [objectMetadataItem, fieldMetadataItems, recordFieldByFieldMetadataItemId],
  );

  const labelIdentifierFieldMetadataItem = useAtomFamilySelectorValue(
    labelIdentifierFieldMetadataItemSelector,
    {
      objectMetadataItemId: objectMetadataItem?.id ?? '',
    },
  );

  return {
    fieldMetadataItemByFieldMetadataItemId,
    labelIdentifierFieldMetadataItem,
    fieldDefinitionByFieldMetadataItemId,
    recordFieldByFieldMetadataItemId,
  };
};
