import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.ts';

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  lawyerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'legalconnect_production_jwt_secret_key_change_in_prod_948271a';
};

export const generateToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please log in to access this resource.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Invalid or expired session token. Please log in again.',
    });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. This endpoint requires one of the following roles: [${allowedRoles.join(
          ', '
        )}]. Your role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid token in optional auth
    }
  }
  next();
};
