/**
 * Shared password rules for the storefront.
 *
 * The store intentionally keeps passwords simple: any password of at least
 * MIN_PASSWORD_LENGTH characters is accepted. There are NO strength/complexity
 * requirements (no mandatory uppercase, number, symbol or score). This matches
 * the Supabase Auth minimum and the same rule used on reset/change flows so a
 * lowercase-only, letters-only or digits-only password is valid.
 */
export const MIN_PASSWORD_LENGTH = 6;

export interface PasswordCheck {
  /** Whether the password satisfies the minimum length rule. */
  ok: boolean;
  /** Helper text shown next to the field. */
  label: string;
}

/**
 * Validate a password against the shared rule. `label` is the display string
 * (replaces the old "Strong"/"Medium"/"Weak" strength labels).
 */
export function validatePassword(pw: string): PasswordCheck {
  if (!pw) {
    return { ok: false, label: "" };
  }
  const ok = pw.length >= MIN_PASSWORD_LENGTH;
  return {
    ok,
    label: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  };
}
