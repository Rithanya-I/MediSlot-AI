import { NextFunction, Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Please sign in with Google to continue.' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = decodedToken.email || `${decodedToken.uid}@medislot.local`;
    const displayName =
      typeof decodedToken.name === 'string' ? decodedToken.name : undefined;

    const dbUser = await getOrCreateUser(decodedToken.uid, email, displayName);
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid token.' });
  }
};
