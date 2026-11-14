import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';

import { env, isGoogleOAuthConfigured } from './env';
import { authService } from '../modules/auth/auth.service';

export function configurePassport(): void {
  if (!isGoogleOAuthConfigured) return;

  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            done(new Error('Google profile did not include an email address'));
            return;
          }

          const firstName =
            profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? 'User';
          const lastName =
            profile.name?.familyName ?? profile.displayName?.split(' ').slice(1).join(' ') ?? '';
          const session = await authService.handleGoogleAuth({
            emails: [{ value: email }],
            name: { firstName, lastName },
          });

          done(null, session);
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)));
        }
      },
    ),
  );
}