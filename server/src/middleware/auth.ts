import { Request, Response, NextFunction } from 'express';
import { createUserClient, supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config.js';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  accessToken?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired session token' });
      return;
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.accessToken = token;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication service error' });
  }
}

export function requireAgentToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-agent-token'];
  if (!token || token !== config.agentAuthToken) {
    res.status(403).json({ error: 'Invalid agent authentication token' });
    return;
  }
  next();
}
