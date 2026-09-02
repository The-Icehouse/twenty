import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

type UseIsIcehouseMobileRecordPageParams = {
  isInSidePanel: boolean;
};

// True when IcehouseMobileRecordPage takes over the record page: the phone
// viewport, outside the side panel, and not while the layout is being edited
// (upstream's tab list is needed there to add and reorder tabs). The stage
// tracker's mount in PageLayoutRecordPageRenderer stands down under exactly
// this condition, because the mobile page places the tracker itself.
export const useIsIcehouseMobileRecordPage = ({
  isInSidePanel,
}: UseIsIcehouseMobileRecordPageParams): boolean => {
  const isMobile = useIsMobile();
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  return isMobile && !isInSidePanel && !isLayoutCustomizationModeEnabled;
};
