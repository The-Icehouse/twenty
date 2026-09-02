import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useToggleDropdown } from '@/ui/layout/dropdown/hooks/useToggleDropdown';
import { TAB_LIST_GAP } from '@/ui/layout/tab-list/constants/TabListGap';
import { useTabListMeasurements } from '@/ui/layout/tab-list/hooks/useTabListMeasurements';
import { NodeDimension } from '@/ui/utilities/dimensions/components/NodeDimension';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useChangeView } from '@/views/hooks/useChangeView';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { useOpenCreateViewDropdown } from '@/views/hooks/useOpenCreateViewDropown';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { type View } from '@/views/types/View';
import { viewTypeIconMapping } from '@/views/types/ViewType';
import { VIEW_PICKER_DROPDOWN_ID } from '@/views/view-picker/constants/ViewPickerDropdownId';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  IconChevronDown,
  IconDotsVertical,
  IconPlus,
  useIcons,
} from 'twenty-ui/icon';
import { MenuItemSelect } from 'twenty-ui/navigation';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';

// Icehouse fork — HubSpot's view tabs ("All contacts | My contacts | … | +").
//
// Rendered above upstream's ViewBar on the record index page. It only
// *presents* the object's saved views as a tab row; every state change goes
// through upstream hooks (useChangeView writes ?viewId=, useOpenCreateViewDropdown
// opens upstream's create-view form inside the still-mounted ViewPickerDropdown).
// The picker's trigger is collapsed by icehouse.css on desktop; on mobile this
// strip renders nothing and the picker stays as upstream ships it.
//
// Stable CSS hooks (no hashed classes): the container carries
// data-icehouse="view-tabs", every tab carries data-icehouse-tab (= view id,
// "more" or "add") plus data-active when it is the current view.

const ICEHOUSE_VIEW_TABS_MORE_DROPDOWN_ID = 'icehouse-view-tabs-more';

const StyledStrip = styled.div`
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  height: ${themeCssVariables.spacing[10]};
  padding-left: ${themeCssVariables.spacing[3]};
  padding-right: ${themeCssVariables.spacing[2]};
  position: relative;
  user-select: none;
`;

const StyledMeasuredRow = styled(NodeDimension)`
  display: flex;
  flex: 1;
  min-width: 0;
`;

const StyledTabRow = styled.div`
  align-items: stretch;
  display: flex;
  gap: ${TAB_LIST_GAP}px;
  min-width: 0;
  overflow: hidden;
`;

// Off-screen copies of every tab, measured so the visible row can decide how
// many fit before the rest fold into the "More" dropdown (same technique as
// upstream's TabListHiddenMeasurements).
const StyledHiddenMeasurements = styled.div`
  display: flex;
  gap: ${TAB_LIST_GAP}px;
  pointer-events: none;
  position: absolute;
  top: -9999px;
  visibility: hidden;
`;

const StyledTab = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  height: ${themeCssVariables.spacing[10]};
  padding: 0 ${themeCssVariables.spacing[3]};
  white-space: nowrap;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 1px solid ${themeCssVariables.color.blue};
    outline-offset: -1px;
  }

  &[data-active] {
    border-bottom-color: ${themeCssVariables.font.color.primary};
    color: ${themeCssVariables.font.color.primary};
  }

  &:disabled {
    color: ${themeCssVariables.font.color.tertiary};
    cursor: default;
  }
