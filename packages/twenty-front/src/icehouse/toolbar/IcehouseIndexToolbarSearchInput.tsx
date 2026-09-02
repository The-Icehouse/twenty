import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ChangeEvent, useEffect, useState } from 'react';
import { IconSearch } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { useDebouncedCallback } from 'use-debounce';

const SEARCH_DEBOUNCE_MS = 300;

const StyledSearchContainer = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.light};
  cursor: text;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 240px;

  &:focus-within {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const StyledSearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 0;
  outline: none;

  &::placeholder {
    color: ${themeCssVariables.font.color.light};
  }
`;

type IcehouseIndexToolbarSearchInputProps = {
  viewBarId: string;
};

// Permanent "any field" search. Same state and setter as upstream's
// ObjectFilterDropdownAnyFieldSearchInput (the input inside the Filter
// dropdown), keyed explicitly by the view bar so it never reads a different
// instance. Debounced so the record query is not refetched per keystroke.
export const IcehouseIndexToolbarSearchInput = ({
  viewBarId,
}: IcehouseIndexToolbarSearchInputProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  const [anyFieldFilterValue, setAnyFieldFilterValue] = useAtomComponentState(
    anyFieldFilterValueComponentState,
    viewBarId,
  );

  const [inputValue, setInputValue] = useState(anyFieldFilterValue);

  const commitSearchValue = useDebouncedCallback((value: string) => {
    setAnyFieldFilterValue(value);
  }, SEARCH_DEBOUNCE_MS);

  // Follow external changes (Reset, view switch, the any-field chip) unless the
  // user is mid-typing, in which case the pending commit wins.
  useEffect(() => {
    if (!commitSearchValue.isPending()) {
      setInputValue(anyFieldFilterValue);
    }
  }, [anyFieldFilterValue, commitSearchValue]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    commitSearchValue(event.target.value);
  };

  return (
    <StyledSearchContainer data-icehouse="search">
      <IconSearch size={theme.icon.size.md} aria-hidden />
      <StyledSearchInput
        type="text"
        value={inputValue}
        placeholder={t`Search`}
        aria-label={t`Search any field`}
        onChange={handleChange}
      />
    </StyledSearchContainer>
  );
};
