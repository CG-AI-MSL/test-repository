import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * JWT Bearer token authentication middleware.
 * Extracts and validates the token from the Authorization header.
 * On success, attaches userId and userRole to the request object.
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      role: string;
    };

    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
}

/**
 * Role-based authorization middleware.
 * Requires the user to have one of the specified roles.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
