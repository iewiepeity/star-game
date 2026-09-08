# Security policy

Never publish API keys, personal information, full player saves, or exploit details in an issue.
If GitHub shows **Security → Report a vulnerability**, use that private reporting route.
If private reporting is unavailable, open an issue requesting a private contact without technical exploit details, then wait for the maintainer to provide a channel.

The maintained target is the latest main release. No response SLA is promised.

## Deployment limitations

The game and privacy page enforce meta CSP and no-referrer. Inline JavaScript and eval are not allowed; game inline styles are currently required for runtime layout. This is defense in depth, not proof that all DOM XSS is eliminated.

GitHub Pages does not apply arbitrary custom response headers. A hosting/proxy decision is needed before these can be enforced:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
X-Frame-Options: DENY
```

Do not claim frame-ancestors works in a meta tag. See https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html . Test PWA and any future popup integration before changing hosting headers.

## Maintainer actions requiring repository settings

- Enable private vulnerability reporting, secret scanning and push protection where available.
- Enable CodeQL default setup for JavaScript/TypeScript and dependency review where supported.
- Keep existing weekly npm and GitHub Actions Dependabot updates and SHA-pinned actions.
- Review the privacy notice before adding analytics, accounts, cloud saves or new vendors. Never embed provider API keys in browser code or store session tokens in localStorage.

The privacy notice documents current engineering behavior; it is not a GDPR certification. A real private privacy-contact channel and jurisdiction-specific review remain maintainer responsibilities.
