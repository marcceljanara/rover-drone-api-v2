/* eslint-disable import/no-extraneous-dependencies */
import { OAuth2Client } from 'google-auth-library';

const oauthClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.BASE_URL}/v1/authentications/google/callback`, // Sesuaikan dengan URL callback yang digunakan
});

export default oauthClient;
