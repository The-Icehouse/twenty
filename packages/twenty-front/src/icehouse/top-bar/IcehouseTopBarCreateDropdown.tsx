import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DROPDOWN_OFFSET_Y } from '@/ui/layout/dropdown/constants/DropdownOffsetY';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconPlus } from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay, TooltipPosition } from 'twenty-ui/surfaces';
import { useTheme } from 'twenty-ui/theme-constants';
import { ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID } from '~/icehouse/top-bar/constants/IcehouseTopBarCreateDropdownId';
import { icehouseTopBarControlClass } from '~/icehouse/top-bar/icehouseTopBarControlClass';
import { IcehouseTopBarCreateDropdownContent } from '~/icehouse/top-bar/IcehouseTopBarCreateDropdownContent';
import { IcehouseTopBarCreateRecordEffect } from '~/icehouse/top-bar/IcehouseTopBarCreateRecordEffect';

// HubSpot's "+" quick-create. Picking an object mounts a one-shot effect that
// creates the record and opens it; the effect unmounts itself when done so the
// next pick starts clean (the mount-and-execute shape of upstream's headless
// engine commands). The trigger is a fork-owned button so icehouse.css can
// paint it without touching upstream's IconButton classes.
export const IcehouseTopBarCreateDropdown = () => {
  const { t } = useLingui();
  const theme = useTheme();

  const [objectMetadataItemToCreate, setObjectMetadataItemToCreate] =
    useState<EnrichedObjectMetadataItem | null>(null);

  const label = t`Create a record`;

  return (
    <>
      <Dropdown
        dropdownId={ICEHOUSE_TOP_BAR_CREATE_DROPDOWN_ID}
        dropdownPlacement="bottom-end"
        dropdownOffset={{ y: DROPDOWN_OFFSET_Y }}
        clickableComponent={
          <button
            type="button"
            className={icehouseTopBarControlClass}
            data-icehouse-part="create"
            aria-label={label}
          >
            <IconPlus size={theme.icon.size.md} aria-hidden />
          </button>
        }
        dropdownComponents={
          <IcehouseTopBarCreateDropdownContent
            onSelectObjectMetadataItem={setObjectMetadataItemToCreate}
          />
        }
      />
      {isDefined(objectMetadataItemToCreate) && (
        <IcehouseTopBarCreateRecordEffect
          key={objectMetadataItemToCreate.id}
          objectMetadataItem={objectMetadataItemToCreate}
          onDone={() => setObjectMetadataItemToCreate(null)}
        />
      )}
      <AppTooltip
        anchorSelect={'[data-icehouse="top-bar"] [data-icehouse-part="create"]'}
        content={label}
        place={TooltipPosition.Bottom}
        delay={TooltipDelay.shortDelay}
        noArrow
      />
    </>
  );
};
