export const EMAIL_PLATFORM = {
  name: process.env.APP_NAME || 'Imihigo',
  logoUrl: process.env.APP_LOGO_URL || process.env.APP_LOGO || '',
  accentColor: process.env.EMAIL_ACCENT_COLOR || '#0866ff',
  phone: process.env.PLATFORM_PHONE || '+250784886470',
  email: process.env.PLATFORM_EMAIL || 'akazilink01@gmail.com',
  supportTeam: process.env.PLATFORM_NAME || 'Imihigo Recruitment',
} as const;

export function normalizeLogoUrl(originalUrl: string): string {
  if (!originalUrl || originalUrl.trim() === '') {
    return '';
  }

  try {
    let transformed = originalUrl.replace(
      /\/upload\//i,
      '/upload/f_png,q_auto,c_fill,g_auto,w_96,h_96,r_max/',
    );
    transformed = transformed.replace(/\.svg(\?.*)?$/i, '.png$1');
    return transformed;
  } catch {
    return originalUrl;
  }
}

export function resolveAccentColor(override?: string): string {
  return override || EMAIL_PLATFORM.accentColor;
}

export function resolveLogoUrl(override?: string): string {
  return normalizeLogoUrl(override || EMAIL_PLATFORM.logoUrl);
}
