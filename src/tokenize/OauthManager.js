/* eslint-disable import/no-extraneous-dependencies */
// oauthManager.js
import { OAuth2Client } from 'google-auth-library';

class OauthManager {
  constructor() {
    this.client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.BASE_URL}/v1/authentications/google/callback`,
    });
  }

  getGoogleAuthenticationUrl() {
    const url = this.client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'email', 'profile'],
    });
    return url;
  }

  async getTokenInfo(code) {
    const { tokens } = await this.client.getToken(code);
    return tokens;
  }

  async verfyGoogleToken(idToken) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket;
  }
}

export default OauthManager;
