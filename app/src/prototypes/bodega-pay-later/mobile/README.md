# Bodega Android onboarding

The locally bundled Capacitor app is the second commitment in the Bodega waitlist funnel.
A signed inbound WhatsApp message has already reserved the person's place before installation.

## Customer route

1. Referral opens the Peru marketing website. Its join action opens a prefilled Rocoto WhatsApp
   conversation. The customer sends it; the signed inbound creates their waitlist place.
2. The chat confirms the real place, asks personal name, business name and the Google account email
   used for Play testing. Tester eligibility is separate from opting into testing and installing.
3. The app opens with the approved fishmonger illustration and black Rocoto brand. Get started
   asks for the same phone number. WhatsApp verifies it through the separately commissioned
   authentication template: zero-tap when eligible, one-tap or six-digit entry otherwise.
4. The signed-in app hydrates personal and business names. It asks missing personal name, business
   type/name and address. These are the person's own contact records, available before Meta.
5. WhatsApp Business connection comes last. App selection/install remain native; Meta alone opens
   in the browser's Auth Tab, preserving the browser's normal login cookies. The existing PKCE
   handoff binds Meta completion to the same phone verified by OTP.
6. Server-confirmed completion opens the real business pass, waitlist and referral home. Reopening
   reloads server state. Referral sharing leads new people to the marketing website.

`mobile/session.ts` owns server commands and encrypted native session/pending state. Ordinary
local drafts carry profile edits and navigation, never account authority. An OTP session grants
contact-safe access; Meta's separate connection proof gates connected-business operations.

The question screens use Fraunces, simple underlines, a semantic numeric/code input, progress dots
and one forward chevron within the visual viewport above the keyboard. The browser walk preserves
its separate contract. Native address selection reuses the real Places endpoint and existing map.

## Commissioning

A compiled OTP client is not proof of real zero-tap delivery. Release requires an approved Meta
authentication template, matching installed certificate hash, owned provider configuration and a
physical-device run. Play enrollment requires a verified Console app, internal track and eligible
Google account; an APK download alone does not establish eligibility.

The customer-success agent is scoped separately. The initial chat intake is a deterministic,
resumable sequence, not a general agent with filesystem or coding privileges.

See [the mobile specification](../MOBILE-SPEC.md) and prototype API (historical reference outside this export).
