import { Checkbox } from '@/components/ui/checkbox';

interface LegalCheckboxesProps {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  errors?: { acceptTerms?: string; acceptPrivacy?: string };
}

export const LegalCheckboxes = ({
  acceptTerms,
  acceptPrivacy,
  onTermsChange,
  onPrivacyChange,
  errors,
}: LegalCheckboxesProps) => (
  <div className="space-y-3 pt-2">
    <div className="flex items-start gap-2">
      <Checkbox
        checked={acceptTerms}
        onCheckedChange={(v) => onTermsChange(v === true)}
        id="accept-terms"
      />
      <label htmlFor="accept-terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
        Acepto los{' '}
        <a href="/bases" target="_blank" className="text-primary hover:underline">
          Términos y Condiciones
        </a>
      </label>
    </div>
    {errors?.acceptTerms && (
      <p className="text-xs text-destructive">{errors.acceptTerms}</p>
    )}

    <div className="flex items-start gap-2">
      <Checkbox
        checked={acceptPrivacy}
        onCheckedChange={(v) => onPrivacyChange(v === true)}
        id="accept-privacy"
      />
      <label htmlFor="accept-privacy" className="text-xs text-muted-foreground leading-tight cursor-pointer">
        Acepto la{' '}
        <a href="/bases" target="_blank" className="text-primary hover:underline">
          Política de Privacidad
        </a>
      </label>
    </div>
    {errors?.acceptPrivacy && (
      <p className="text-xs text-destructive">{errors.acceptPrivacy}</p>
    )}
  </div>
);
