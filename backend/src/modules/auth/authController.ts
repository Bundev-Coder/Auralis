import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRecord } from '../../database/db';
import { ENV } from '../../config/env';

export class AuthController {
  static async register(req: Request, res: Response) {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (db.users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      email,
      passwordHash: password, // In production bcrypt.hash
      displayName: displayName || email.split('@')[0],
      createdAt: Date.now(),
    };

    db.users.set(email, newUser);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, ENV.JWT_SECRET, {
      expiresIn: '30d',
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
      },
    });
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const user = db.users.get(email);

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, ENV.JWT_SECRET, {
      expiresIn: '30d',
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  }

  static async getProfile(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      const user = Array.from(db.users.values()).find((u) => u.id === decoded.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      });
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}
