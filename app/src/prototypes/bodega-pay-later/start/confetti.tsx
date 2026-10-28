/* THE CELEBRATION — our own canvas burst, about a second long, and never over the button.
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «one they connect whatsapp they have
 * to be hit by a "Youre on the Waitlis!"t! confetti t and then next».
 *
 * ═══ WHY IT IS WRITTEN RATHER THAN INSTALLED ════════════════════════════════════════════════
 * A confetti package is a dependency, a licence and a second animation loop for about forty lines
 * of arithmetic. This is those forty lines: two bursts from the lower corners, gravity, drag, a
 * spin, and a fade out. It draws on ONE canvas with `pointer-events: none`, it stops itself, and
 * it releases its frame the moment it is done or unmounted.
 *
 * ═══ WHAT IT IS ALLOWED TO DO ══════════════════════════════════════════════════════════════
 * · THE COLOURS ARE THE THEME'S. They arrive as tokens from the screen that mounts it, so the
 *   burst is the product's own palette and `app/tools/theme-gate.mjs` has nothing to catch here.
 * · IT NEVER BLOCKS A TAP. The canvas is `pointer-events: none` and it sits in the screen's own
 *   `over` layer (`walk.tsx`), above the foot and untouchable, so `Confirm details` is pressable
 *   from the first frame of the burst.
 * · IT NEVER LOOPS. One burst, one run, `done` when it is over.
 * · STILLNESS DRAWS NOTHING AT ALL. `prefers-reduced-motion` means the screen celebrates in type
 *   and colour alone.
 */
import * as React from 'react';

export type ConfettiColours = readonly string[];

type Piece = {
  x: number; y: number; vx: number; vy: number;
  spin: number; angle: number; width: number; height: number; colour: string;
};

/** How long one burst lives, and the shape of it. */
export const CONFETTI_MS = 1200;
const PER_CORNER = 44;
const GRAVITY = 1400;      // px/s², the fall
const DRAG = 0.86;         // per second, the air

function build(width: number, height: number, colours: ConfettiColours): Piece[] {
  const pieces: Piece[] = [];
  /* TWO BURSTS, FROM THE LOWER CORNERS, aimed up and inward — the shape a party popper makes, and
     the one that leaves the middle of the screen (where the number is) clear for the first beat. */
  for (const corner of [-1, 1]) {
    const originX = corner < 0 ? 0 : width;
    for (let index = 0; index < PER_CORNER; index += 1) {
      /* between 55° and 80° off the floor, inward */
      const angle = (55 + Math.random() * 25) * (Math.PI / 180);
      const speed = 900 + Math.random() * 700;
      pieces.push({
        x: originX,
        y: height,
        vx: Math.cos(angle) * speed * -corner,
        vy: -Math.sin(angle) * speed,
        spin: (Math.random() - 0.5) * 18,
        angle: Math.random() * Math.PI,
        width: 5 + Math.random() * 5,
        height: 8 + Math.random() * 6,
        colour: colours[index % colours.length],
      });
    }
  }
  return pieces;
}

export function Confetti({ run, still, colours, onDone, testId = 'confetti' }: {
  /** the burst fires when this turns true, and once */
  run: boolean;
  still: boolean;
  colours: ConfettiColours;
  onDone?: () => void;
  testId?: string;
}) {
  const canvas = React.useRef<HTMLCanvasElement | null>(null);
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (!run || still || fired.current) return undefined;
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return undefined;
    fired.current = true;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = element.clientWidth;
    const height = element.clientHeight;
    element.width = Math.round(width * ratio);
    element.height = Math.round(height * ratio);
    context.scale(ratio, ratio);
    const pieces = build(width, height, colours);
    const started = performance.now();
    let previous = started;
    let frame = 0;
    const draw = (now: number) => {
      const step = Math.min(0.033, (now - previous) / 1000);
      previous = now;
      const life = (now - started) / CONFETTI_MS;
      context.clearRect(0, 0, width, height);
      /* the last third fades the whole picture out, so nothing is ever cut off mid-air */
      context.globalAlpha = life > 0.66 ? Math.max(0, 1 - (life - 0.66) / 0.34) : 1;
      for (const piece of pieces) {
        piece.vy += GRAVITY * step;
        piece.vx *= DRAG ** step;
        piece.vy *= DRAG ** step;
        piece.x += piece.vx * step;
        piece.y += piece.vy * step;
        piece.angle += piece.spin * step;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.colour;
        /* the flake turns edge-on as it spins: one scale on its own axis, no second draw */
        context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height * Math.abs(Math.cos(piece.angle)));
        context.restore();
      }
      if (life < 1) { frame = window.requestAnimationFrame(draw); return; }
      context.clearRect(0, 0, width, height);
      onDone?.();
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [run, still, colours, onDone]);

  if (still) return null;
  return <canvas ref={canvas} data-testid={testId} data-confetti={run ? 'running' : 'waiting'}
    aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
