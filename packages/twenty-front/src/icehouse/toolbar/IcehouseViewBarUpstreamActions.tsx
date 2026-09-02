import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { type ReactNode } from 'react';

type IcehouseViewBarUpstreamActionsProps = {
  children: ReactNode;
};

// Upstream's Filter / Sort / Options buttons live in the TopBar's right section.
// On desktop the Icehouse index toolbar renders those same upstream components
// itself, and they must not be mounted twice: every Dropdown portals its panel
// (two instances sharing a dropdown id open two panels) and a CSS-hidden
// instance would anchor its panel to a zero-size rect. On mobile the toolbar is
// not rendered, so upstream's row stays exactly as shipped.
export const IcehouseViewBarUpstreamActions = ({
  children,
}: IcehouseViewBarUpstreamActionsProps) => {
  const isMobile = useIsMobile();

  return isMobile ? children : null;
};
