// Icehouse fork — what each object's mobile card shows under the name.
//
// Keyed by objectMetadataItem.nameSingular. `chipFieldName` is a SELECT field
// drawn as a coloured chip (HubSpot's lifecycle / stage / status pill);
// `lineFieldNames` are formatted and joined with " · " as the secondary line.
// A name the object does not have is skipped at render time, so listing a
// field here never breaks a workspace that has not grown it yet. Objects with
// no entry fall back to "Added <relative date>". Nothing here is user-visible
// text: chip and line values come from the records and field metadata.
export type IcehouseMobileCardLayout = {
  chipFieldName?: string;
  lineFieldNames: readonly string[];
};

const ICEHOUSE_MOBILE_CARD_LAYOUT_BY_OBJECT: Record<
  string,
  IcehouseMobileCardLayout
> = {
  person: {
    chipFieldName: 'lifecycleStage',
    lineFieldNames: ['company', 'emails'],
  },
  company: { lineFieldNames: ['domainName', 'region'] },
  opportunity: { chipFieldName: 'stage', lineFieldNames: ['amount'] },
  lead: { chipFieldName: 'status', lineFieldNames: ['company'] },
  agreement: { chipFieldName: 'status', lineFieldNames: ['company'] },
};

export const getIcehouseMobileCardLayout = (
  objectNameSingular: string,
): IcehouseMobileCardLayout | undefined =>
  ICEHOUSE_MOBILE_CARD_LAYOUT_BY_OBJECT[objectNameSingular];

// Every field a card may read, so the list query can fetch them whether or
// not the current view shows them as columns.
export const getIcehouseMobileCardFieldNames = (
  objectNameSingular: string,
): readonly string[] => {
  const layout = getIcehouseMobileCardLayout(objectNameSingular);

  if (layout === undefined) {
    return [];
  }

  return [
    ...(layout.chipFieldName !== undefined ? [layout.chipFieldName] : []),
    ...layout.lineFieldNames,
  ];
};
