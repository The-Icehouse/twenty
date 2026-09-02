import { useRelatedRecordActions } from '@/activities/hooks/useRelatedRecordActions';
import { type RelatedRecordAction } from '@/activities/types/RelatedRecordAction';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import {
  type FieldPhonesValue,
  type PhoneRecord,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type CountryCode, parsePhoneNumber } from 'libphonenumber-js';
import { type ReactNode, useContext, useId } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  type IconComponent,
  IconDotsVertical,
  IconPhone,
} from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { FieldMetadataType } from '~/generated-metadata/graphql';

// HubSpot's record-page quick-action row: Note · Email · Call · Task · Meeting
// (· File) · More, rendered as icon-above-label round buttons directly under
// the summary card. Desktop record page only: the side panel already carries
// pinned actions in its footer, and the left panel does not exist on mobile.
//
// Buttons come from upstream's related-record bindings (create-note,
// compose-email, create-task, create-calendar-event, attach-file), so their
// visibility, permissions and disabled reasons stay upstream's. "Call" is a
// plain tel: link from the record's first phone (Twenty has no telephony) and
// "More" opens the same command menu as the header's "..." button.

const StyledRow = styled.div`
  align-items: flex-start;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledAction = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 44px;
`;

// StyledActionButton and StyledActionLink carry the same surface: Linaria's
// `as` prop keeps the button's prop types, so a tel: anchor needs its own.
const StyledActionButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 36px;
  justify-content: center;
  padding: 0;
  transition: background ${themeCssVariables.animation.duration.fast}
    ease-in-out;
  width: 36px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    border-color: ${themeCssVariables.border.color.strong};
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledActionLink = styled.a`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 36px;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  transition: background ${themeCssVariables.animation.duration.fast}
    ease-in-out;
  width: 36px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    border-color: ${themeCssVariables.border.color.strong};
  }
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1;
  text-align: center;
  white-space: nowrap;
`;

type QuickActionItem = {
  id: string;
  label: string;
  tooltip: string;
  Icon: IconComponent;
  disabled: boolean;
  onClick?: () => void;
  href?: string;
  supportElement?: ReactNode;
};

