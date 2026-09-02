// Icehouse fork — which fields get an always-present quick-filter chip on each
// object's index page (HubSpot's "Owner ▾ · Create date ▾ · …" row).
//
// Keyed by objectMetadataItem.nameSingular, values are field *names* in the
// order HubSpot shows them. Upstream has no "pinned / quick filter" flag on
// View or ViewField, so the set lives in this fork-owned map for now (the
// parity map's Tier 2 upgrade path is a hidden custom object editable in-app).
//
// A name that the object does not have, or that is not filterable, is skipped
// at render time — listing the intended set here never breaks a workspace that
// has not grown the field yet. Chip labels come from the field's own label, so
// nothing here is user-visible text.
const ICEHOUSE_QUICK_FILTER_FIELDS_BY_OBJECT: Record<string, readonly string[]> =
  {
    person: ['owner', 'createdAt', 'lifecycleStage', 'region'],
    company: ['accountOwner', 'createdAt', 'industry', 'region'],
    opportunity: ['owner', 'stage', 'closeDate', 'pipeline'],
    lead: ['owner', 'status', 'region', 'revenueBand'],
    agreement: ['status', 'company', 'endDate'],
  };

export const getIcehouseQuickFilterFieldNames = (
  objectNameSingular: string,
): readonly string[] =>
  ICEHOUSE_QUICK_FILTER_FIELDS_BY_OBJECT[objectNameSingular] ?? [];
