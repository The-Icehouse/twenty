import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useRecordChipData } from '@/object-record/hooks/useRecordChipData';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { FieldMetadataType } from 'twenty-shared/types';
import { formatToShortNumber, isDefined } from 'twenty-shared/utils';
import { Avatar, SelectDisplay } from 'twenty-ui/data-display';
import { IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';
import { getIcehouseMobileCardLayout } from '~/icehouse/mobile/mobileCardFields';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

// One tappable card per record on the mobile index (HubSpot's mobile list
// row): avatar, bold name, then a chip and/or a secondary line chosen per
// object in mobileCardFields.ts. Colours are theme tokens (dark mode is right
// by default); HubSpot's light palette and the phone geometry come from
// icehouse.css on the data-icehouse-part hooks below.

const StyledCard = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 12px;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 64px;
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:active {
    background: ${themeCssVariables.background.transparent.light};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

const StyledAvatar = styled.span`
  display: flex;
  flex-shrink: 0;
`;

const StyledBody = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSecondary = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[1]};
  line-height: 18px;
  min-width: 0;
`;

const StyledSecondaryText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledChevron = styled.span`
  color: ${themeCssVariables.font.color.light};
  display: flex;
  flex-shrink: 0;
`;

const stripUrlChrome = (url: string) =>
  url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');

// Label of a related record as the identifier sub-selection returns it:
// `name` is a string, or a FULL_NAME object for people.
const getRelatedRecordLabel = (value: unknown): string | null => {
  if (!isDefined(value) || typeof value !== 'object') {
    return null;
  }

  const { name } = value as { name?: unknown };

  if (isNonEmptyString(name)) {
    return name;
  }

  if (isDefined(name) && typeof name === 'object') {
    const { firstName, lastName } = name as {
      firstName?: string | null;
      lastName?: string | null;
    };

    const fullName = [firstName, lastName].filter(isNonEmptyString).join(' ');

    return fullName.length > 0 ? fullName : null;
  }

  return null;
};

const formatCurrencyForCard = (
  amountMicros: number,
  currencyCode: string | null | undefined,
) => {
  const amount = amountMicros / 1_000_000;

  if (!isNonEmptyString(currencyCode)) {
    return formatToShortNumber(amount);
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${formatToShortNumber(amount)}`;
  }
};

const formatFieldValueForCard = (
  field: FieldMetadataItem,
  value: unknown,
): string | null => {
  if (!isDefined(value)) {
    return null;
  }

  switch (field.type) {
    case FieldMetadataType.RELATION:
      return getRelatedRecordLabel(value);
    case FieldMetadataType.FULL_NAME:
      return getRelatedRecordLabel({ name: value });
    case FieldMetadataType.EMAILS: {
      const { primaryEmail } = value as { primaryEmail?: string | null };
      return isNonEmptyString(primaryEmail) ? primaryEmail : null;
    }
    case FieldMetadataType.LINKS: {
      const { primaryLinkUrl, primaryLinkLabel } = value as {
        primaryLinkUrl?: string | null;
        primaryLinkLabel?: string | null;
      };
      if (isNonEmptyString(primaryLinkUrl)) {
        return stripUrlChrome(primaryLinkUrl);
      }
      return isNonEmptyString(primaryLinkLabel) ? primaryLinkLabel : null;
    }
    case FieldMetadataType.SELECT:
      return (
        field.options?.find((option) => option.value === value)?.label ?? null
      );
    case FieldMetadataType.CURRENCY: {
      const { amountMicros, currencyCode } = value as {
        amountMicros?: number | string | null;
        currencyCode?: string | null;
      };
      return isDefined(amountMicros)
        ? formatCurrencyForCard(Number(amountMicros), currencyCode)
        : null;
    }
    case FieldMetadataType.DATE_TIME:
    case FieldMetadataType.DATE:
      return typeof value === 'string'
        ? beautifyPastDateRelativeToNow(value)
        : null;
    case FieldMetadataType.NUMBER:
      return typeof value === 'number' ? String(value) : null;
    default:
      return isNonEmptyString(value) ? value : null;
  }
};

type IcehouseMobileRecordCardProps = {
  record: ObjectRecord;
  objectMetadataItem: EnrichedObjectMetadataItem;
  onOpen: (recordId: string) => void;
};

export const IcehouseMobileRecordCard = ({
  record,
  objectMetadataItem,
  onOpen,
}: IcehouseMobileRecordCardProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  // Same name / avatar derivation as the table's identifier chip.
  const { recordChipData } = useRecordChipData({
    objectNameSingular: objectMetadataItem.nameSingular,
    record,
  });

  const layout = getIcehouseMobileCardLayout(objectMetadataItem.nameSingular);

  const findField = (fieldName: string) =>
    objectMetadataItem.fields.find((field) => field.name === fieldName);

  const chipField = isDefined(layout?.chipFieldName)
    ? findField(layout.chipFieldName)
    : undefined;

  const chipOption = isDefined(chipField)
    ? chipField.options?.find(
        (option) => option.value === record[chipField.name],
      )
    : undefined;

  const lineParts = (layout?.lineFieldNames ?? [])
    .map((fieldName) => {
      const field = findField(fieldName);
      return isDefined(field)
        ? formatFieldValueForCard(field, record[field.name])
        : null;
    })
    .filter(isNonEmptyString);

  const secondaryText = isDefined(layout)
    ? lineParts.join(' · ')
    : isNonEmptyString(record.createdAt)
      ? t`Added ${beautifyPastDateRelativeToNow(record.createdAt)}`
      : '';

  const name = isNonEmptyString(recordChipData.name)
    ? recordChipData.name
    : t`Untitled`;

  const hasSecondaryLine = isDefined(chipOption) || secondaryText.length > 0;

  return (
    <StyledCard
      type="button"
      data-icehouse-part="card"
      data-record-id={record.id}
      onClick={() => onOpen(record.id)}
    >
      <StyledAvatar data-icehouse-part="avatar">
        <Avatar
          avatarUrl={getAbsoluteImageUrl(recordChipData.avatarUrl)}
          placeholder={name}
          placeholderColorSeed={record.id}
          type={recordChipData.avatarType}
          size="xl"
        />
      </StyledAvatar>
      <StyledBody>
        <StyledName data-icehouse-part="name">{name}</StyledName>
        {hasSecondaryLine && (
          <StyledSecondary data-icehouse-part="secondary">
            {isDefined(chipOption) && (
              <SelectDisplay
                color={chipOption.color}
                label={chipOption.label}
              />
            )}
            {isDefined(chipOption) && secondaryText.length > 0 && (
              <span aria-hidden>·</span>
            )}
            {secondaryText.length > 0 && (
              <StyledSecondaryText>{secondaryText}</StyledSecondaryText>
            )}
          </StyledSecondary>
        )}
      </StyledBody>
      <StyledChevron aria-hidden>
        <IconChevronRight size={theme.icon.size.md} />
      </StyledChevron>
    </StyledCard>
  );
};
