import { CommandMenuContextProvider } from '@/command-menu-item/contexts/CommandMenuContextProvider';
import { CommandMenuItemContainerType } from '@/command-menu-item/types/CommandMenuItemContainerType';
import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { contextStoreNumberOfSelectedRecordsComponentState } from '@/context-store/states/contextStoreNumberOfSelectedRecordsComponentState';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useGetRecordIndexTotalCount } from '@/views/hooks/internal/useGetRecordIndexTotalCount';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IcehouseBulkActionBar } from '~/icehouse/footer/IcehouseBulkActionBar';
import { IcehouseCloneViewButton } from '~/icehouse/footer/IcehouseCloneViewButton';
import { IcehouseFooterExportButton } from '~/icehouse/footer/IcehouseFooterExportButton';

// Sits after RecordTableWithWrappers inside RecordIndexContainer's column flex, so it
// takes the bottom slot while the table's ScrollWrapper shrinks above it. Colours are
// theme tokens (correct in dark mode); the HubSpot light-mode palette is applied by
// icehouse.css on the data-icehouse hooks below.
const StyledFooter = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  position: relative;
  width: 100%;
`;

const StyledRecordCount = styled.span`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

type IcehouseTableFooterProps = {
  recordTableId: string;
};

type IcehouseTableFooterContentProps = IcehouseTableFooterProps;

const IcehouseTableFooterContent = ({
  recordTableId,
}: IcehouseTableFooterContentProps) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();

  // Aggregate COUNT under the view's current filters and search — the same figure
  // the view picker shows — and, unlike the virtualiser's total, not capped by
  // recordLimit.
  const { totalCount } = useGetRecordIndexTotalCount();
  const { formatNumber } = useNumberFormat();

  const contextStoreNumberOfSelectedRecords = useAtomComponentStateValue(
    contextStoreNumberOfSelectedRecordsComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );

  const objectLabel = objectMetadataItem.labelPlural.toLocaleLowerCase();

  return (
    <StyledFooter data-icehouse="table-footer" data-select-disable="true">
      {contextStoreNumberOfSelectedRecords > 0 && (
        <IcehouseBulkActionBar
          recordTableId={recordTableId}
          numberOfSelectedRecords={contextStoreNumberOfSelectedRecords}
        />
      )}
      <StyledRecordCount data-icehouse="record-count">
        {isDefined(totalCount)
          ? `${formatNumber(totalCount)} ${objectLabel}`
          : objectLabel}
      </StyledRecordCount>
      <StyledActions>
        <CommandMenuContextProvider
          isInSidePanel={false}
          displayType="button"
          containerType={CommandMenuItemContainerType.IndexPageHeader}
        >
          <IcehouseFooterExportButton />
        </CommandMenuContextProvider>
        <IcehouseCloneViewButton />
      </StyledActions>
    </StyledFooter>
  );
};

// Desktop only. The mobile index has no room for a footer, and the split keeps the
// count query from running on phones at all.
export const IcehouseTableFooter = ({
  recordTableId,
}: IcehouseTableFooterProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return <IcehouseTableFooterContent recordTableId={recordTableId} />;
};
