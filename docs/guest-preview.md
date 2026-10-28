# Mounted guest preview

This optional build runs the original browser workspace against its own loopback guest services. Each mounted app scopes its browser local/session storage and IndexedDB to its prefix. The prototype and collection APIs keep their native session and workspace contracts; collection data lives in the recipient-owned encrypted SQLite store. The guest router admits only the sample workflows and read-only setup status, and excludes provider, sending and fiscal actions. It clears inherited provider credentials and has no provider accounts configured. The account-connection service issues a Secure, HttpOnly, SameSite Strict guest cookie scoped to the mount. Default self-hosted builds and their original cookie names remain unchanged.

Use Python 3.12 with the dependencies in `mock-api/requirements.txt` and `app/src/prototypes/copper/requirements.txt`. Create a private state directory outside the checkout, then select an HTTPS origin, prefix and loopback port. The operator must configure the HTTPS reverse proxy to preserve the path and Origin headers. The guest service never accepts client-supplied provider credentials.

```sh
VITE_ATELIER_GUEST_PREFIX=/apps/example npm run build
PYTHONPATH=tools/offline python tools/guest_preview.py --origin https://preview.example.test --prefix /apps/example --state /absolute/private/guest-state --port 18582 --static app/dist --entry index.html
```

The environment variable is an explicit build option; omit it for the ordinary source. Actual first-party handlers answer API requests and optional providers report their normal unconfigured status. Each collection workspace uses its own bearer capability. The loopback network fence from `tools/offline` should be enabled for a provider-free preview.

For the Bodega sample run the build from `app/` with `npm run build -- --base=/apps/peru/`, then run the service from the repository root with `--prefix /apps/peru --entry bodega-pay-later.html --sample-bank bodega`. The Bodega guest bank fixture uses the authored synthetic Bodega Yesenia name, BCP account and PEN closing balance from `cast-bodega.json`. It asserts no historical bank receipts; new sample receipts remain native workspace records. The original Copper sample fixture remains the default.
