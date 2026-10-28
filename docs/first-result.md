# First result

Run `make install && make dev` from the checkout, then open `http://127.0.0.1:18240/#/prep`. The browser selects the existing sample source because the live WhatsApp bridge is awaiting activation. Its source label stays **Sample chats**.

1. **Prep** shows twelve generated sales in five delivery blocks. Open a sale to inspect its lines and preparation state. These are sample commercial records; the fixture clock moves the reference day onto the current Peru day.
2. **Chats** shows the same synthetic trading relationships. Review the source words and the reader's customer/supplier classifications. The public release selects economic evidence ranking; the former personal-account “laughs” experiment remains explicitly testable in the source.
3. **Money** shows the shop's recorded money, supplier obligations, candidate fiados and three transparent trading indicators. A proposed debt becomes a recorded debt after the merchant confirms it. The full sample money book is authored separately from chat interpretation.
4. Create a collection page from a described sale or fiado. The buyer page uses the collection service’s persistent request at the configured loopback origin. The loopback first-run origin is already configured for its own persistent collection service.

The existing Bodega collection client obtains its own sample workspace capability. New collection requests persist in the service's encrypted SQLite ledger. The seller's workspace bearer capability and a buyer's individual request capability grant different scopes.

5. Open the buyer URL in a second browser context. Its view contains the seller, description, exact quote and payment state. Keep **sample** receipt provenance when exercising this path. Reloading the seller page reads the same durable request.

The source corpus contains 2,960 generated messages over 27 threads, eighteen customers and nine suppliers. It carries quantities and words; the money seed holds integer minor-unit amounts. The ninety-day sample book and thirty-day sample bank are illustrative inputs, with [provenance](provenance.md).

The sample path makes the UI and storage architecture inspectable. Your own Meta authorization supplies actual chat context through the same source interface. Bank and fiscal providers retain their own commissioning steps in [own-account setup](providers.md).

For the optional automated browser proof, install `pip install -r requirements-browser.txt` in the virtual environment and run `.venv/bin/python -m playwright install chromium`.

`.venv/bin/python tools/first-result.py` runs a bounded local proof against an already running `make dev`: phone/desktop rendering, sample source, persistent collection creation and partial receipt conservation. Browser requests are confined to loopback; receipts remain synthetic. It saves its receipt and screenshots under ignored `.local/proof/`.
