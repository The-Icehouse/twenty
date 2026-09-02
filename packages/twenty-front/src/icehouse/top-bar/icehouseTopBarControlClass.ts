import { css } from '@linaria/core';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// The bar's square icon controls (+, settings, help) share one look. A class
// rather than a styled component because the same control is a <button>, a
// router <Link> and an external <a>, and Linaria's styled() cannot retype
// itself per tag. Theme tokens only; HubSpot's colours are in icehouse.css.
export const icehouseTopBarControlClass = css`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 32px;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  width: 32px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 1px;
  }
`;
