import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { PageLayoutType } from '~/generated-metadata/graphql';
import { IcehouseAssociationsColumn } from '~/icehouse/associations/IcehouseAssociationsColumn';

// The record page's third column. Upstream's PageLayoutTabsRenderer is a
// `348px 1fr` grid (pinned-left tab, tabs); this wraps it in a `1fr auto`
// grid so the association column sits to its right without touching the
// tabs renderer. The `auto` track collapses to nothing when the column
// renders null (an object with no associations). Side panel and mobile pass
// the children through untouched: there is no room for a third column there.

const StyledColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  width: 100%;

  @media print {
    display: block;
    height: auto;
  }
`;

type IcehouseRecordColumnsProps = {
  children: ReactNode;
};

export const IcehouseRecordColumns = ({
  children,
}: IcehouseRecordColumnsProps) => {
  const { isInSidePanel, layoutType } = useLayoutRenderingContext();
  const isMobile = useIsMobile();

  if (isInSidePanel || isMobile || layoutType !== PageLayoutType.RECORD_PAGE) {
    return <>{children}</>;
  }

  return (
    <StyledColumns data-icehouse="record-columns">
      {children}
      <IcehouseAssociationsColumn />
    </StyledColumns>
  );
};