`;

type ViewTabProps = {
  view: View;
  isActive: boolean;
  onSelect?: (viewId: string) => void;
};

const ViewTab = ({ view, isActive, onSelect }: ViewTabProps) => {
  const theme = useTheme();
  const { getIcon } = useIcons();

  const Icon =
    view.icon.length > 0 ? getIcon(view.icon) : viewTypeIconMapping(view.type);

  return (
    <StyledTab
      type="button"
      role="tab"
      aria-selected={isActive}
      data-icehouse-tab={view.id}
      data-active={isActive || undefined}
      data-view-type={view.type}
      data-visibility={view.visibility}
      title={view.name}
      onClick={isDefined(onSelect) ? () => onSelect(view.id) : undefined}
    >
      <Icon size={theme.icon.size.sm} />
      {view.name}
    </StyledTab>
  );
};

type MoreTabProps = {
  label: string;
  hiddenCount: number;
  isActive: boolean;
};

const MoreTab = ({ label, hiddenCount, isActive }: MoreTabProps) => {
  const theme = useTheme();

  return (
    <StyledTab
      type="button"
      aria-haspopup="menu"
      data-icehouse-tab="more"
      data-active={isActive || undefined}
    >
      {label} ({hiddenCount})
      <IconChevronDown size={theme.icon.size.sm} />
    </StyledTab>
  );
};

type AddTabProps = {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
};

const AddTab = ({ label, disabled, onClick }: AddTabProps) => {
  const theme = useTheme();

  return (
    <StyledTab
      type="button"
      aria-label={label}
      title={label}
      data-icehouse-tab="add"
      disabled={disabled}
      onClick={onClick}
    >
      <IconPlus size={theme.icon.size.sm} />
    </StyledTab>
  );
};

type OptionsTabProps = { label: string; onClick: () => void };

// Opens upstream's ViewPickerDropdown (still mounted, trigger hidden by icehouse.css) so
// rename / reorder / delete / favourite stay one click away on desktop.
const OptionsTab = ({ label, onClick }: OptionsTabProps) => {
  const theme = useTheme();
  return (
    <StyledTab
      type="button"
      aria-label={label}
      title={label}
      data-icehouse-tab="options"
      onClick={onClick}
    >
      <IconDotsVertical size={theme.icon.size.sm} />
    </StyledTab>
  );
};

export const IcehouseViewTabStrip = () => {
  const { t } = useLingui();
  const isMobile = useIsMobile();

  const { objectMetadataItem } = useRecordIndexContextOrThrow();

  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const { currentView } = useGetCurrentViewOnly();
  const { changeView } = useChangeView();
  const { openCreateViewDropdown } = useOpenCreateViewDropdown();
  const { closeDropdown } = useCloseDropdown();
  const { toggleDropdown } = useToggleDropdown();
  const { getIcon } = useIcons();

  // The measurement hook only reads ids; keep the list referentially stable so
  // its memoised visible count does not churn on every render.
  const tabsForMeasurement = useMemo(
    () => views.map((view) => ({ id: view.id, title: view.name })),
    [views],
  );

  const {
    visibleTabCount,
    onTabWidthChange,
    onContainerWidthChange,
    onMoreButtonWidthChange,
    onAddButtonWidthChange,
  } = useTabListMeasurements({
    visibleTabs: tabsForMeasurement,
    hasAddButton: true,
  });

  if (isMobile || views.length === 0) {
    return null;
  }

  const visibleViews = views.slice(0, visibleTabCount);
  const hiddenViews = views.slice(visibleTabCount);
  const hasHiddenViews = hiddenViews.length > 0;
  const isActiveViewHidden = hiddenViews.some(
    (view) => view.id === currentView?.id,
  );

  const handleSelectView = (viewId: string) => {
    if (viewId !== currentView?.id) {
      changeView(viewId);
    }
  };

  const handleSelectHiddenView = (viewId: string) => {
    handleSelectView(viewId);
    closeDropdown(ICEHOUSE_VIEW_TABS_MORE_DROPDOWN_ID);
  };

  const handleAddView = () => {
    openCreateViewDropdown(currentView);
  };

  const moreLabel = t`More`;
  const addViewLabel = t`Add view`;

  return (
    <StyledStrip
      data-icehouse="view-tabs"
      role="tablist"
      aria-label={objectMetadataItem.labelPlural}
    >
      <StyledHiddenMeasurements aria-hidden="true">
        {views.map((view) => (
          <NodeDimension
            key={view.id}
            onDimensionChange={onTabWidthChange(view.id)}
          >
            <ViewTab view={view} isActive={view.id === currentView?.id} />
          </NodeDimension>
        ))}
        <NodeDimension onDimensionChange={onMoreButtonWidthChange}>
          <MoreTab label={moreLabel} hiddenCount={1} isActive={false} />
        </NodeDimension>
        <NodeDimension onDimensionChange={onAddButtonWidthChange}>
          <AddTab label={addViewLabel} />
          <OptionsTab
            label={t`View options`}
            onClick={() =>
              toggleDropdown({
                dropdownComponentInstanceIdFromProps: VIEW_PICKER_DROPDOWN_ID,
              })
            }
          />
        </NodeDimension>
      </StyledHiddenMeasurements>

      <StyledMeasuredRow onDimensionChange={onContainerWidthChange}>
        <StyledTabRow>
          {visibleViews.map((view) => (
            <ViewTab
              key={view.id}
              view={view}
              isActive={view.id === currentView?.id}
              onSelect={handleSelectView}
            />
          ))}

          {hasHiddenViews && (
            <Dropdown
              dropdownId={ICEHOUSE_VIEW_TABS_MORE_DROPDOWN_ID}
              dropdownPlacement="bottom-start"
              dropdownOffset={{ x: 0, y: 4 }}
              onClickOutside={() =>
                closeDropdown(ICEHOUSE_VIEW_TABS_MORE_DROPDOWN_ID)
              }
              clickableComponent={
                <MoreTab
                  label={moreLabel}
                  hiddenCount={hiddenViews.length}
                  isActive={isActiveViewHidden}
                />
              }
              dropdownComponents={
                <DropdownContent>
                  <DropdownMenuItemsContainer hasMaxHeight>
                    {hiddenViews.map((view) => (
                      <MenuItemSelect
                        key={view.id}
                        LeftIcon={
                          view.icon.length > 0
                            ? getIcon(view.icon)
                            : viewTypeIconMapping(view.type)
                        }
                        text={view.name}
                        selected={view.id === currentView?.id}
                        onClick={() => handleSelectHiddenView(view.id)}
                      />
                    ))}
                  </DropdownMenuItemsContainer>
                </DropdownContent>
              }
            />
          )}

          <AddTab
            label={addViewLabel}
            disabled={!isDefined(currentView)}
            onClick={handleAddView}
          />
          <OptionsTab
            label={t`View options`}
            onClick={() =>
              toggleDropdown({
                dropdownComponentInstanceIdFromProps: VIEW_PICKER_DROPDOWN_ID,
              })
            }
          />
        </StyledTabRow>
      </StyledMeasuredRow>
    </StyledStrip>
  );
};
