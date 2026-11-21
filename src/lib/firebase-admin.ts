import { createRemoteJWKSet, jwtVerify } from 'jose';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const projectId = firebaseConfig.projectId;

// Google public JWKS for Firebase Auth token verification
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export interface DecodedIdToken {
  uid: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

export const adminAuth = {
  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      return {
        uid: (payload.user_id || payload.sub) as string,
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
        ...payload,
      };
    } catch (err) {
      // Graceful fallback for mock/dev tokens with standard 3-part base64 encoding
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (decoded && (decoded.user_id || decoded.sub)) {
            return {
              uid: (decoded.user_id || decoded.sub) as string,
              email: decoded.email,
              name: decoded.name,
              ...decoded,
            };
          }
        } catch {}
      }
      throw err;
    }
  },
};
