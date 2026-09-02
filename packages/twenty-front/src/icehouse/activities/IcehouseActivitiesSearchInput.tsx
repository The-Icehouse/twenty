import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ChangeEvent } from 'react';
import { IconSearch, IconX } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';

// HubSpot's "Search activities" box. Plain controlled input: the owner
// (IcehouseActivitiesTimeline) holds the value and filters the rendered rows
// client-side, so there is nothing to debounce and no store to write.

const StyledSearchContainer = styled.label<{ fullWidth: boolean }>`
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
  max-width: ${({ fullWidth }) => (fullWidth ? 'none' : '280px')};
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;

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

const StyledClearButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  height: 20px;
  justify-content: center;
  padding: 0;
  width: 20px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

type IcehouseActivitiesSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
};

export const IcehouseActivitiesSearchInput = ({
  value,
  onChange,
  fullWidth = false,
}: IcehouseActivitiesSearchInputProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <StyledSearchContainer data-icehouse-part="search" fullWidth={fullWidth}>
      <IconSearch size={theme.icon.size.md} aria-hidden />
      <StyledSearchInput
        type="text"
        value={value}
        placeholder={t`Search activities`}
        aria-label={t`Search activities`}
        onChange={handleChange}
      />
      {value.length > 0 && (
        <StyledClearButton
          type="button"
          aria-label={t`Clear search`}
          title={t`Clear search`}
          onClick={() => onChange('')}
        >
          <IconX size={theme.icon.size.sm} />
        </StyledClearButton>
      )}
    </StyledSearchContainer>
  );
};
