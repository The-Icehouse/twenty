import { ObjectOptionsDropdownContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownContent';
import { OBJECT_OPTIONS_DROPDOWN_ID } from '@/object-record/object-options-dropdown/constants/ObjectOptionsDropdownId';
import { ObjectOptionsDropdownContext } from '@/object-record/object-options-dropdown/states/contexts/ObjectOptionsDropdownContext';
import { type ObjectOptionsContentId } from '@/object-record/object-options-dropdown/types/ObjectOptionsContentId';
import { RecordGroupReorderConfirmationModal } from '@/object-record/record-group/components/RecordGroupReorderConfirmationModal';
import { useRecordGroupReorderConfirmationModal } from '@/object-record/record-group/hooks/useRecordGroupReorderConfirmationModal';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { recordIndexViewTypeState } from '@/object-record/record-index/states/recordIndexViewTypeState';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DROPDOWN_OFFSET_Y } from '@/ui/layout/dropdown/constants/DropdownOffsetY';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ViewType } from '@/views/types/ViewType';
import { useLingui } from '@lingui/react/macro';
import { useId, useState } from 'react';
import { IconSettings } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { AppTooltip, TooltipDelay, TooltipPosition } from 'twenty-ui/surfaces';

const INITIAL_CONTENT_ID: ObjectOptionsContentId = 'fields';

// HubSpot's columns gear. Opens upstream's object-options dropdown (same
// OBJECT_OPTIONS_DROPDOWN_ID, same context and content components) straight on
// its Fields page; the back chevron still leads to the full Options menu.
// Upstream's ObjectOptionsDropdown keeps its content id in local state with no
// way to preselect a page, so the Dropdown is composed here from its parts.
export const IcehouseIndexToolbarColumnsDropdown = () => {
  const { t } = useLingui();
  const tooltipAnchorId = useId();

  const { recordIndexId, objectMetadataItem } = useRecordIndexContextOrThrow();
  const recordIndexViewType = useAtomStateValue(recordIndexViewTypeState);
  const viewType = recordIndexViewType ?? ViewType.TABLE;

  const [currentContentId, setCurrentContentId] =
    useState<ObjectOptionsContentId | null>(INITIAL_CONTENT_ID);

  const {
    handleRecordGroupOrderChangeWithModal,
    handleRecordGroupReorderConfirmClick,
  } = useRecordGroupReorderConfirmationModal({ recordIndexId, viewType });

  const handleResetContent = () => {
    setCurrentContentId(null);
  };

  const handleDropdownClose = () => {
    setCurrentContentId(INITIAL_CONTENT_ID);
  };

  const label = t`Edit columns`;

  return (
    <>
      <Dropdown
        dropdownId={OBJECT_OPTIONS_DROPDOWN_ID}
        dropdownOffset={{ y: DROPDOWN_OFFSET_Y }}
        clickableComponent={
          <span
            data-tooltip-id={tooltipAnchorId}
            data-icehouse="columns-button"
          >
            <IconButton
              Icon={IconSettings}
              variant="secondary"
              size="medium"
              ariaLabel={label}
            />
          </span>
        }
        onClose={handleDropdownClose}
        dropdownComponents={
          <ObjectOptionsDropdownContext.Provider
            value={{
              viewType,
              objectMetadataItem,
              recordIndexId,
              currentContentId,
              onContentChange: setCurrentContentId,
              resetContent: handleResetContent,
              dropdownId: OBJECT_OPTIONS_DROPDOWN_ID,
              handleRecordGroupOrderChangeWithModal,
            }}
          >
            <ObjectOptionsDropdownContent />
          </ObjectOptionsDropdownContext.Provider>
        }
      />
      <RecordGroupReorderConfirmationModal
        onConfirmClick={handleRecordGroupReorderConfirmClick}
      />
      <AppTooltip
        anchorSelect={`[data-tooltip-id='${tooltipAnchorId}']`}
        content={label}
        place={TooltipPosition.Bottom}
        delay={TooltipDelay.shortDelay}
        noArrow
      />
    </>
  );
};
