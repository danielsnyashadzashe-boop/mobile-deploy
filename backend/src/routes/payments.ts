import { Router, Request, Response } from 'express'

const router = Router()

const BASE_URL = process.env.BASE_URL || 'https://api.nogadacarguard.co.za'

// ─── HTML page helpers ────────────────────────────────────────────────────────

/**
 * Escape text before it goes into one of the pages below.
 *
 * These pages are Netcash redirect targets and every value in them comes
 * straight off the query string, so `?p3=<img src=x onerror=...>` was
 * reflected into the document. On a payments host that is worth taking
 * seriously, whatever Netcash is expected to send.
 */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function successPage(guardName: string, amount: string, confirmed = true) {
  const value = parseFloat(amount)
  const amountText = Number.isFinite(value) && value > 0 ? `R${value.toFixed(2)}` : ''
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
    <h1>${confirmed ? 'Payment Successful!' : 'Thank you!'}</h1>
    <div class="amount">${amountText}</div>
    <p>Your tip to <span class="guard">${esc(guardName) || 'your car guard'}</span> ${confirmed ? 'has been received. They will be notified shortly.' : 'is being processed. They will be notified as soon as your bank confirms it.'}</p>
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
    ${reason ? `<p class="reason">${esc(reason)}</p>` : ''}
    <p>Please try again by scanning the QR code.</p>
    <p class="close-note">You can close this tab.</p>
    <p class="tippa">Powered by Tippa</p>
  </div>
</body>
</html>`
}

// ─── Netcash redirect endpoints ───────────────────────────────────────────────

// Netcash form-POSTs the customer back after "Complete transaction"; a plain
// browser visit arrives as GET. Both must render a page, never JSON.
function readParams(req: Request): Record<string, string> {
  const out: Record<string, string> = {}
  for (const src of [req.query, req.body]) {
    if (!src || typeof src !== 'object') continue
    for (const [k, v] of Object.entries(src)) {
      if (v !== undefined && v !== null) out[k] = String(Array.isArray(v) ? v[0] : v)
    }
  }
  return out
}

function renderResult(req: Request, res: Response, defaultOutcome: 'accept' | 'decline' | 'unknown') {
  const p = readParams(req)
  const accepted = (p.TransactionAccepted ?? '').toLowerCase()
  const outcome =
    accepted === 'true' ? 'accept' : accepted === 'false' ? 'decline' : defaultOutcome

  const description = p.p3 || p.Description || ''
  const guardName = description.replace(/^Tip for /i, '')
  const amount = p.Amount || p.p4 || ''

  console.log('Netcash customer return:', {
    path: req.path,
    method: req.method,
    outcome,
    ref: p.Reference || p.p2,
    amount,
  })

  res.set('Content-Type', 'text/html; charset=utf-8')
  if (outcome === 'decline') {
    res.send(declinePage(p.Reason || p.reason || ''))
  } else {
    res.send(successPage(guardName, amount, outcome === 'accept'))
  }
}

router.all('/netcash/accept', (req, res) => renderResult(req, res, 'accept'))
router.all('/netcash/decline', (req, res) => renderResult(req, res, 'decline'))
// Re-direct URL (customer returning from their bank, e.g. Instant EFT) — outcome may not be known yet.
router.all('/netcash/redirect', (req, res) => renderResult(req, res, 'unknown'))
router.all('/return', (req, res) => renderResult(req, res, 'unknown'))

export default router
