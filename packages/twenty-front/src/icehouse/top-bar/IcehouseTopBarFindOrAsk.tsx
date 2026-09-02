import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useOpenAskAiPageInSidePanel } from '@/side-panel/hooks/useOpenAskAiPageInSidePanel';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconSearch, IconSparkles } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledFindOrAsk = styled.div`
  align-items: stretch;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  display: flex;
  height: 34px;
  overflow: hidden;
  width: min(440px, 40vw);

  &:focus-within {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const StyledFindButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.light};
  cursor: text;
  display: flex;
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
  text-align: left;

  &:focus-visible {
    outline: none;
  }
`;

const StyledFindLabel = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledKbd = styled.kbd`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.light};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 16px;
  min-width: 16px;
  padding: 0 ${themeCssVariables.spacing[1]};
  text-align: center;
`;

const StyledAskButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  padding: 0 ${themeCssVariables.spacing[3]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

// HubSpot's "Find or Ask" box. It is a button dressed as an input: clicking it
// opens upstream's multi-object search page in the side panel (the page the
// '/' hotkey and the drawer's search icon open), which owns the input, the
// object filter, the results and the hover preview, so none of that is
// duplicated here. "Ask" opens the Ask-AI page ('@' hotkey) and is shown only
// to members with the AI permission, as the drawer's chat tab is.
export const IcehouseTopBarFindOrAsk = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  const { openAskAiPage } = useOpenAskAiPageInSidePanel();
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);

  const handleFindClick = () => {
    openRecordsSearchPage();
  };

  const handleAskClick = () => {
    openAskAiPage({ resetNavigationStack: true });
  };

  return (
    <StyledFindOrAsk role="search" data-icehouse-part="find-or-ask">
      <StyledFindButton
        type="button"
        data-icehouse-part="find"
        onClick={handleFindClick}
        aria-keyshortcuts="/"
      >
        <IconSearch size={theme.icon.size.md} aria-hidden />
        <StyledFindLabel>
          {hasAiPermission ? t`Find or Ask` : t`Find`}
        </StyledFindLabel>
        <StyledKbd data-icehouse-part="kbd" aria-hidden>
          /
        </StyledKbd>
      </StyledFindButton>
      {hasAiPermission && (
        <StyledAskButton
          type="button"
          data-icehouse-part="ask"
          onClick={handleAskClick}
          aria-keyshortcuts="@"
        >
          <IconSparkles size={theme.icon.size.sm} aria-hidden />
          {t`Ask`}
        </StyledAskButton>
      )}
    </StyledFindOrAsk>
  );
};
