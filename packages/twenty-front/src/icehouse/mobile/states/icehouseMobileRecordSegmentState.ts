import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type IcehouseMobileRecordSegment } from '~/icehouse/mobile/types/IcehouseMobileRecordSegment';

// The segment last chosen on the phone record page, kept for the browser
// session so moving from record to record lands on the same face. Never in
// the URL: upstream's tab hash stays the only thing the address bar carries.
export const icehouseMobileRecordSegmentState =
  createAtomState<IcehouseMobileRecordSegment>({
    key: 'icehouseMobileRecordSegmentState',
    defaultValue: 'about',
    useSessionStorage: true,
  });
