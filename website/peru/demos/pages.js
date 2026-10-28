/* THE FULL-SCREEN PAGES THE DEMOS OPEN, in one place. Four of them:
     · `purchase`  — the Rocoto app on delivery, from its own camera to the purchase it read off
       the paper and the one act at its foot (SPEC 17b). Used by `entrega.html`.
     · `collected` — the SAME document, opened from a notification, with the purchase settled:
       Rocoto collected it from your Yape (SPEC 17d). Used by `cobro.html`.
     · `pay`       — the page the CUSTOMER opens from the Yape link: the order as our delivery
       note, the amount, «Pay now», «Copy the amount» and the button that opens Yape, with Yape's
       and Plin's marks (SPEC 17e). Used by `tienda.html`, the selling demo.
     · `charge`    — the shop's own Yape «Mi QR» screen, for paying across the counter.
   THE DOCUMENT IS ONE DRAWING. `doc()` below is the delivery note the product sets — the head
   `detail.tsx` pushes on a phone, one line per line off `document-parts.tsx` and the real capture
   at `peru/cap/pedido-movil.webp` on a 66 px pitch, and the figure lockup of `rocoto/figure` —
   and all three screens that show an order show that one.
   Loaded after wa.js. Both languages live here: `WA.pick` hands back the one this page is
   painting (`?lang=`). */
