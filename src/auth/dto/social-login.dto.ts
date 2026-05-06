export class SocialLoginDto {
  provider: 'google' | 'facebook';
  idToken?: string;
  accessToken?: string;
  email: string;
  fullName: string;
  picture?: string;
}
