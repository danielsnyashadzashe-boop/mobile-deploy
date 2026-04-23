import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../lib/jwt'

declare global {
  namespace Express {
    interface Request {
      guard?: JwtPayload
    }
  }
}

export function mobileAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorised — missing token' })
  }

  const token = header.slice(7)
  try {
    req.guard = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorised — invalid or expired token' })
  }
}
