/** Single source of truth for the contact email shown on /contact and in
 *  the Privacy Policy. Set NEXT_PUBLIC_CONTACT_EMAIL to override; falls
 *  back to the admin email since this is currently a one-person project. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'contact@example.com';
