import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useSetRecordFilterUsedInAdvancedFilterDropdownRow } from '@/object-record/advanced-filter/hooks/useSetRecordFilterUsedInAdvancedFilterDropdownRow';
import { ObjectFilterDropdownContentWrapper } from '@/object-record/object-filter-dropdown/components/ObjectFilterDropdownContentWrapper';
import { ObjectFilterDropdownFilterInput } from '@/object-record/object-filter-dropdown/components/ObjectFilterDropdownFilterInput';
import { getCompositeSubFieldLabel } from '@/object-record/object-filter-dropdown/utils/getCompositeSubFieldLabel';
import { isCompositeFieldType } from '@/object-record/object-filter-dropdown/utils/isCompositeFieldType';
import { useResetFilterDropdown } from '@/object-record/object-filter-dropdown/hooks/useResetFilterDropdown';
import { ObjectFilterDropdownComponentInstanceContext } from '@/object-record/object-filter-dropdown/states/contexts/ObjectFilterDropdownComponentInstanceContext';
import { useUpsertRecordFilterGroup } from '@/object-record/record-filter-group/hooks/useUpsertRecordFilterGroup';
import { currentRecordFilterGroupsComponentState } from '@/object-record/record-filter-group/states/currentRecordFilterGroupsComponentState';
import { useCheckIsSoftDeleteFilter } from '@/object-record/record-filter/hooks/useCheckIsSoftDeleteFilter';
import { useCreateEmptyRecordFilterFromFieldMetadataItem } from '@/object-record/record-filter/hooks/useCreateEmptyRecordFilterFromFieldMetadataItem';
import { useFilterableFieldMetadataItemsInRecordIndexContext } from '@/object-record/record-filter/hooks/useFilterableFieldMetadataItemsInRecordIndexContext';
import { useRemoveRecordFilter } from '@/object-record/record-filter/hooks/useRemoveRecordFilter';
import { useUpsertRecordFilter } from '@/object-record/record-filter/hooks/useUpsertRecordFilter';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { isRecordFilterConsideredEmpty } from '@/object-record/record-filter/utils/isRecordFilterConsideredEmpty';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { isValidSubFieldName } from '@/settings/data-model/utils/isValidSubFieldName';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useOpenDropdown } from '@/ui/layout/dropdown/hooks/useOpenDropdown';
import { useToggleDropdown } from '@/ui/layout/dropdown/hooks/useToggleDropdown';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { ViewBarFilterDropdownIds } from '@/views/constants/ViewBarFilterDropdownIds';
import { EditableFilterChipDropdownMenuHeader } from '@/views/editable-chip/components/EditableFilterChipDropdownMenuHeader';
import { getEditableChipObjectFilterDropdownComponentInstanceId } from '@/views/editable-chip/utils/getEditableChipObjectFilterDropdownComponentInstanceId';
import { useComputeRecordRelationFilterLabelValue } from '@/views/hooks/useComputeRecordRelationFilterLabelValue';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { useGetRecordFilterChipLabelValue } from '@/views/hooks/useGetRecordFilterChipLabelValue';
import { useSetEditableFilterChipDropdownStates } from '@/views/hooks/useSetEditableFilterChipDropdownStates';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type MouseEvent } from 'react';
import { RecordFilterGroupLogicalOperator } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconChevronDown, IconFilter, IconPlus, IconX } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { v4 } from 'uuid';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { getIcehouseQuickFilterFieldNames } from '~/icehouse/quick-filters/quickFilterFields';

