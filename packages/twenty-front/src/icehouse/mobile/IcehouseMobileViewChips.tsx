import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useToggleDropdown } from '@/ui/layout/dropdown/hooks/useToggleDropdown';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useChangeView } from '@/views/hooks/useChangeView';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { useOpenCreateViewDropdown } from '@/views/hooks/useOpenCreateViewDropown';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { viewTypeIconMapping } from '@/views/types/ViewType';
import { VIEW_PICKER_DROPDOWN_ID } from '@/views/view-picker/constants/ViewPickerDropdownId';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconDotsVertical, IconPlus, useIcons } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';

// The object's saved views as a horizontally scrolling chip row (the phone
// counterpart of IcehouseViewTabStrip). Presentation only: switching goes
// through useChangeView (writes ?viewId=), "+" opens upstream's create-view
// form inside the still-mounted ViewPickerDropdown (its trigger is hidden by
// icehouse.css on mobile, the Dropdown stays so the form has an anchor), and
// "⋮" toggles that same picker for rename / reorder / delete.
//
// Hooks for icehouse.css: data-icehouse="mobile-view-chips" on the row, every
// chip carries data-icehouse-tab (= view id, "add" or "options") and
// data-active when it is the current view.

const StyledRow = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[2]};
  scrollbar-width: none;
  width: 100%;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledChip = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.pill};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
  white-space: nowrap;

  &[data-active] {
    background: ${themeCssVariables.font.color.primary};
    border-color: ${themeCssVariables.font.color.primary};
    color: ${themeCssVariables.font.color.inverted};
  }

  &:disabled {
    color: ${themeCssVariables.font.color.tertiary};
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 1px;
  }
`;

export const IcehouseMobileViewChips = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const { getIcon } = useIcons();

  const { objectMetadataItem } = useRecordIndexContextOrThrow();

  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const { currentView } = useGetCurrentViewOnly();
  const { changeView } = useChangeView();
  const { openCreateViewDropdown } = useOpenCreateViewDropdown();
  const { toggleDropdown } = useToggleDropdown();

  // Keep the current view's chip on screen when the row overflows.
  const [activeChipElement, setActiveChipElement] =
    useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (
      isDefined(activeChipElement) &&
      typeof activeChipElement.scrollIntoView === 'function'
    ) {
      activeChipElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [activeChipElement]);

  if (views.length === 0) {
    return null;
  }

  return (
    <StyledRow
      data-icehouse="mobile-view-chips"
      role="tablist"
      aria-label={objectMetadataItem.labelPlural}
    >
      {views.map((view) => {
        const isActive = view.id === currentView?.id;
        const Icon =
          view.icon.length > 0
            ? getIcon(view.icon)
            : viewTypeIconMapping(view.type);

        return (
          <StyledChip
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-icehouse-tab={view.id}
            data-active={isActive || undefined}
            ref={isActive ? setActiveChipElement : undefined}
            onClick={() => {
              if (!isActive) {
                changeView(view.id);
              }
            }}
          >
            <Icon size={theme.icon.size.sm} />
            {view.name}
          </StyledChip>
        );
      })}
      <StyledChip
        type="button"
        data-icehouse-tab="add"
        aria-label={t`Add view`}
        disabled={!isDefined(currentView)}
        onClick={() => openCreateViewDropdown(currentView)}
      >
        <IconPlus size={theme.icon.size.sm} />
      </StyledChip>
      <StyledChip
        type="button"
        data-icehouse-tab="options"
        aria-label={t`View options`}
        onClick={() =>
          toggleDropdown({
            dropdownComponentInstanceIdFromProps: VIEW_PICKER_DROPDOWN_ID,
          })
        }
      >
        <IconDotsVertical size={theme.icon.size.sm} />
      </StyledChip>
    </StyledRow>
  );
};
