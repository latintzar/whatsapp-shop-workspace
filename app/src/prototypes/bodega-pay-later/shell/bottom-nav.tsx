/* THE BOTTOM NAVIGATION — the phone's rail, and Base's own.
 *
 * THE SEATS ARE THE PLACES: Prep · Money · Products · Customers · Chats · Admin.
 *
 * ═══ THE CONVERSATION IS A SEAT AGAIN, AND THE REASON IS GEOMETRY (QA 12) ══════════════════
 * §42 took the chats off this row — «Chats live ONLY in the widget» — and the widget's door
 * became a 56px accent disc fixed in the viewport's bottom-right corner, resting above this row.
 * A floating control cannot reserve its own room, and the audit photographed the cost: the disc
 * on the last word of «What you owe your suppliers», on Rosa menú's S/ 318.00, on the one chevron
 * a Stock row has, on the composer's own send disc at 1440, on «Open chat» at 1024 where it
 * painted as «Op».
 *
 * §42'S LAW IS UNTOUCHED: the conversation is still ONLY the widget — this seat opens that panel
 * and reaches no route of its own, which is why it is a button rather than a link. What changed
 * is where its door stands: in the chrome the page already ends above, where nothing is covered
 * at any width or any scroll position.
 *
 * AND THE COUNT CAME WITH IT. `replyOwedCount` is the one number §128.2 reserves — the
 * conversations Rocoto deferred a reply on — read once in `shell/frame.tsx` and spent here and in
 * the panel's own header, so the two can never say different things (QA 48).
 *
 * ═══ THE FOURTH SEAT IS THE DOOR INTO THE WORLD (FEED-IA §53) ══════════════════════════════
 * Settings held this seat while the desk moved it into the rail's profile menu (§44): a phone has
 * no foot to put a profile on, because this row IS the foot. §53 then turned Settings into
 * Administration — its own world, with its own sidebar and a back button at the top — so the seat
 * survives and its destination changes: it opens the world's INDEX, and a seat is pushed over that.
 *
 * IT IS NOT ONE OF THE GLOBBED AREAS, so it is drawn here rather than routed through the registry:
 * `#/admin` is a world and not a file in `areas/`, and a synthetic entry in the areas list would be
 * a lie the rail would have to filter back out. One seat, stated once, in the row that draws it.
 *
 * ⚠ AND THE SHAPE IS PETER'S CALL (THE-ADMIN-CANON §9, recorded). §53 says the phone «pushes the
 * world full-screen with the back at top», which is what this builds; whether the door belongs on
 * the bottom row at all — rather than behind a profile the phone does not have — is his. The
 * default is taken and written down.
 *
 * ═══ WHY THIS IS BASE'S PARTS AND NOT BASE'S COMPONENT ═════════════════════════════════════
 * `baseui/bottom-navigation` is a TAB CONTAINER: it takes `NavItem` children, renders every one
 * of their panels and shows the active one. This app routes on the hash and discovers its areas
 * by glob, so handing Base the panels would mean mounting every area at once and hiding three of
 * them. So the SELECTOR ROW is Base's — `StyledSelectorList`, `StyledSelector`, `StyledTitle`,
 * with Base's own 64px height, its grid, its hairline and its two navigation colours — and the
 * thing each selector does is what it does everywhere else in this app: it is a link to a hash. A
 * door that is a real link is a door you can middle-click, and the rail above 720px is made of
 * the same links and the same marks.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { StyledSelectorList, StyledSelector, StyledTitle } from 'baseui/bottom-navigation';
import { ADMIN, type AreaMeta } from './area';
import AreaGlyph, { hasGlyph } from './glyphs';
import { Count, Glyph } from '../../cedar/glyphs';
import { openChats } from './chats';

export default function BottomNav({
  areas,
  current,
  inWorld = false,
  chatsOwed = 0,
}: {
  areas: AreaMeta[];
  current: string;
  /** true while the person is standing anywhere inside Administration, so the fourth seat lights */
  inWorld?: boolean;
  /** how many conversations are waiting on the shop's own sentence, for the Chats seat's badge */
  chatsOwed?: number;
}) {
  const [, theme] = useStyletron();

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Areas"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 6,
        background: theme.colors.backgroundPrimary,
        /* the phone's own chin, when it has one */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── THE SEAT IS THE WHOLE ROW'S HEIGHT (INTX-12 · §188.2 · E193.14) ──────────────────
          Base draws this list 64px tall and then insets its seats by `scale500` top and bottom,
          which leaves each seat 40px — under INTX-12's 44px floor on the one row of this app that
          exists ONLY for thumbs. W8 measured them at 87.5×40 at 390.

          THE INK DOES NOT MOVE. Every selector already centres its glyph and its word
          (`justifyContent: center`), so giving the seats the row's full 64px changes where the
          FINGER lands and nothing about where the mark is drawn — the same repair the house makes
          everywhere else: grow the target around the ink rather than grow the ink. */}
      <StyledSelectorList role="tablist" $style={{ paddingTop: 0, paddingBottom: 0 }}>
        {areas.map((a) => {
          const on = a.id === current;
          return (
            <StyledSelector
              key={a.id}
              $as="a"
              href={`#/${a.id}`}
              data-area={a.id}
              role="tab"
              aria-selected={on}
              aria-current={on ? 'page' : undefined}
              $style={{
                position: 'relative',
                textDecoration: 'none',
                color: on ? theme.colors.bottomNavigationSelectedText : theme.colors.bottomNavigationText,
              }}
            >
              {hasGlyph(a.id) && <AreaGlyph id={a.id} />}
              <StyledTitle $isActive={on}>{a.title}</StyledTitle>
            </StyledSelector>
          );
        })}

        {/* ── THE CONVERSATION IS A SEAT NOW (QA 12) ────────────────────────────────────────
            The red disc floated over whatever the phone happened to be painting at the foot of
            the screen — a row's amount, a status word, the one chevron that opens a product — and
            no amount of padding can reserve room for a control that stands outside the layout. So
            it stands INSIDE it: the row the page already ends above, wearing the same conversation
            mark, carrying the same «replies owed» count on its shoulder.
            It is a BUTTON rather than a link, because the conversation is a panel over the work
            rather than a place with an address (§42: «Chats live ONLY in the widget»). */}
        <StyledSelector
          $as="button"
          type="button"
          data-area="chats"
          data-chats-door="phone"
          data-testid="chats-seat-phone"
          role="tab"
          aria-selected={false}
          aria-label={chatsOwed > 0
            ? `Chats — ${chatsOwed} ${chatsOwed === 1 ? 'reply' : 'replies'} owed`
            : 'Chats'}
          onClick={openChats}
          $style={{
            position: 'relative',
            textDecoration: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: theme.colors.bottomNavigationText,
          }}
        >
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Glyph id="chat" />
            {chatsOwed > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -8, display: 'inline-flex' }}>
                <Count value={chatsOwed} testid="chats-seat-count-phone" />
              </span>
            )}
          </span>
          <StyledTitle $isActive={false}>Chats</StyledTitle>
        </StyledSelector>

        <StyledSelector
          $as="a"
          href={`#/${ADMIN}`}
          data-area={ADMIN}
          role="tab"
          aria-selected={inWorld}
          aria-current={inWorld ? 'page' : undefined}
          $style={{
            position: 'relative',
            textDecoration: 'none',
            color: inWorld ? theme.colors.bottomNavigationSelectedText : theme.colors.bottomNavigationText,
          }}
        >
          <Glyph id="sliders" />
          <StyledTitle $isActive={inWorld}>Admin</StyledTitle>
        </StyledSelector>
      </StyledSelectorList>
    </nav>
  );
}

/** How much room the row takes out of the bottom of the page, so a scrolled feed ends above it
 *  rather than under it. Base's own selector-list height, stated once. */
export const BOTTOM_NAV_HEIGHT = 64;