// Icehouse fork — HubSpot's always-present quick-filter chip row
// ("Owner ▾ · Create date ▾ · Lead status ▾ · + · Advanced filters").
//
// Rendered by ViewBar.tsx directly below the Icehouse index toolbar, desktop
// only. The chip SET is config-driven (quickFilterFields.ts), so a chip stays on
// screen whether or not a filter on its field exists — unlike ViewBarDetails,
// which only draws chips for active filters and deletes a filter the moment it
// is closed empty. Everything a chip does goes through upstream:
//
//   - click with no filter on the field → useCreateEmptyRecordFilterFromFieldMetadataItem
//     + useUpsertRecordFilter (same as clicking "Filter" in a table header), then
//     upstream's own field editor (ObjectFilterDropdownFilterInput inside the
//     editable-chip header/wrapper) opens on that filter;
//   - the editor's state atoms are keyed by the filter id through
//     ObjectFilterDropdownComponentInstanceContext, exactly as ViewBarDetails
//     keys them, so the chip and upstream's chip for the same filter share one
//     editing state;
//   - closing the editor with the filter still empty removes it (upstream's
//     EditableFilterDropdownButton rule), which is why the chip must not depend
//     on the filter existing;
//   - "+" opens upstream's main Filter dropdown (ViewBarFilterDropdownIds.MAIN,
//     mounted by the toolbar's Filter button); "Advanced filters" creates the
//     root filter group the way upstream's "Advanced filter" menu item does and
//     opens ViewBarFilterDropdownIds.ADVANCED by id — that Dropdown is mounted by
//     ViewBarDetails once a root group exists.
//
// One chip per filter. ViewBarDetails, the sibling ViewBar.tsx renders right
// after this row, draws its own editable chip for every top-level filter, so an
// applied quick filter used to show twice. Two things fix that without touching
// ViewBarDetails: (1) besides the configured chips, the row ADOPTS every other
// top-level filter (added via "+", a table header, or as a second filter on a
// configured field) as a chip of its own, the way HubSpot appends added filters
// to the row — that chip disappears with the filter; (2) when every top-level
// filter has a chip here the row sets data-icehouse-all-owned on itself and
// icehouse.css parks ViewBarDetails' filter chips (its sort / Deleted /
// search / Advanced chips, "+", Reset and "Update view" stay). The only case
// that still shows both is a filter on a field this object cannot filter on.
//
// Stable CSS hooks (icehouse.css, no hashed classes): the row carries
// data-icehouse="quick-filters" (+ data-icehouse-all-owned, above); each chip
// data-icehouse-part="chip" | "add" | "advanced" (+ "clear" / "count" for the
// inner controls) and data-active when a filter is applied.

const StyledRow = styled.div`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 40px;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[1]} 0;
`;

const StyledChip = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  flex-direction: row;
  height: 28px;
  overflow: hidden;
  white-space: nowrap;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }

  &[data-active] {
    border-color: ${themeCssVariables.color.blue};
    color: ${themeCssVariables.color.blue};
  }
`;

const StyledChipButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: 100%;
  margin: 0;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 1px solid ${themeCssVariables.color.blue};
    outline-offset: -1px;
  }

  &:disabled {
    color: ${themeCssVariables.font.color.tertiary};
    cursor: default;
  }
`;

const StyledChipValue = styled.span`
  font-weight: ${themeCssVariables.font.weight.regular};
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledChipClear = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  height: 100%;
  margin: 0;
  padding: 0 ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledCount = styled.span`
  align-items: center;
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  height: 16px;
  justify-content: center;
  line-height: 16px;
  min-width: 16px;
  padding: 0 ${themeCssVariables.spacing[1]};