(function (global) {
  'use strict';

  var G = global.WA.glyphs;
  var COPIED = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BRAND = '<div class="wa-pg-brand"><img src="/brand/face-open.svg" alt="" width="22" height="22"><span>Rocoto</span></div>';
  /* Yape's own back chevron is a hairline, not the messenger's chunky one */
  var BACK = '<span class="yq-back"><svg viewBox="0 0 10 18" fill="none" aria-hidden="true">' +
    '<path d="M8.6 1.4 1.6 9l7 7.6" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  var S = global.WA.pick({
    en: {
      qrTitle: 'My QR',
      qrSay: 'Show this QR. Your customer pays from their phone.',
      qrShare: 'SHARE YOUR QR',
      got: function (payer, amount) { return payer + ' paid ' + amount; },
      gotSub: 'With Yape. The digital boleta went with the payment.',
      /* the Rocoto app, from its camera to the purchase it read off the paper */
      pNew: 'New purchase',
      pFrame: 'Include the whole invoice.',
      pReading: 'Reading the invoice…',
      pBar: 'Purchase',
      pRead: 'Invoice photo',
      pTotal: 'Total',
      pLines: function (n) { return n + ' items'; },
      pLater: 'Pay with credit',
      pPaid: function (payee) { return payee + ' is paid today.'; },
      pCollect: 'Rocoto collects it automatically on the agreed day.',
      pReview: 'Pay with credit',
      pInvoice: 'Invoice',
      pOffer: 'Credit 1 of 3 · 7 days',
      pInterest: 'Interest',
      pFees: 'Fees',
      pRepay: 'Total to repay',
      pAutomatic: 'Payment date',
      pMethod: 'Automatic payment from Yape',
      pConfirm: 'Confirm and pay',
      pProcessing: 'Sending payment…',
      pConfirmed: 'Payment sent',
      pScheduled: function (date) { return 'Automatic repayment from Yape on ' + date + '.'; },
      pSupplierPaid: 'Payment sent',
      pDone: 'View invoice',
      /* the same purchase, settled: Rocoto took it out of your Yape by itself */
      pFull: 'Credit repaid',
      pTaken: 'Paid automatically from Yape.',
      pPaymentFrom: 'Automatic payment',
      pRepaymentDate: 'You repay on',
      pPurchaseFor: 'For your purchase from',
      /* the page the customer opens from the link */
      yOrder: 'Your order',
      yFrom: 'From your chat',
      yPayNow: 'Pay now',
      yCopy: 'Copy amount',
      yCopied: 'Amount copied',
      yOpen: 'Open Yape',
      yWith: 'Pay with Yape or Plin',
      ySend: 'Pay to this number.',
      yFirst: 'Copy the amount to pay in Yape.',
      yOnClip: 'Paste the amount in Yape.'
    },
    es: {
      qrTitle: 'Mi QR',
      qrSay: 'Muestra tu QR. Tu cliente paga desde su celular.',
      qrShare: 'COMPARTE TU QR',
      got: function (payer, amount) { return payer + ' pagó ' + amount; },
      gotSub: 'Con Yape. La boleta digital salió con el pago.',
      pNew: 'Nueva compra',
      pFrame: 'Incluye toda la factura.',
      pReading: 'Leyendo la factura…',
      pBar: 'Compra',
      pRead: 'Foto de la factura',
      pTotal: 'Total',
      pLines: function (n) { return n + ' productos'; },
      pLater: 'Pagar a crédito',
      pPaid: function (payee) { return payee + ' cobra hoy.'; },
      pCollect: 'Rocoto lo cobra automáticamente el día acordado.',
      pReview: 'Pagar a crédito',
      pInvoice: 'Factura',
      pOffer: 'Crédito 1 de 3 · 7 días',
      pInterest: 'Interés',
      pFees: 'Comisiones',
      pRepay: 'Total a pagar',
      pAutomatic: 'Fecha de pago',
      pMethod: 'Cobro automático de tu Yape',
      pConfirm: 'Confirmar y pagar',
      pProcessing: 'Enviando el pago…',
      pConfirmed: 'Pago enviado',
      pScheduled: function (date) { return 'Cobro de tu Yape el ' + date + '.'; },
      pSupplierPaid: 'Pago enviado',
      pDone: 'Ver factura',
      pFull: 'Crédito pagado',
      pTaken: 'Pagado automáticamente desde Yape.',
      pPaymentFrom: 'Cobro automático',
      pRepaymentDate: 'Devuelves el crédito el',
      pPurchaseFor: 'Por tu compra a',
      yOrder: 'Tu pedido',
      yFrom: 'De tu chat',
      yPayNow: 'Pagar ahora',
      yCopy: 'Copiar monto',
      yCopied: 'Monto copiado',
      yOpen: 'Abrir Yape',
      yWith: 'Paga con Yape o Plin',
      ySend: 'Paga a este número.',
      yFirst: 'Copia el monto para pagar en Yape.',
      yOnClip: 'Pega el monto en Yape.'
    }
  });

  /* every page carries the moment it takes the screen, so a scene reads in one piece */
  function timed(pages, at) {
    (at || []).forEach(function (ms, i) { if (pages[i]) pages[i].at = ms; });
    return pages;
  }

  /* ══ THE DELIVERY NOTE, AS THE PRODUCT SETS ONE ════════════════════════════════════════════
     Peter, 20 September: «And the invoice should be in the nice format that we do them in our
     site. you didnt use the same style as our delivery notes in terms of structure and stuff».
     Lifted part by part from the real prototype (`app/src/prototypes/bodega-pay-later/`) and from
     its own capture at `peru/cap/pedido-movil.webp`:
       · the document head `detail.tsx` pushes on a phone (`document-identity`): the other party
         at HeadingXSmall, the day under it in the brand's own date face, then the provenance line
         at LabelXSmall in `contentTertiary` — on the real screen `1909-114 · Viewed by … · 11:45`;
       · one line per line (`document-parts.tsx` and that capture): the painted face at 40 px, the
         name at LabelMedium, the quantity in ink with its unit beside it, the row's own menu at
         the right edge, on a 66 px pitch;
       · the figure lockup (`rocoto/figure`): the unit on the number's own line, the fraction at
         0.65 em with zero leading.
     `flat` is the same document on a web page rather than inside the app: it sits in the page's
     own column instead of filling a screen. */
  function doc(o, flat) {
    return '<div class="rp-doc' + (flat ? ' flat' : '') + '">' +
      '<div class="rp-who">' + o.who + '</div>' +
      '<div class="rp-when">' + o.day + '</div>' +
      '<div class="rp-meta">' + o.number + ' · ' + o.from + ' · ' + o.at3 + '</div>' +
      '<div class="rp-lines">' + o.lines.map(function (l) {
        return '<div class="rp-line">' +
          (l[3] ? '<span class="f"><img src="' + l[3] + '" alt=""></span>' : '<span class="f blank"></span>') +
          '<span class="n">' + l[0] + '</span>' +
          '<span class="q">' + l[1] + '</span><span class="u">' + l[2] + '</span>' +
          '<span class="m"><i></i><i></i><i></i></span></div>';
      }).join('') + '</div>' +
      '<div class="rp-total"><span class="lb">' + S.pTotal + '</span>' +
        global.WA.figure(o.total) + '</div>' +
      '</div>';
  }

  var bar = function (word) {
    return '<div class="rp-bar"><span class="bk">' + G.arrowLeft + '</span>' +
      '<span class="w">' + word + '</span></div>';
  };
  var ok = G.okDisc.replace('<svg ', '<svg class="ok" ');

  global.WA_PAGES = {
    strings: S,
    doc: doc,

    /* Invoice → review sheet → confirmation → supplier receipt → scheduled repayment.
       WorkflowDialog's phone geometry and OverlayCard's motion are from the product at
       1e6f5f3e. The seven-day example follows the early offer in SPEC (22 September).
       These are timed presentation states; this demonstration submits no payment. */
    purchase: function (o) {
      var view = function (guide) {
        return '<div class="rc-view"><img src="' + o.src + '" alt="" width="390" height="520">' +
          (guide ? '<span class="rc-guide"><i></i><i></i><i></i><i></i></span>' : '') + '</div>';
      };
      var body = doc({ who: o.payee, day: o.day, number: o.number, from: S.pRead,
        at3: o.at3, lines: o.lines, total: o.total }) +
        '<div class="rp-count">' + S.pLines(o.lines.length) + '</div>';
      var figure = global.WA.figure;
      var sheet = function (content, footer, cls) {
        return '<div class="rp-payment-scrim"></div><div class="rp-payment-sheet ' + (cls || '') + '">' +
          content + (footer ? '<div class="rp-payment-foot">' + footer + '</div>' : '') + '</div>';
      };
      var schedule = function (label) { return '<div class="rp-payment-schedule"><span>' + (label || S.pAutomatic) + '</span>' +
        '<span class="rp-payment-date">' + o.due + '</span>' +
        '<span class="rp-payment-method">' + S.pMethod + '</span></div>'; };
      return timed([
        {
          cls: 'cam',
          html: bar(S.pNew) + view(true) +
            '<div class="rc-foot"><span class="rc-say">' + S.pFrame + '</span>' +
            '<span class="rc-shut" id="rc-shut"><i></i></span></div>'
        },
        {
          cls: 'cam',
          html: bar(S.pNew) + view(false) +
            '<div class="rc-foot"><span class="rc-read"><span class="sp">' + G.spin + '</span>' +
            '<span class="t">' + S.pReading + '</span></span></div>'
        },
        {
          html: bar(S.pBar) + body +
            '<div class="rp-acts"><div class="rp-btn pri" id="rp-later">' + S.pLater + '</div></div>'
        },
        {
          cls: 'rp-drawer review', under: 2,
          html: sheet('<div class="rp-payment-head">' + S.pReview +
            '<span class="rp-payment-close">' + G.close + '</span></div>' +
            '<div class="rp-payment-body"><p class="rp-payment-party">' + o.payee + '</p>' +
            '<p class="rp-payment-ref">' + S.pInvoice + ' ' + o.number + '</p>' +
            '<div class="rp-payment-amount">' + figure(o.total) + '</div>' +
            '<p class="rp-payment-offer">' + S.pOffer + '</p>' +
            '<div class="rp-payment-row"><span>' + S.pInterest + '</span><span class="rp-payment-rate">0%</span></div>' +
            '<div class="rp-payment-row"><span>' + S.pFees + '</span>' + figure(o.fees) + '</div>' +
            '<div class="rp-payment-row repayment"><span>' + S.pRepay + '</span>' + figure(o.total) + '</div>' +
            schedule() + '</div>', '<div class="rp-btn pri" id="rp-confirm">' + S.pConfirm + '</div>')
        },
        {
          cls: 'rp-drawer processing', under: 2,
          html: sheet('<div class="rp-payment-progress">' +
            '<span class="rp-progress-mark">' + G.spin + '</span>' +
            '<h2 class="rp-payment-status">' + S.pProcessing + '</h2>' +
            '<div class="rp-payment-amount">' + figure(o.total) + '</div>' +
            '<p class="rp-payment-party">' + o.payee + '</p></div>', '', 'compact')
        },
        {
          cls: 'rp-drawer confirmed', under: 2,
          html: sheet('<div class="rp-payment-receipt">' + G.paymentCheck +
            '<h2 class="rp-payment-status">' + S.pConfirmed + '</h2>' +
            '<div class="rp-payment-amount">' + figure(o.total) + '</div>' +
            '<p class="rp-payment-party">' + o.payee + '</p>' +
            schedule(S.pRepaymentDate) + '</div>', '<div class="rp-btn pri" id="rp-payment-done">' + S.pDone + '</div>', 'compact')
        },
        {
          html: bar(S.pBar) + body +
            '<div class="rp-acts"><div class="rp-done">' + ok +
            '<span><span class="t">' + S.pSupplierPaid + '</span>' +
            '<span class="s">' + S.pScheduled(o.due) + '</span></span></div></div>'
        }
      ], o.at);
    },

    /* Repayment opens with its result; the invoice stays one clear action away. */
    collected: function (o) {
      return timed([
        {
          cls: 'rp-settled confirmed',
          html: BRAND + '<div class="rp-payment-receipt">' + G.paymentCheck +
            '<h2 class="rp-payment-status">' + S.pFull + '</h2>' +
            '<div class="rp-payment-amount">' + global.WA.figure(o.total) + '</div>' +
            '<p class="rp-payment-context">' + S.pPurchaseFor + '</p>' +
            '<p class="rp-payment-party">' + o.payee + '</p>' +
            '<div class="rp-payment-source"><span>' + S.pPaymentFrom + '</span><strong>Yape</strong></div>' +
            '</div><div class="rp-payment-foot"><div class="rp-btn pri" id="rp-collected-done">' + S.pDone + '</div></div>'
        },
        {
          html: bar(S.pBar) +
            doc({ who: o.payee, day: o.day, number: o.number, from: S.pRead,
              at3: o.at3, lines: o.lines, total: o.total }) +
            '<div class="rp-count">' + S.pLines(o.lines.length) + '</div>' +
            '<div class="rp-acts"><div class="rp-done">' + ok +
            '<span><span class="t">' + S.pFull + '</span>' +
            '<span class="s">' + S.pTaken + '</span></span></div></div>'
        }
      ], o.at);
    },

    /* ══ THE PAGE THE CUSTOMER OPENS ═══════════════════════════════════════════════════════
       SPEC 17e, Peter verbatim: «In that Yape link, it shows the delivery note in our format.
       Those customers get a really nice thing, and that's where it has the "Pay Now" button, or
       that's where it has the copy amount, or that's where it has the button that, when clicked,
       makes them just go to Yape to pay the amount. It shows them the amount, and it goes to Yape
       to pay that amount… And the Yape and Plin logos need to be in the right place.»

       It is the prototype's own `pay/link.tsx`, which carries four facts and nothing else: whose
       shop it is, the exact amount, what it is for, and how to pay. Its research is recorded
       there — no published Yape address carries an amount, so the amount goes on the clipboard
       first and `Open Yape` comes live once it is there. Three pages:
         0  the shop, the order as our delivery note, the amount, and `Pay now`;
         1  Yape's and Plin's marks, the shop's number, `Copy the amount`, `Open Yape` asleep;
         2  the amount is copied, and `Open Yape` is awake.
       Nothing about credit is on this page: a rate, a term, an instalment and an approval word
       wait for a signed lender (`regulatory.ts`). */
    pay: function (o) {
      var head = '<h1>' + o.shop + '</h1><p class="sub">' + o.address + '</p>';
      var body = head + doc({ who: o.payer, day: o.day, number: o.number, from: S.yFrom,
        at3: o.at3, lines: o.lines, total: o.total }, true);
      var marks =
        '<div class="pl-marks"><span class="pl-mk"><img src="/peru/banks/yape.webp" alt="Yape" width="38" height="38"></span>' +
        '<span class="pl-mk"><img src="/peru/banks/plin.webp" alt="Plin" width="38" height="38"></span>' +
        '<span class="pl-with">' + S.yWith + '</span></div>';
      /* the two pages carry the same acts, so each one names its own: a touch is sent to the
         button that is ON the screen rather than to the first one in the document */
      var yape = function (live) {
        var n = live ? '2' : '';
        return head + marks +
          '<div class="pl-amt">' + global.WA.figure(o.total) + '</div>' +
          '<p class="pl-num">' + o.yape + '</p>' +
          '<p class="sub pl-say">' + S.ySend + '</p>' +
          '<div class="grow"></div>' +
          '<div class="btn sec" id="pl-copy' + n + '">' + (live ? COPIED : G.copy) + '<span>' + (live ? S.yCopied : S.yCopy) + '</span></div>' +
          '<div class="btn' + (live ? '' : ' off') + '" id="pl-open' + n + '">' + G.ext +
          '<span>' + S.yOpen + '</span></div>' +
          '<p class="note">' + (live ? S.yOnClip : S.yFirst) + '</p>';
      };
      return timed([
        { cls: 'payment', html: body + '<div class="grow"></div><div class="btn" id="pl-now">' + S.yPayNow + '</div>' },
        { cls: 'payment', html: yape(false) },
        { cls: 'payment', html: yape(true) }
      ], o.at);
    },

    /* The shop's own QR, opened from the chat: Yape's «Mi QR» screen, drawn here in our own
       markup — the purple field, the white card, the code and the shop's name, the teal button.
       The code is a REAL one and it carries OUR address, drawn by the kit (`WA.qr`); a stranger's
       scannable code is never drawn. Then the money arriving, and the boleta that goes with it. */
    charge: function (o) {
      return timed([
        {
          cls: 'yape',
          html:
            '<div class="yq">' +
            '<div class="yq-field">' +
            '<div class="yq-bar">' + BACK + '<span class="yq-t">' + S.qrTitle + '</span></div>' +
            '<p class="yq-say">' + S.qrSay + '</p>' +
            '</div>' +
            '<div class="yq-card">' +
            '<span class="yq-mark"><img src="/peru/banks/yape.webp" alt="Yape" width="42" height="42"></span>' +
            '<span class="yq-code">' + global.WA.qr() + '</span>' +
            '<span class="yq-name">' + o.shop + '</span>' +
            '</div>' +
            '<div class="yq-btn">' + S.qrShare + '</div>' +
            '</div>'
        },
        {
          html: BRAND + '<div class="center"><span class="check">' + G.check + '</span>' +
            '<span class="ok-t">' + S.got(o.payer, o.amount) + '</span>' +
            '<span class="ok-s">' + S.gotSub + '</span></div>'
        }
      ], o.at);
    }
  };
})(window);
