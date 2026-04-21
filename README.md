# Veo3 Grok License Manager

Next.js admin panel and license API for Auto Veo3 Grok.

## Security model

- Admin login uses a server-side httpOnly cookie.
- License keys are looked up by `HMAC-SHA256(key, LICENSE_KEY_PEPPER)`.
- The display copy of a license key is encrypted in MongoDB with AES-256-GCM.
- The tool calls `/api/license/verify` on startup and receives a short-lived run session.
- Sensitive runtime steps call `/api/license/run-permit` before reCAPTCHA token collection and before image/video API requests.
- Expired licenses are marked `Expired` and `active=false` automatically when admin data is loaded or when a license is checked.

No local client can be mathematically impossible to patch. The important rule is:
do not put server secrets in the packaged tool, keep valuable authorization on
the server, and package the tool with a locked HTTPS license server URL.

## Required environment

Copy `.env.local.example` to `.env.local` and set:

- `MONGODB_URI`
- `LICENSE_KEY_PEPPER`
- `LICENSE_DATA_ENCRYPTION_KEY`
- `LICENSE_SERVER_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_SALT`
- `ADMIN_PASSWORD_HASH`

Keep `LICENSE_KEY_PEPPER` and `LICENSE_DATA_ENCRYPTION_KEY` stable across server
deploys. You can rotate `LICENSE_SERVER_SECRET`; old licenses remain valid, but
existing admin sessions and run sessions will be invalidated.

## Import legacy license data

Paste rows using this column order:

```text
License Key    Machine ID    Expiration    Owner Name    Owner Phone    Status
```

The admin UI accepts tab-separated or comma-separated rows. Existing keys are
upserted, so customers can continue using the same license after moving to
MongoDB. The bundled legacy customer list in `lib/legacy-licenses.js` is seeded
automatically the first time the admin license list is loaded.

The `support` account can only activate trial keys with an expiration date up to
10 days from today. Bulk import, delete, and long-term activation are blocked on
the server for support sessions.

## Tool integration

In `license_server_client.py`, replace:

```python
LOCKED_LICENSE_SERVER_URL = "http://localhost:3000"
```

with your production HTTPS domain before packaging. Do not enable
`VEO3_LICENSE_ALLOW_SERVER_OVERRIDE=1` in production builds.