`;

// Configured chips are keyed by their field, adopted ones by their filter, so
// a configured chip keeps one dropdown id while its filter is created/removed.
const getIcehouseQuickFilterDropdownId = (key: string) =>
  `icehouse-quick-filter-${key}`;

type IcehouseQuickFilterRelationChipValueProps = {
  recordFilter: RecordFilter;
};

// Relation values ("Owner: Toby") need the related records resolved to names —
// upstream's EditableRelationFilterChip hook does that.
const IcehouseQuickFilterRelationChipValue = ({
  recordFilter,
}: IcehouseQuickFilterRelationChipValueProps) => {
  const { labelValue } = useComputeRecordRelationFilterLabelValue({
    recordFilter,
  });

  return <>{labelValue}</>;
};

type IcehouseQuickFilterStandardChipValueProps = {
  recordFilter: RecordFilter;
};

const IcehouseQuickFilterStandardChipValue = ({
  recordFilter,
}: IcehouseQuickFilterStandardChipValueProps) => {
  const { getRecordFilterChipLabelValue } = useGetRecordFilterChipLabelValue();

  return <>{getRecordFilterChipLabelValue({ recordFilter })}</>;
};

type IcehouseQuickFilterChipProps = {
  dropdownId: string;
  fieldMetadataItem: FieldMetadataItem;
  recordFilter: RecordFilter | undefined;
  viewBarId: string;
};

const IcehouseQuickFilterChip = ({
  dropdownId,
  fieldMetadataItem,
  recordFilter,
  viewBarId,
}: IcehouseQuickFilterChipProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  const { createEmptyRecordFilterFromFieldMetadataItem } =
    useCreateEmptyRecordFilterFromFieldMetadataItem();
  const { upsertRecordFilter } = useUpsertRecordFilter(viewBarId);
  const { removeRecordFilter } = useRemoveRecordFilter(viewBarId);
  const { setEditableFilterChipDropdownStates } =
    useSetEditableFilterChipDropdownStates();
  const { closeDropdown } = useCloseDropdown();

  const isActive = isDefined(recordFilter);

  // Editor state is keyed by the filter's id (shared with the ViewBarDetails
  // chip for the same filter). With no filter yet the panel is closed and no
  // consumer reads the instance, so any placeholder id will do.
  const objectFilterDropdownInstanceId =
    getEditableChipObjectFilterDropdownComponentInstanceId({
      recordFilterId: recordFilter?.id ?? dropdownId,
    });

  // Runs before the Dropdown's own click handler (which toggles the panel), so
  // the filter and its editor state exist by the time the panel renders.
  const handleChipClick = () => {
    if (isDefined(recordFilter)) {
      setEditableFilterChipDropdownStates(recordFilter);
      return;
    }

    const { newRecordFilter } =
      createEmptyRecordFilterFromFieldMetadataItem(fieldMetadataItem);

    upsertRecordFilter(newRecordFilter);
    setEditableFilterChipDropdownStates(newRecordFilter);
  };

  const handleClearClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!isDefined(recordFilter)) {
      return;
    }

    closeDropdown(dropdownId);
    removeRecordFilter({ recordFilterId: recordFilter.id });
  };

  // Upstream's rule for editable chips: a filter closed while still empty is
  // discarded. The chip itself stays because it is drawn from config.
  const handleDropdownClose = () => {
    if (
      isDefined(recordFilter) &&
      isRecordFilterConsideredEmpty(recordFilter)
    ) {
      removeRecordFilter({ recordFilterId: recordFilter.id });
    }
  };

  // Spelled like upstream's EditableFilterChip: the field, plus the composite
  // sub-field the filter is on ("Email / Primary email") when there is one.
  const subFieldName = recordFilter?.subFieldName;
  const subFieldLabel =
    isCompositeFieldType(fieldMetadataItem.type) &&
    fieldMetadataItem.type !== FieldMetadataType.ACTOR &&
    isNonEmptyString(subFieldName) &&
    isValidSubFieldName(subFieldName)
      ? getCompositeSubFieldLabel(fieldMetadataItem.type, subFieldName)
      : '';

  const fieldLabel = isNonEmptyString(subFieldLabel)
    ? `${fieldMetadataItem.label} / ${subFieldLabel}`
    : fieldMetadataItem.label;

  return (
    <ObjectFilterDropdownComponentInstanceContext.Provider
      value={{ instanceId: objectFilterDropdownInstanceId }}
    >
      <Dropdown
        dropdownId={dropdownId}
        dropdownPlacement="bottom-start"
        dropdownOffset={{ x: 0, y: 4 }}
        onClose={handleDropdownClose}
        clickableComponent={
          <StyledChip
            data-icehouse-part="chip"
            data-field={fieldMetadataItem.name}
            data-active={isActive || undefined}
          >
            <StyledChipButton type="button" onClick={handleChipClick}>
              {fieldLabel}
              {isDefined(recordFilter) && (
                <StyledChipValue>
                  {recordFilter.type === 'RELATION' ? (
                    <IcehouseQuickFilterRelationChipValue
                      recordFilter={recordFilter}
                    />
                  ) : (
                    <IcehouseQuickFilterStandardChipValue
                      recordFilter={recordFilter}
                    />
                  )}
                </StyledChipValue>
              )}
              <IconChevronDown size={theme.icon.size.sm} aria-hidden />
            </StyledChipButton>
            {isDefined(recordFilter) && (
              <StyledChipClear
                type="button"
                data-icehouse-part="clear"
                aria-label={t`Clear ${fieldLabel} filter`}
                title={t`Clear ${fieldLabel} filter`}
                onClick={handleClearClick}
              >
                <IconX size={theme.icon.size.sm} aria-hidden />
              </StyledChipClear>
            )}
          </StyledChip>
        }
        dropdownComponents={
          isDefined(recordFilter) ? (
            <ObjectFilterDropdownContentWrapper>
              <EditableFilterChipDropdownMenuHeader />
              <ObjectFilterDropdownFilterInput
                filterDropdownId={dropdownId}
                recordFilterId={recordFilter.id}
              />
            </ObjectFilterDropdownContentWrapper>
          ) : null
        }
      />
    </ObjectFilterDropdownComponentInstanceContext.Provider>
  );
};

// "+" — upstream's main Filter dropdown, reset to its field list first (same
// as ViewBarDetailsAddFilterButton). The panel anchors to the toolbar's Filter
// button, which owns that dropdown id on desktop.
const IcehouseQuickFilterAddChip = () => {
  const { t } = useLingui();
  const theme = useTheme();

  const { toggleDropdown } = useToggleDropdown();
  const { resetFilterDropdown } = useResetFilterDropdown(
    ViewBarFilterDropdownIds.MAIN,
  );

  const handleClick = () => {
    resetFilterDropdown();
    toggleDropdown({
      dropdownComponentInstanceIdFromProps: ViewBarFilterDropdownIds.MAIN,
    });
  };

  const label = t`Add filter`;

  return (
    <StyledChip data-icehouse-part="add">
      <StyledChipButton
        type="button"
        aria-label={label}
        title={label}
        onClick={handleClick}
      >
        <IconPlus size={theme.icon.size.sm} aria-hidden />
      </StyledChipButton>
    </StyledChip>
  );
};

type IcehouseQuickFilterAdvancedChipProps = {
  viewBarId: string;
};

// "Advanced filters" — what upstream's "Advanced filter" menu item (inside the
// main Filter dropdown) does: make sure a root filter group with one empty row
// exists, then open ViewBarFilterDropdownIds.ADVANCED by id. ViewBarDetails
// mounts that Dropdown as soon as a root group exists, and a Dropdown mounting
// with its open state already set renders open.
const IcehouseQuickFilterAdvancedChip = ({
  viewBarId,
}: IcehouseQuickFilterAdvancedChipProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { filterableFieldMetadataItems } =
    useFilterableFieldMetadataItemsInRecordIndexContext();
  const { currentView } = useGetCurrentViewOnly();

  const currentRecordFilterGroups = useAtomComponentStateValue(
    currentRecordFilterGroupsComponentState,
    viewBarId,
  );
  const currentRecordFilters = useAtomComponentStateValue(
    currentRecordFiltersComponentState,
    viewBarId,
  );

  const { upsertRecordFilterGroup } = useUpsertRecordFilterGroup();
  const { upsertRecordFilter } = useUpsertRecordFilter(viewBarId);
  const { createEmptyRecordFilterFromFieldMetadataItem } =
    useCreateEmptyRecordFilterFromFieldMetadataItem();
  const { setRecordFilterUsedInAdvancedFilterDropdownRow } =
    useSetRecordFilterUsedInAdvancedFilterDropdownRow();
  const { openDropdown } = useOpenDropdown();

  const advancedFilterCount = currentRecordFilters.filter((recordFilter) =>
    isDefined(recordFilter.recordFilterGroupId),
  ).length;

  const handleClick = () => {
    if (currentRecordFilterGroups.length === 0) {
      const defaultFieldMetadataItem =
        filterableFieldMetadataItems.find(
          (fieldMetadataItem) =>
            fieldMetadataItem.id ===
            objectMetadataItem.labelIdentifierFieldMetadataId,
        ) ?? filterableFieldMetadataItems[0];

      if (!isDefined(defaultFieldMetadataItem)) {
        return;
      }

      const newRecordFilterGroup = {
        id: v4(),
        logicalOperator: RecordFilterGroupLogicalOperator.AND,
      };

      upsertRecordFilterGroup(newRecordFilterGroup);

      const { newRecordFilter } = createEmptyRecordFilterFromFieldMetadataItem(
        defaultFieldMetadataItem,
      );

      newRecordFilter.recordFilterGroupId = newRecordFilterGroup.id;

      upsertRecordFilter(newRecordFilter);
      setRecordFilterUsedInAdvancedFilterDropdownRow(newRecordFilter);
    }

    openDropdown({
      dropdownComponentInstanceIdFromProps: ViewBarFilterDropdownIds.ADVANCED,
    });
  };

  return (
    <StyledChip
      data-icehouse-part="advanced"
      data-active={advancedFilterCount > 0 || undefined}
    >
      <StyledChipButton
        type="button"
        disabled={!isDefined(currentView)}
        onClick={handleClick}
      >
        <IconFilter size={theme.icon.size.sm} aria-hidden />
        {t`Advanced filters`}
        {advancedFilterCount > 0 && (
          <StyledCount data-icehouse-part="count">
            {advancedFilterCount}
          </StyledCount>
        )}
      </StyledChipButton>
    </StyledChip>
  );
};

type IcehouseQuickFilterRowProps = {
  viewBarId: string;
};

export const IcehouseQuickFilterRow = ({
  viewBarId,
}: IcehouseQuickFilterRowProps) => {
  const { t } = useLingui();
  const isMobile = useIsMobile();

  const { objectNameSingular } = useRecordIndexContextOrThrow();
  const { filterableFieldMetadataItems } =
    useFilterableFieldMetadataItemsInRecordIndexContext();

  const currentRecordFilters = useAtomComponentStateValue(
    currentRecordFiltersComponentState,
    viewBarId,
  );

  const { isSeeDeletedRecordsFilter } = useCheckIsSoftDeleteFilter();

  // Config names → this object's filterable fields, in config order; anything
  // the object lacks (or cannot filter on) is simply not a chip.
  const quickFilterFieldMetadataItems = getIcehouseQuickFilterFieldNames(
    objectNameSingular,
  )
    .map((fieldName) =>
      filterableFieldMetadataItems.find(
        (fieldMetadataItem) => fieldMetadataItem.name === fieldName,
      ),
    )
    .filter(isDefined);

  // Objects with no configured chips keep the index page exactly as Tier 1
  // left it rather than showing a row with only "+" and "Advanced filters".
  if (isMobile || quickFilterFieldMetadataItems.length === 0) {
    return null;
  }

  // The filters ViewBarDetails draws chips for: not inside an advanced-filter
  // group, and not the "Deleted" toggle (that one has its own chip there).
  const topLevelRecordFilters = currentRecordFilters.filter(
    (recordFilter) =>
      !isDefined(recordFilter.recordFilterGroupId) &&
      !isSeeDeletedRecordsFilter(recordFilter),
  );

  // A configured chip edits the first top-level filter on its field — the
  // same one a table-header "Filter" click would reuse.
  const configuredChips = quickFilterFieldMetadataItems.map(
    (fieldMetadataItem) => ({
      fieldMetadataItem,
      recordFilter: topLevelRecordFilters.find(
        (recordFilter) => recordFilter.fieldMetadataId === fieldMetadataItem.id,
      ),
    }),
  );

  const claimedRecordFilterIds = new Set(
    configuredChips
      .map((configuredChip) => configuredChip.recordFilter?.id)
      .filter(isDefined),
  );

  // Every other top-level filter gets a chip of its own after the configured
  // ones (see the header comment); one on a field this object cannot filter
  // on is left to ViewBarDetails alone.
  const adoptedChips = topLevelRecordFilters
    .filter((recordFilter) => !claimedRecordFilterIds.has(recordFilter.id))
    .map((recordFilter) => {
      const fieldMetadataItem = filterableFieldMetadataItems.find(
        (candidate) => candidate.id === recordFilter.fieldMetadataId,
      );

      return isDefined(fieldMetadataItem)
        ? { fieldMetadataItem, recordFilter }
        : undefined;
    })
    .filter(isDefined);

  const ownedRecordFilterIds = new Set([
    ...claimedRecordFilterIds,
    ...adoptedChips.map((adoptedChip) => adoptedChip.recordFilter.id),
  ]);

  const isEveryTopLevelFilterOwned = topLevelRecordFilters.every(
    (recordFilter) => ownedRecordFilterIds.has(recordFilter.id),
  );

  return (
    <StyledRow
      data-icehouse="quick-filters"
      data-icehouse-all-owned={isEveryTopLevelFilterOwned || undefined}
      role="group"
      aria-label={t`Quick filters`}
    >
      {configuredChips.map(({ fieldMetadataItem, recordFilter }) => (
        <IcehouseQuickFilterChip
          key={fieldMetadataItem.id}
          dropdownId={getIcehouseQuickFilterDropdownId(fieldMetadataItem.id)}
          fieldMetadataItem={fieldMetadataItem}
          recordFilter={recordFilter}
          viewBarId={viewBarId}
        />
      ))}
      {adoptedChips.map(({ fieldMetadataItem, recordFilter }) => (
        <IcehouseQuickFilterChip
          key={recordFilter.id}
          dropdownId={getIcehouseQuickFilterDropdownId(recordFilter.id)}
          fieldMetadataItem={fieldMetadataItem}
          recordFilter={recordFilter}
          viewBarId={viewBarId}
        />
      ))}
      <IcehouseQuickFilterAddChip />
      <IcehouseQuickFilterAdvancedChip viewBarId={viewBarId} />
    </StyledRow>
  );
};
