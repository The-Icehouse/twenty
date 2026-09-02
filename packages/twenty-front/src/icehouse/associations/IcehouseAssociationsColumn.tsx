import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { getIcehouseAssociations } from '~/icehouse/associations/getIcehouseAssociations';
import { IcehouseAssociationCard } from '~/icehouse/associations/IcehouseAssociationCard';

// HubSpot's right-hand record column: one association card per relation
// field of the object, in a scrolling 320px column beside the tabs. Rendered
// by IcehouseRecordColumns on the desktop record page only; the object's own
// relation metadata decides which cards exist, so nothing here is per-object.

const StyledColumn = styled.aside`
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  height: 100%;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[3]};
  width: 320px;

  @media print {
    display: none;
  }
`;

export const IcehouseAssociationsColumn = () => {
  const targetRecord = useTargetRecord();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });
  const { objectMetadataItems } = useObjectMetadataItems();

  const associations = getIcehouseAssociations({
    objectMetadataItem,
    objectMetadataItems,
  });

  if (associations.length === 0) {
    return null;
  }

  return (
    <StyledColumn data-icehouse="associations">
      {associations.map((association) => (
        <IcehouseAssociationCard
          key={association.key}
          association={association}
          objectMetadataItem={objectMetadataItem}
          recordId={targetRecord.id}
        />
      ))}
    </StyledColumn>
  );
};
