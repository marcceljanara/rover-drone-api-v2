/* eslint-disable import/no-extraneous-dependencies */
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import InvariantError from '../exceptions/InvariantError.js';

class OauthManager {
  constructor(cacheService) {
    this.client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.BASE_URL}/v1/authentications/google/callback`,
    });

    this._cacheService = cacheService;
  }

  async getGoogleAuthenticationUrl() {
    // generate state random
    const state = crypto.randomBytes(32).toString('hex');

    // simpan ke redis dengan TTL 5 menit
    await this._cacheService.set(`oauth_state:${state}`, 'valid', 300);

    const url = this.client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'email', 'profile'],
      state, // kirim ke Google
    });

    return url;
  }

  async getTokenInfo(code) {
    const { tokens } = await this.client.getToken(code);
    if (!tokens.scope.includes('openid')
    || !tokens.scope.includes('email')
    || !tokens.scope.includes('profile')) {
      throw new InvariantError('Invalid scope returned');
    }
    return tokens;
  }

  async verifyGoogleToken(idToken) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket;
  }
}

export default OauthManager;
