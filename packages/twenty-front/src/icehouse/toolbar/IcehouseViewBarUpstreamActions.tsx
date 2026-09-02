import { type ReactNode } from 'react';

type IcehouseViewBarUpstreamActionsProps = {
  children: ReactNode;
};

// Upstream's Filter / Sort / Options buttons live in the TopBar's right section.
// The Icehouse index toolbar renders those same upstream components itself —
// IcehouseIndexToolbar on desktop, IcehouseMobileIndexToolbar on mobile — and
// they must not be mounted twice: every Dropdown portals its panel (two
// instances sharing a dropdown id open two panels) and a CSS-hidden instance
// would anchor its panel to a zero-size rect. So upstream's row is never
// rendered; the children stay wired in ViewBar.tsx so restoring it is a
// one-line change here rather than an upstream edit.
//
// Not an effect: it is a slot that deliberately renders nothing, which the
// effect-components rule cannot tell apart from an effect-only component.
// oxlint-disable-next-line twenty/effect-components
export const IcehouseViewBarUpstreamActions = (
  _props: IcehouseViewBarUpstreamActionsProps,
) => null;