const parseAdditionalPhones = (
  additionalPhones: FieldPhonesValue['additionalPhones'] | string,
): PhoneRecord[] => {
  if (!isDefined(additionalPhones)) {
    return [];
  }

  if (typeof additionalPhones === 'string') {
    try {
      const parsed: unknown = JSON.parse(additionalPhones);
      return Array.isArray(parsed) ? (parsed as PhoneRecord[]) : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(additionalPhones) ? additionalPhones : [];
};

// Mirrors PhonesDisplay: legacy records stored the calling code in
// countryCode, newer ones keep the ISO country in countryCode and the
// "+64" in callingCode. Fall back to a digits-only tel: when parsing fails.
const getTelHref = (
  number: string,
  callingCode: string,
  countryCode: string,
): string => {
  const rawNumber = `${callingCode}${number}`;

  try {
    if (callingCode !== '') {
      return parsePhoneNumber(rawNumber).getURI();
    }

    if (countryCode.startsWith('+')) {
      return parsePhoneNumber(`${countryCode}${number}`).getURI();
    }

    if (countryCode !== '') {
      return parsePhoneNumber(number, countryCode as CountryCode).getURI();
    }

    return parsePhoneNumber(number).getURI();
  } catch {
    return `tel:${rawNumber.replace(/[^\d+]/g, '')}`;
  }
};

const getFirstPhoneTelHref = (
  phonesFieldValue: FieldPhonesValue | null | undefined,
): string | undefined => {
  if (!isDefined(phonesFieldValue)) {
    return undefined;
  }

  if (phonesFieldValue.primaryPhoneNumber) {
    return getTelHref(
      phonesFieldValue.primaryPhoneNumber,
      phonesFieldValue.primaryPhoneCallingCode ?? '',
      phonesFieldValue.primaryPhoneCountryCode ?? '',
    );
  }

  const firstAdditionalPhone = parseAdditionalPhones(
    phonesFieldValue.additionalPhones,
  ).find((phone) => isDefined(phone?.number) && phone.number !== '');

  if (!isDefined(firstAdditionalPhone)) {
    return undefined;
  }

  return getTelHref(
    firstAdditionalPhone.number,
    firstAdditionalPhone.callingCode ?? '',
    firstAdditionalPhone.countryCode ?? '',
  );
};

const IcehouseQuickActionRowContent = () => {
  const { t } = useLingui();
  const { theme } = useContext(ThemeContext);
  const instanceId = useId();
  const targetRecord = useTargetRecord();
  const { openSidePanelMenu } = useSidePanelMenu();

  const actionBindings = useRelatedRecordActions({ targetRecord });

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });

  const phonesFieldMetadataItem = objectMetadataItem.fields.find(
    (fieldMetadataItem) =>
      fieldMetadataItem.type === FieldMetadataType.PHONES &&
      fieldMetadataItem.isActive !== false,
  );

  const phonesFieldValue = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: targetRecord.id,
      fieldName: phonesFieldMetadataItem?.name ?? '',
    },
  ) as FieldPhonesValue | null | undefined;

  const telHref = isDefined(phonesFieldMetadataItem)
    ? getFirstPhoneTelHref(phonesFieldValue)
    : undefined;

  const shortLabelByActionId: Record<RelatedRecordAction['id'], string> = {
    'create-note': t`Note`,
    'compose-email': t`Email`,
    'create-task': t`Task`,
    'create-calendar-event': t`Meeting`,
    'attach-file': t`File`,
  };

  const bindingItemByActionId = new Map<string, QuickActionItem>(
    actionBindings
      .filter(({ action }) => action.isVisible)
      .map(({ action, supportElement }) => [
        action.id,
        {
          id: action.id,
          label: shortLabelByActionId[action.id],
          tooltip:
            action.disabled && isDefined(action.disabledReason)
              ? action.disabledReason
              : action.label,
          Icon: action.Icon,
          disabled: action.disabled,
          onClick: action.execute,
          supportElement,
        },
      ]),
  );

  const callItem: QuickActionItem | undefined = isDefined(telHref)
    ? {
        id: 'call',
        label: t`Call`,
        tooltip: t`Call`,
        Icon: IconPhone,
        disabled: false,
        href: telHref,
      }
    : undefined;

  const moreItem: QuickActionItem = {
    id: 'more',
    label: t`More`,
    tooltip: t`Command Menu`,
    Icon: IconDotsVertical,
    disabled: false,
    onClick: openSidePanelMenu,
  };

  // HubSpot's order, with Call after Email and File tucked before More.
  const quickActionItems = [
    bindingItemByActionId.get('create-note'),
    bindingItemByActionId.get('compose-email'),
    callItem,
    bindingItemByActionId.get('create-task'),
    bindingItemByActionId.get('create-calendar-event'),
    bindingItemByActionId.get('attach-file'),
    moreItem,
  ].filter(isDefined);

  return (
    <StyledRow data-icehouse="quick-actions">
      {quickActionItems.map((item) => {
        const buttonId = `icehouse-quick-action-${instanceId}-${item.id}`;
        const icon = <item.Icon size={theme.icon.size.md} />;

        return (
          <StyledAction key={item.id}>
            {item.supportElement}
            {isDefined(item.href) ? (
              <StyledActionLink
                id={buttonId}
                data-icehouse-part="button"
                href={item.href}
                aria-label={item.tooltip}
              >
                {icon}
              </StyledActionLink>
            ) : (
              <StyledActionButton
                id={buttonId}
                data-icehouse-part="button"
                type="button"
                aria-label={item.tooltip}
                aria-disabled={item.disabled}
                onClick={item.disabled ? undefined : item.onClick}
              >
                {icon}
              </StyledActionButton>
            )}
            <StyledLabel data-icehouse-part="label">{item.label}</StyledLabel>
            <AppTooltip
              anchorSelect={`#${buttonId}`}
              content={item.tooltip}
              delay={TooltipDelay.shortDelay}
              place="bottom"
              noArrow
            />
          </StyledAction>
        );
      })}
    </StyledRow>
  );
};

export const IcehouseQuickActionRow = () => {
  const { isInSidePanel } = useLayoutRenderingContext();
  const isMobile = useIsMobile();

  if (isInSidePanel || isMobile) {
    return null;
  }

  return <IcehouseQuickActionRowContent />;
};
