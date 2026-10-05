import { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'crypto'

/**
 * Shared-secret guard for admin endpoints that move money or change state.
 *
 * Context, because the shape of this is a compromise rather than a design.
 *
 * `/api/admin` is mounted in server.ts with no authentication of any kind, so
 * every route on it is reachable by anyone who knows the URL. The worst of
 * those was `POST /api/admin/tips/manual`, which credits a guard's balance
 * from an unauthenticated request body.
 *
 * The proper fix is Clerk session verification: `@clerk/clerk-sdk-node` is
 * already a dependency. It is not wired up anywhere, and the admin web app
 * sends no Authorization header at all today, so turning it on across the
 * router would lock the admin UI out of its own API. That is a migration,
 * not a patch.
 *
 * So this is the stopgap, and it is deliberately narrow: it goes on the
 * endpoints that move money, which have no UI caller yet and therefore
 * nothing to break. The read endpoints the admin app does use are untouched
 * and remain open, which is still wrong and is why this comment exists.
 *
 * It fails CLOSED. With ADMIN_API_KEY unset the guarded routes refuse
 * everything, because an unset secret on a money endpoint should stop the
 * endpoint working, not stop the check running.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_KEY

  if (!expected || expected.length < 16) {
    console.error(
      '🚨 Admin route refused: ADMIN_API_KEY is unset or shorter than 16 characters'
    )
    return res.status(503).json({ success: false, error: 'Admin API not configured' })
  }

  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const received = (req.headers['x-admin-api-key'] as string | undefined) || bearer

  if (!received || !safeEqual(received, expected)) {
    console.warn('⚠️ Admin route rejected: bad or missing API key', { path: req.path })
    return res.status(401).json({ success: false, error: 'Unauthorised' })
  }

  next()
}

/** Constant-time compare, so the key cannot be recovered a byte at a time. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
