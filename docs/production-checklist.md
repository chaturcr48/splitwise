# Production Checklist

## Required before Play Store upload

- Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in local `.env` and EAS environment variables.
- Apply and test `supabase/production-rls.sql` in a staging Supabase project before production.
- Configure Supabase custom SMTP for signup, password reset, and email confirmation.
- Replace placeholder app icons in `assets/icon.png` and `assets/adaptive-icon.png` with final branded assets.
- Create a public privacy policy URL for Google Play Data safety.
- Build an Android App Bundle with `eas build --platform android --profile production`.
- Test invite acceptance on separate accounts/devices before submitting.

## Backend recommendations

- Keep Supabase Auth for email/password unless you need phone OTP login immediately.
- Use Supabase Postgres for groups, expenses, settlements, invitations, and notifications.
- Use Row Level Security as the real privacy boundary; app-side filtering is not enough.
- Move SMS sending and phone invite verification into Supabase Edge Functions before large-scale launch.
- Never put a Supabase service role key in the mobile app.

## Google Play notes

- Declare collected data: name, email address, phone number for phone invites, financial/shared expense data, and app activity.
- Provide account deletion instructions or an in-app account deletion flow.
- Use a unique app name/branding before public launch; avoid implying affiliation with Splitwise.
