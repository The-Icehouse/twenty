// The faces of the phone record page: About (the pinned fields tab),
// Activities (the timeline tab), Related (the association cards) and More —
// any other tab of the record layout (Tasks, Notes, Files, Emails, Calendar,
// custom ones), picked from a menu on the fourth segment.
export type IcehouseMobileRecordSegment =
  | 'about'
  | 'activities'
  | 'related'
  | 'more';

// One of the layout's remaining tabs, as the More picker lists it.
export type IcehouseMobileRecordExtraTab = {
  id: string;
  title: string;
  icon?: string | null;
};

// What the page remembers for the session: the segment, and for More which
// tab was picked. The tab id belongs to one object's record layout, so a
// record of another object may not carry it — the page falls back to About.
export type IcehouseMobileRecordSegmentSelection =
  | { segment: Exclude<IcehouseMobileRecordSegment, 'more'> }
  | { segment: 'more'; tabId: string };
