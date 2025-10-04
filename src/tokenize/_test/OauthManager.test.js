/* eslint-disable import/no-extraneous-dependencies */
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import OauthManager from '../OauthManager.js';
import InvariantError from '../../exceptions/InvariantError.js';

// --- Mock semua dependensi eksternal ---
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('OauthManager', () => {
  let mockCacheService;
  let mockClientInstance;

  beforeEach(() => {
    // Mock instance methods milik OAuth2Client
    mockClientInstance = {
      generateAuthUrl: jest.fn(),
      getToken: jest.fn(),
      verifyIdToken: jest.fn(),
    };
    OAuth2Client.mockImplementation(() => mockClientInstance);

    // Mock cache service
    mockCacheService = {
      set: jest.fn(),
    };

    // Mock crypto
    crypto.randomBytes.mockReturnValue(Buffer.from('random-state'));

    // Env
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
    process.env.BASE_URL = 'https://example.com';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoogleAuthenticationUrl', () => {
    it('should generate auth URL and store state in cache', async () => {
      mockClientInstance.generateAuthUrl.mockReturnValue('https://accounts.google.com/auth');

      const oauthManager = new OauthManager(mockCacheService);
      const url = await oauthManager.getGoogleAuthenticationUrl();

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^oauth_state:/),
        'valid',
        300,
      );
      expect(mockClientInstance.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['openid', 'email', 'profile'],
        state: expect.any(String),
      });
      expect(url).toBe('https://accounts.google.com/auth');
    });
  });

  describe('getTokenInfo', () => {
    it('should return tokens if scope is valid', async () => {
      const mockTokens = {
        scope: 'openid email profile',
        access_token: '123',
      };
      mockClientInstance.getToken.mockResolvedValue({ tokens: mockTokens });

      const oauthManager = new OauthManager(mockCacheService);
      const tokens = await oauthManager.getTokenInfo('mock-code');

      expect(mockClientInstance.getToken).toHaveBeenCalledWith('mock-code');
      expect(tokens).toEqual(mockTokens);
    });

    it('should throw InvariantError if missing required scopes', async () => {
      const mockTokens = {
        scope: 'email profile',
      };
      mockClientInstance.getToken.mockResolvedValue({ tokens: mockTokens });

      const oauthManager = new OauthManager(mockCacheService);

      await expect(oauthManager.getTokenInfo('mock-code')).rejects.toThrow(InvariantError);
    });
  });

  describe('verifyGoogleToken', () => {
    it('should verify token using google client', async () => {
      const mockTicket = { payload: { email: 'user@example.com' } };
      mockClientInstance.verifyIdToken.mockResolvedValue(mockTicket);

      const oauthManager = new OauthManager(mockCacheService);
      const ticket = await oauthManager.verifyGoogleToken('mock-id-token');

      expect(mockClientInstance.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'mock-id-token',
        audience: 'mock-client-id',
      });
      expect(ticket).toEqual(mockTicket);
    });
  });
});
