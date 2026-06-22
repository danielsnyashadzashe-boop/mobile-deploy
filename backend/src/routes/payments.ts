import { Router, Request, Response } from 'express'

const router = Router()

const BASE_URL = process.env.BASE_URL || 'https://api.nogadacarguard.co.za'

// ─── HTML page helpers ────────────────────────────────────────────────────────

function successPage(guardName: string, amount: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful — Tippa</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0fdf4;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 40px 32px;
      text-align: center;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon {
      width: 72px; height: 72px;
      background: #dcfce7;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
    }
    h1 { font-size: 22px; color: #14532d; font-weight: 700; margin-bottom: 8px; }
    .amount { font-size: 36px; font-weight: 800; color: #16a34a; margin: 16px 0; }
    p { color: #6b7280; font-size: 15px; line-height: 1.5; }
    .guard { color: #111827; font-weight: 600; }
    .tippa { color: #5B94D3; font-weight: 700; font-size: 13px; margin-top: 28px; }
    .close-note { margin-top: 24px; font-size: 13px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Payment Successful!</h1>
    <div class="amount">${amount ? `R${parseFloat(amount).toFixed(2)}` : ''}</div>
    <p>Your tip to <span class="guard">${guardName || 'your car guard'}</span> has been received. They will be notified shortly.</p>
    <p class="close-note">You can close this tab and return to the app.</p>
    <p class="tippa">Powered by Tippa</p>
  </div>
</body>
</html>`
}

function declinePage(reason: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Unsuccessful — Tippa</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fef2f2;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 40px 32px;
      text-align: center;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon {
      width: 72px; height: 72px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
    }
    h1 { font-size: 22px; color: #7f1d1d; font-weight: 700; margin-bottom: 8px; }
    p { color: #6b7280; font-size: 15px; line-height: 1.5; }
    .reason { color: #dc2626; font-weight: 600; margin: 12px 0; font-size: 14px; }
    .tippa { color: #5B94D3; font-weight: 700; font-size: 13px; margin-top: 28px; }
    .close-note { margin-top: 24px; font-size: 13px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Payment Not Completed</h1>
    <p>Your payment was not processed. No money has been taken from your account.</p>
    ${reason ? `<p class="reason">${reason}</p>` : ''}
    <p>Please try again by scanning the QR code.</p>
    <p class="close-note">You can close this tab.</p>
    <p class="tippa">Powered by Tippa</p>
  </div>
</body>
</html>`
}

// ─── Netcash redirect endpoints ───────────────────────────────────────────────

/**
 * GET /api/payments/netcash/accept
 * Netcash redirects the customer browser here after a SUCCESSFUL payment (m5 URL).
 * Netcash sends query params: p2 (reference), p3 (description), p4 (amount), m1, etc.
 */
router.get('/netcash/accept', (req: Request, res: Response) => {
  const { p3, p4 } = req.query as Record<string, string>
  // p3 = description (e.g. "Tip for John Doe"), p4 = amount
  const guardName = p3 ? p3.replace(/^Tip for /i, '') : ''
  console.log('✅ Netcash accept redirect:', { ref: req.query.p2, amount: p4, desc: p3 })
  res.send(successPage(guardName, p4))
})

/**
 * GET /api/payments/netcash/decline
 * Netcash redirects the customer browser here when the payment is DECLINED or CANCELLED.
 */
router.get('/netcash/decline', (req: Request, res: Response) => {
  const { reason } = req.query as Record<string, string>
  console.log('❌ Netcash decline redirect:', req.query)
  res.send(declinePage(reason || ''))
})

/**
 * GET /api/payments/return  (legacy alias — same as accept)
 */
router.get('/return', (req: Request, res: Response) => {
  const { p3, p4 } = req.query as Record<string, string>
  const guardName = p3 ? p3.replace(/^Tip for /i, '') : ''
  console.log('↩️  Netcash return redirect:', { ref: req.query.p2, amount: p4 })
  res.send(successPage(guardName, p4))
})

export default router
