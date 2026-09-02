import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { matchPath, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type IcehouseMobilePage = 'index' | 'record' | 'home' | 'other';

type IcehouseMobileObjectContext = {
  page: IcehouseMobilePage;
  objectMetadataItem: EnrichedObjectMetadataItem | undefined;
  // The record's id on a record page (the :objectRecordId route segment);
  // undefined everywhere else.
  objectRecordId: string | undefined;
};

// Which page the phone is on, and which object it belongs to, read from the
// URL. The fork's mobile chrome is mounted in DefaultLayout, above every
// route, where useParams() sees no route params (react-router scopes them to
// the matched route and below) and the context store's current object lingers
// after leaving an object page; matchPath against the two object routes is
// exact and needs no provider. Only active objects count, as the drawer's
// active-item logic (useIdentifyActiveNavigationMenuItems) requires.
export const useIcehouseMobileObjectContext =
  (): IcehouseMobileObjectContext => {
    const { pathname } = useLocation();
    const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);

    const indexMatch = matchPath(AppPath.RecordIndexPage, pathname);

    if (isDefined(indexMatch)) {
      return {
        page: 'index',
        objectMetadataItem: objectMetadataItems.find(
          (objectMetadataItem) =>
            objectMetadataItem.isActive &&
            objectMetadataItem.namePlural ===
              indexMatch.params.objectNamePlural,
        ),
        objectRecordId: undefined,
      };
    }

    const recordMatch = matchPath(AppPath.RecordShowPage, pathname);

    if (isDefined(recordMatch)) {
      return {
        page: 'record',
        objectMetadataItem: objectMetadataItems.find(
          (objectMetadataItem) =>
            objectMetadataItem.isActive &&
            objectMetadataItem.nameSingular ===
              recordMatch.params.objectNameSingular,
        ),
        objectRecordId: recordMatch.params.objectRecordId,
      };
    }

    return {
      page: pathname === AppPath.Home ? 'home' : 'other',
      objectMetadataItem: undefined,
      objectRecordId: undefined,
    };
  };
