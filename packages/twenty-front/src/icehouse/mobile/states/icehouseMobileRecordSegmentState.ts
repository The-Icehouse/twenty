import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type IcehouseMobileRecordSegmentSelection } from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';

// The segment last chosen on the phone record page (and, for More, which tab),
// kept for the browser session so moving from record to record lands on the
// same face. Never in the URL: upstream's tab hash stays the only thing the
// address bar carries. The storage key changed with the value's shape (a bare
// segment string became this object) so an older session's value is ignored
// rather than misread.
export const icehouseMobileRecordSegmentState =
  createAtomState<IcehouseMobileRecordSegmentSelection>({
    key: 'icehouseMobileRecordSegmentSelectionState',
    defaultValue: { segment: 'about' },
    useSessionStorage: true,
  });
