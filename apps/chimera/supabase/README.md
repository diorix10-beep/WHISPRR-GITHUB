# CHIMERA Email OTP Setup

This folder contains the CHIMERA-only email template for Supabase Auth.

## Supabase dashboard

1. Open **Authentication → Email Templates → Magic Link** in the CHIMERA Supabase project. Supabase uses this template for the email OTP message too.
2. Paste the contents of `email-template.html` into the template editor.
3. Keep `{{ .Token }}` exactly as written. Supabase must be configured to generate and validate exactly eight numeric digits.
4. Do not use `{{ .ConfirmationURL }}` in the CHIMERA sign-in template. The app must remain on its verification screen until `verifyOtp()` succeeds.
5. Set the email subject to `Your CHIMERA sign-in code`.
6. Confirm the email OTP provider is enabled and its expiry is configured in Supabase Auth settings.

## Required Supabase OTP setting

In the CHIMERA Supabase project's Auth configuration, set the OTP length to **8** (`mailer_otp_length = 8`). This is a Supabase provider setting, not an application-generated value. The repository cannot change the hosted project's Auth configuration through the public client.

The expected token format is exactly `^[0-9]{8}$`. If the Supabase project still generates six digits, the application will correctly reject the code as incomplete rather than silently accepting a mismatched format.

The application requests sign-in OTPs for existing CHIMERA accounts only. New accounts continue through the existing signup flow so age confirmation, legal acceptance, and account metadata are collected correctly.

The artwork URL in the template points to CHIMERA's official site:

`https://chimera.it.com/images/chimera_castle_hero_bg.jpg`

If the image is changed later, replace it only with an approved CHIMERA asset. Do not use WHISPRR assets or URLs in this template.
