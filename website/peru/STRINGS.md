# /peru — every visible string, English and Spanish

> **The pages' strings have moved.** Since 20 September the five pages' words live in
> `peru/i18n/`: `en/{main,selling,legal}.json` is extracted from the English sources by
> `tools/peru_i18n.py extract`, and `es/{main,selling,legal}.json` is the Spanish written back
> against it, which `build` turns into `peru/es/*.html`. That pair is the source of truth, and
> `peru/i18n/README.md` holds the glossary and the rules. What this file keeps is the DEMOS'
> words — the four `peru/demos/*.html` tables and the WhatsApp kit's own strings, which carry
> their own `en` / `es` columns and read `?lang=`. Everything below about the page itself is a
> record of the English pass on 20 September; the live pair is `peru/i18n/`.


Peter, 20 September: *«obviously not going to launch in Peru in English… do all the screens in
English now so that I can make sure, and then later we'll make it in Spanish as the main thing.»*

So the page carries **English** today, for design review, and **Spanish is what ships**. This table
is the pair. The Spanish column is the text `peru.html` carried before the English pass, captured
before it was overwritten — it is the source, and putting it back is a column swap, one key at a
time. The demos under `peru/demos/` keep their own `en` / `es` tables and read `?lang=`; the page
passes `lang=en` on every demo URL.

**The laws both columns obey** (`peru/SPEC.md`, «Laws that bind every word»): say what IS, with no
negative construction; a heading names the thing bluntly and identically in both languages; a row is
a short heading plus one sentence that adds a fact; a button is a verb and its object; sentence case;
short complete sentences. The credit-advertising rules apply to both columns: no rate, no term, no
number of instalments, no credit amount, no approval word, no claim that pay later is available.

**Three keys are law and ship verbatim** — `legal.status`, `q.when.a` / `q.entity.a` (the two cleared
sentences) and `footer.sbs` (the regulator's own sentence). Changing either column of those three is
a legal change, never a copy edit.

`hero.status` says what the act does, in Peter's terms (20 September): it joins the waitlist, and the
first three payments are free for the seller. The cleared sentence about the supervised lender lives
in `faq.when.a`, verbatim.

| key | English (today) | Spanish (ships) |
|---|---|---|
| `head.title` | Rocoto \| Pay later, inside your WhatsApp | Rocoto \| Pagar después, dentro de tu WhatsApp |
| `head.desc` | Your customer orders on WhatsApp the way they always do. In the same chat they choose to pay now with Yape or pay later with Rocoto, and you get paid on delivery. | Tu cliente te pide por WhatsApp como siempre. En el mismo chat elige pagar ahora con Yape o pagar después con Rocoto, y tú cobras al entregar. |
| `head.og.title` | Rocoto \| Pay later, inside your WhatsApp | Rocoto \| Pagar después, dentro de tu WhatsApp |
| `head.og.desc` | In the same chat your customer chooses to pay now with Yape or pay later with Rocoto, and you get paid on delivery. | En el mismo chat tu cliente elige pagar ahora con Yape o pagar después con Rocoto, y tú cobras al entregar. |
| `head.og.alt` | Pay later, inside your WhatsApp. | Pagar después, dentro de tu WhatsApp. |
| `skip` | Skip to content | Ir al contenido |
| `nav.sections` | Sections of this page | Secciones de la página |
| `nav.how` | How it works | Cómo funciona |
| `nav.banks` | Banks | Bancos |
| `nav.questions` | Questions | Preguntas |
| `act` | Connect your WhatsApp | Conecta tu WhatsApp |
| `hero.h1` | Pay later, inside your WhatsApp | Pagar después, dentro de tu WhatsApp |
| `hero.sub.b` | Your customer orders the way they always do. | Tu cliente te pide como siempre. |
| `hero.sub` | In the same chat they choose to pay now with Yape or pay later with Rocoto, and you get paid on delivery. | En el mismo chat elige pagar ahora con Yape o pagar después con Rocoto, y tú cobras al entregar. |
| `hero.act2` | See how it works | Mira cómo funciona |
| `hero.status` | Connect your WhatsApp to join the waitlist. Your first three payments are free for you, the seller. | Conecta tu WhatsApp para entrar a la lista de espera. Tus tres primeros cobros son gratis para ti, que vendes. |
| `phone.note` | Your phone · simulated conversation | Tu celular · conversación simulada |
| `phone.alt.buy` | Your order to your supplier, and the link whose preview shows Rocoto sent them the funds, in the same chat. | Tu pedido a tu proveedor, y el link cuya vista previa muestra que Rocoto le envió los fondos, en el mismo chat. |
| `phone.alt.collect` | Rocoto's notification that your purchase was collected from your Yape, and that purchase paid in full in the app. | La notificación de Rocoto de que tu compra se cobró de tu Yape, y esa compra pagada por completo en la app. |
| `phone.alt.delivery` | The supplier's invoice, read by Rocoto: its lines, its total and one act, pay later. | La factura de tu proveedor, leída por Rocoto: sus líneas, su total y una sola acción, pagar después. |
| `phone.frame.sell` | Simulated conversation: your order, your confirmation, and your supplier paid today | Conversación simulada: tu pedido, tu confirmación, y tu proveedor cobrado hoy |
| `phone.frame.buy` | Simulated conversation: you order, pay later with Rocoto, and your supplier is paid | Conversación simulada: pides, pagas después con Rocoto, y tu proveedor cobra |
| `phone.frame.delivery` | Simulated delivery: the invoice photographed in Rocoto and paid later | Entrega simulada: la factura fotografiada en Rocoto y pagada después |
| `band.statement` | Your customers and your suppliers are already on WhatsApp. You charge and pay right there. | Tus clientes y tus proveedores ya están en WhatsApp. Ahí mismo cobras y pagas. |
| `uses.h2` | How it works (heading for screen readers; the dark sentence is the section's visible header) | Cómo funciona |
| `uses.sell.h` | When a shop asks to pay later | Cuando un negocio te pide pagar después |
| `uses.sell.p` | **A shop orders from you and asks to pay later.** You send them the pay-later link, and you are paid today. | **Un negocio te hace un pedido y te pide pagar después.** Le mandas el link de pagar después, y tú cobras hoy. |
| `uses.buy.h` | When you buy | Cuando compras |
| `uses.buy.p` | **You order from your supplier as always.** The link arrives in the same chat. You agree to the terms once, and you pay later. | **Le pides a tu proveedor como siempre.** El link llega al mismo chat. Aceptas las condiciones una vez, y pagas después. |
| `uses.delivery.h` | On delivery | En la entrega |
| `uses.delivery.p` | **Your supplier hands you the invoice.** You photograph it and share it to Rocoto, and the pay-later answer comes straight back. | **Tu proveedor te entrega la factura.** La fotografías y la compartes a Rocoto, y la respuesta de pagar después llega al toque. |
| `steps.h2` | Three steps | Tres pasos |
| `steps.1.h` | Connect your WhatsApp | Conecta tu WhatsApp |
| `steps.1.p` | You use the same number, and your WhatsApp Business stays the same on your phone. | Usas tu mismo número, y tu WhatsApp Business sigue igual en tu celular. |
| `steps.2.h` | Choose your bank | Elige tu banco |
| `steps.2.p` | Once, from the banks on the list. | Una sola vez, entre los bancos de la lista. |
| `steps.3.h` | Sell and buy as always | Vende y compra como siempre |
| `steps.3.p` | Every order carries its link: Yape on the spot, or pay later with Rocoto. | Cada pedido lleva su link: Yape al momento, o pagar después con Rocoto. |
| `orders.h2` | Your orders, on your phone and on your computer | Tus pedidos, en tu celular y en tu computadora |
| `orders.p` | Every order that arrives on WhatsApp is written down, with its delivery note and its conversation. You prepare it from your phone and print it from your computer. | Cada pedido que llega por WhatsApp queda anotado, con su nota de entrega y su conversación. Lo preparas desde el celular y lo imprimes desde la computadora. |
| `orders.link` | See a delivery note | Mira una nota de entrega |
| `orders.foot` | Screens from the Rocoto app. | Pantallas de la app de Rocoto. |
| `orders.alt.desk` | The day's order open on the computer, with its lines and its delivery note. | El pedido del día abierto en la computadora, con sus líneas y su nota de entrega. |
| `orders.alt.phone` | The same order open on the phone. | El mismo pedido abierto en el celular. |
| `banks.h2` | Connect the account you already use | Conecta la cuenta que ya usas |
| `banks.p` | You choose your bank once. Rocoto writes every payment into your business. | Eliges tu banco una sola vez. Rocoto anota cada pago en tu negocio. |
| `banks.marks` | Each mark belongs to its own institution. Rocoto shows them so you find yours. | Las marcas pertenecen a cada entidad. Rocoto las muestra para que encuentres la tuya. |
| `banks.link` | How we look after your data | Cómo cuidamos tus datos |
| `banks.alt` | A fishmonger sends a voice note from his stall. | Un pescadero manda una nota de voz desde su puesto. |
| `who.h2` | Who it helps | A quién ayuda |
| `who.p` | You pay your supplier later, and Rocoto keeps the list of who owes you. | Le pagas a tu proveedor después, y Rocoto guarda la lista de quién te debe. |
| `who.bodega.h` | Bodegas | Bodegas |
| `who.bodega.p` | You give fiado to your neighbours, and you fill your shelves before school starts. | Fías a tus vecinos, y llenas tus estantes antes de que empiece el colegio. |
| `who.retail.h` | Retailers | Minoristas |
| `who.retail.p` | Your regulars pay you at the end of the week, and Fiestas Patrias empties your stock. | Tus caseros te pagan al final de la semana, y Fiestas Patrias te vacía el stock. |
| `who.whole.h` | Wholesalers | Mayoristas |
| `who.whole.p` | Your shops pay you after they sell, and December doubles what they order. | Tus tiendas te pagan después de vender, y en diciembre te piden el doble. |
| `who.alt.bodega` | A bodeguera behind her counter of packets and tins, her phone in her hand. | Una bodeguera detrás de su mostrador de paquetes y latas, con el celular en la mano. |
| `who.alt.retail` | A fishmonger and his customer hold up their phones over the counter of iced fish. | Un pescadero y su cliente levantan sus celulares sobre el mostrador de pescado en hielo. |
| `who.alt.whole` | A distributor hands a crate of produce to a shopkeeper at the door of her shop. | Un distribuidor le entrega una caja de verduras a una bodeguera en la puerta de su tienda. |
| `sales.h3` | Your Yape sales, written down | Tus ventas por Yape, anotadas |
| `sales.p` | Every Yape payment you receive lands in the same book as the rest of your day. | Cada pago por Yape que recibes queda en el mismo libro que el resto de tu día. |
| `sales.act` | See your sales page | Mira tu página de ventas |
| `sales.alt` | Neighbours at the counter of a bodega while the owner serves them. | Vecinos en el mostrador de una bodega mientras la dueña los atiende. |
| `owes.h2` | Who owes you | Quién te debe |
| `owes.p` | Rocoto writes down every fiado you give, with the day it started. | Rocoto anota cada fiado que das, con el día en que empezó. |
| `owes.line` (pattern) | 2 fiados · Since 28 Aug | 2 fiados · Desde el 28 de agosto |
| `owes.foot` | A sample book from the Rocoto app. | Un libro de ejemplo de la app de Rocoto. |
| `q.h2` | Questions | Preguntas |
| `q.lead` | Rocoto connects to the WhatsApp you already use. These are the questions a business settles before it starts. | Rocoto se conecta al WhatsApp que ya usas. Estas son las preguntas que un negocio resuelve antes de empezar. |
| `q.wab.q` | Do I need WhatsApp Business? | ¿Necesito WhatsApp Business? |
| `q.wab.a` | Yes. It is WhatsApp's free app for businesses. You move your number and your chats across in a few minutes, and Rocoto connects to that app. | Sí. Es la app gratuita de WhatsApp para negocios. Pasas tu número y tus chats en unos minutos, y Rocoto se conecta a esa app. |
| `q.connect.q` | How does Rocoto connect to my WhatsApp? | ¿Cómo se conecta Rocoto a mi WhatsApp? |
| `q.connect.a` | Rocoto connects through the official WhatsApp Business integration. Your app keeps working on your phone. | Rocoto se conecta con la integración de WhatsApp Business. Tu app sigue funcionando en tu celular. |
| `q.when.q` | When does pay later open? | ¿Cuándo abre pagar después? |
| `q.when.a` (law, verbatim) | Rocoto is preparing working-capital credit for businesses like yours, with a financial institution supervised by the SBS. Businesses that already use Rocoto go first, and each business you bring moves you up the list. | Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad financiera supervisada por la SBS. Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista. |
| `q.supplier.q` | Does my supplier have to use Rocoto? | ¿Mi proveedor tiene que usar Rocoto? |
| `q.supplier.a` | An invitation reaches them from your WhatsApp. Once they connect theirs, the payment link appears in your orders with them. | Le llega una invitación desde tu WhatsApp. Cuando conecta el suyo, el link de pago aparece en tus pedidos con él. |
| `q.reads.q` | What does Rocoto read from my WhatsApp? | ¿Qué lee Rocoto de mi WhatsApp? |
| `q.reads.a` | Your conversations from the last 6 months, one by one. Your groups stay aside and your broadcast lists move to read mode. | Tus conversaciones de los últimos 6 meses, una por una. Tus grupos quedan aparte y tus listas de difusión pasan a modo de lectura. |
| `q.yape.q` | Does it work with Yape? | ¿Funciona con Yape? |
| `q.yape.a` | Yes. Every sale can carry its payment link: your customer sees the exact amount and pays you from their Yape or their bank. | Sí. Cada venta puede llevar su link de pago: tu cliente ve el monto exacto y te paga desde su Yape o su banco. |
| `q.entity.q` | Is Rocoto a financial institution? | ¿Rocoto es una entidad financiera? |
| `q.entity.a` (law, verbatim) | *same as `q.when.a`* | *igual que `q.when.a`* |
| `q.sunat.q` | What does SUNAT see of my Yape payments? | ¿Qué ve la SUNAT de mis yapeos? |
| `q.sunat.a` (law, verbatim) | Your Yape money sits in a bank account, and the bank reports that account balance to SUNAT once it reaches S/ 38,500 in the month, which is 7 UIT in 2026. | Tu plata de Yape está en una cuenta del banco, y el banco le informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026. |
| `q.privacy` | Privacy policy | Política de privacidad |
| `close.h2` | Connect your WhatsApp | Conecta tu WhatsApp |
| `close.p` | It puts you on the waitlist, and your first three payments are free for you, the seller. You keep the same number and the same WhatsApp Business. | Entras a la lista de espera, y tus tres primeros cobros son gratis para ti, que vendes. Sigues con tu mismo número y tu mismo WhatsApp Business. |
| `close.act2` | Write to us | Escríbenos |
| `close.alt` | A customer pays with his phone at a market counter. | Un cliente paga con su celular en el mostrador de un puesto. |
| `footer.brand` | Rocoto for bodegas, market stalls and fish stalls in Peru. | Rocoto para bodegas, puestos de mercado y pescaderías en el Perú. |
| `footer.g.page` | On this page | En esta página |
| `footer.g.legal` | Legal | Legal |
| `footer.g.write` | Write to us | Escríbenos |
| `footer.l.how` | How it works | Cómo funciona |
| `footer.l.steps` | Three steps | Tres pasos |
| `footer.l.orders` | Your orders | Tus pedidos |
| `footer.l.banks` | Banks | Bancos |
| `footer.l.who` | Who it helps | A quién ayuda |
| `footer.l.sales` | Your Yape sales | Tus ventas por Yape |
| `footer.l.owes` | Who owes you | Quién te debe |
| `footer.l.questions` | Questions | Preguntas |
| `footer.l.privacy` | Privacy policy | Política de privacidad |
| `footer.l.cookies` | Cookies | Cookies |
| `footer.l.terms` | Terms | Términos |
| `footer.sbs` (law, verbatim) | Rocoto holds no authorisation or supervision from the Superintendencia de Banca, Seguros y AFP. | Rocoto no cuenta con autorización ni supervisión de la Superintendencia de Banca, Seguros y AFP. |
| `footer.marks` | WhatsApp is a trademark of Meta Platforms, Inc. Yape is a trademark of Credicorp. Every logo on this site belongs to the institution it identifies. | WhatsApp es una marca de Meta Platforms, Inc. Yape es una marca de Credicorp. Cada logo de este sitio pertenece a la entidad que identifica. |
| `footer.model` (licence, verbatim names) | 3D phone model by polyman, CC BY 4.0. | Modelo 3D del teléfono por polyman, CC BY 4.0. |
| `footer.copy` | © 2026 Rocoto. Rocoto is a product of Leo Casa Ltd. | © 2026 Rocoto. Rocoto es un producto de Leo Casa Ltd. |

## /peru/sales — SELLING, one of the site's two pages

Peter (SPEC §17e): *«This whole website is a buying and selling page. Super, super easy.»* · *«the
selling is gonna be the subpage as that's the feature we have until we are able to launch loans.»*
`/peru/fiados` is retired and its subject is the `s.soon.auto.*` block here.

The FIGURES on this page are not copy and are not translated: they are the prototype's own records
(`fixtures/cast-bodega.json` — `money.incoming30d`, `money.payables`, `prepDay.orders[3]`, `house`
— read through `money-overview.tsx`, `pay/link.tsx` and `paper/export.tsx`), printed in
`bodegaMoney()`'s grammar. What the table holds is the WORDS around them. `s.exp.sunat` is the same
fact as `q.sunat.a` and its Spanish is the byte-exact sentence `regulatory.ts` holds; changing
either column is a legal change, never a copy edit.

**`s.soon.auto.p` IS THE ONE PLACE «gratis» IS ALLOWED,** and it is said of the auto-collection
FEATURE, never of credit. Peter, 20 September: *«that's going to be free, by the way. I've decided
this part is going to be free: the auto collection.»* The early-bird offer's own rule stands
unchanged everywhere else (`pay-later-free-week-2026-09`): no «crédito gratis», no «sin intereses».

The product names inside the delivery note — `leche evaporada`, `azúcar rubia`, `gaseosa 3 L` —
stay Spanish in both columns. They are the trade's own words and the app's own catalogue rows.

| key | English (today) | Spanish (ships) |
|---|---|---|
| `s.head.title` | Rocoto \| Log your Yape sales | Rocoto \| Apunta tus ventas Yape |
| `s.head.desc` | A customer orders in your chat. Rocoto replies with your Yape link, and the sale is written down. | Un cliente te pide por tu chat. Rocoto le responde con tu link de Yape, y la venta queda anotada. |
| `s.head.og.alt` | Log your Yape sales. | Apunta tus ventas Yape. |
| `s.nav.buy` | Buying | Comprar |
| `s.nav.sell` | Selling | Vender |
| `s.chip` | Live today | Ya funciona |
| `s.h1` | Log your Yape sales | Apunta tus ventas Yape |
| `s.lead` | *same as `s.head.desc`* | *igual que `s.head.desc`* |
| `s.act2` | See the whole roadmap | Mira todo lo que viene |
| `s.hero.alt` | A bodega owner points at a code card on her counter while a customer holds up his phone to it. | Una bodeguera señala una tarjeta con un código en su mostrador mientras un cliente le acerca su celular. |
| `s.how.h2` | How selling works | Cómo funciona vender |
| `s.how.p` | Your customer pays from your chat, and Rocoto writes the sale down for you. | Tu cliente paga desde tu chat, y Rocoto anota la venta por ti. |
| `s.how.1.h` | A customer orders in your chat | Un cliente te pide por tu chat |
| `s.how.1.p` | They write to you the way they always do. | Te escribe como siempre. |
| `s.how.2.h` | Rocoto replies with your Yape link | Rocoto responde con tu link de Yape |
| `s.how.2.p` | It answers by itself, in that same chat. | Responde solo, en ese mismo chat. |
| `s.how.3.h` | Your customer opens the link and pays | Tu cliente abre el link y paga |
| `s.how.3.p` | It shows them what they ordered and the amount, and takes them to Yape with it. | Ahí ve lo que pidió y el monto, y pasa a Yape con ese monto. |
| `s.how.4.h` | The sale is written down | La venta queda anotada |
| `s.how.4.p` | It lands in your business the moment they pay. | Entra a tu negocio apenas te pagan. |
| `s.phone.note` | Your chat · simulated conversation | Tu chat · conversación simulada |
| `s.phone.alt` | A sale coming in on your chat, and your Yape link going back to the customer. | Una venta que entra a tu chat, y tu link de Yape que sale de vuelta al cliente. |
| `s.pay.h3` | What your customer opens | Lo que abre tu cliente |
| `s.pay.p` | The link opens the order as your delivery note, with the amount and the way to pay it. | El link abre el pedido como tu nota de entrega, con el monto y la forma de pagarlo. |
| `s.pay.desc` | Your order of Saturday | Tu pedido del sábado |
| `s.pay.ref` (pattern) | Reference BODEGA-4K9M2X7T | Referencia BODEGA-4K9M2X7T |
| `s.pay.now` | Pay now | Pagar ahora |
| `s.pay.send` | Send S/ 186.00 to that number from Yape or Plin, and write the reference above. | Envía S/ 186.00 a ese número desde Yape o Plin, y escribe la referencia de arriba. |
| `s.pay.copy` | Copy the amount | Copia el monto |
| `s.pay.open` | Open Yape | Abre Yape |
| `s.pay.foot` | A screen from the Rocoto app, with a sample sale. | Una pantalla de la app de Rocoto, con una venta de ejemplo. |
| `s.hist.h2` | Every purchase and every sale | Cada compra y cada venta |
| `s.hist.p` | Your buying and your selling sit in one app, and each row says what has been paid. | Tus compras y tus ventas están en una sola app, y cada fila dice lo que ya está pagado. |
| `s.money.card` | Money in | Dinero que entra |
| `s.money.window` | Sample money · 20 Aug to 18 Sep | Dinero de ejemplo · 20 ago a 18 set |
| `s.money.yape` | Yape · 812 payments | Yape · 812 pagos |
| `s.money.plin` | Plin · 234 payments | Plin · 234 pagos |
| `s.money.counter` | Counter | Mostrador |
| `s.owe.card` | What you owe suppliers | Lo que les debes a tus proveedores |
| `s.owe.window` | 4 purchases to pay · 1 late | 4 compras por pagar · 1 atrasada |
| `s.owe.due` (pattern) | Due 23 Sep | Vence el 23 de set |
| `s.owe.late` (pattern) | Late · 1 day | Atrasada · 1 día |
| `s.owe.settled` | Settled | Pagadas |
| `s.owe.settled.line` (pattern) | Settled 12 Sep · confirmed by your bank | Pagada el 12 de set · confirmada por tu banco |
| `s.hist.foot` | Screens from the Rocoto app, with sample money. | Pantallas de la app de Rocoto, con dinero de ejemplo. |
| `s.exp.h2` | The export for an inspection | La exportación para una fiscalización |
| `s.exp.p` | If SUNAT asks for the detail of your Yape payments, you hand over one file. | Si la SUNAT te pide el detalle de tus pagos por Yape, entregas un solo archivo. |
| `s.exp.title` | Sales export | Exportar ventas |
| `s.exp.period` | 20 Jun to 18 Sep | 20 jun a 18 set |
| `s.exp.facts` | 90 days · 915 sales · 18 customers | 90 días · 915 ventas · 18 clientes |
| `s.exp.tx.h` | By transaction | Por transacción |
| `s.exp.tx.p` | One row per sale, with what it was for and how it was paid. | Una fila por venta, con para qué fue y cómo se pagó. |
| `s.exp.cu.h` | By customer | Por cliente |
| `s.exp.cu.p` | One row per person, with what they take and what they owe. | Una fila por persona, con lo que lleva y lo que debe. |
| `s.exp.go` | Export | Exportar |
| `s.exp.sunat` (law, verbatim) | Your Yape money sits in a bank account, and the bank reports that account balance to SUNAT once it reaches S/ 38,500 in the month, which is 7 UIT in 2026. | Tu plata de Yape está en una cuenta del banco, y el banco le informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026. |
| `s.exp.foot` | A screen from the Rocoto app. You export it as a PDF or a spreadsheet, and it is yours to keep. | Una pantalla de la app de Rocoto. Lo exportas en PDF o en hoja de cálculo, y es tuyo. |
| `s.soon.h2` | What's coming | Lo que viene |
| `s.soon.tag` | soon | pronto |
| `s.soon.auto.h` | Auto-collect with Yape | Cobro automático con Yape |
| `s.soon.auto.p` | When you give credit to another business, what you are owed collects itself through their Yape. Auto-collecting is free. | Cuando le fías a otro negocio, lo que te deben se cobra solo desde su Yape. El cobro automático es gratis. |
| `s.soon.rec.h` | Digital receipts | Boleta digital |
| `s.soon.rec.p` | The receipt for a sale goes out from the same chat, the moment you're paid. | La boleta de una venta sale del mismo chat, apenas te pagan. |
| `s.close.h2` | Join the waitlist | Únete a la lista |
| `s.close.p` | *same as `close.p` on the main page* | *igual que `close.p` de la página principal* |
| `s.close.alt` | *same as `close.alt`* | *igual que `close.alt`* |
| `s.ft.buy` | Buying | Comprar |
| `s.ft.marks` | WhatsApp is a trademark of Meta Platforms, Inc. Yape is a trademark of Credicorp. Plin is a trademark of the banks that run it. Every logo on this site belongs to the institution it identifies. | WhatsApp es marca de Meta Platforms, Inc. Yape es marca de Credicorp. Plin es marca de los bancos que lo operan. Cada logo de este sitio pertenece a la institución que identifica. |

**Keys that left with the page they served.** `s.money.h2`, `s.money.p` and `s.money.foot` are now
`s.hist.*`, because the card stands inside «Every purchase and every sale» rather than in a band of
its own. `s.boleta.*` are `s.soon.rec.*`. `s.back` and `s.close.act2` are gone: the nav carries
Buying and Selling, and the second act is `s.act2`. Every `f.*` key of `/peru/fiados` is gone with
the file; the only one of its subjects the site still states is `s.soon.auto.*`, which says what is
known and prints no fee, rate, term or amount.

## The phones' own words (`peru/demos/`, `peru/wa/`)

The four demos carry their own `en` / `es` tables and read `?lang=`, so this table is the record
rather than the source. Every line obeys the same laws, and the credit-advertising rules bind them
hardest: a purchase total inside a simulated chat is the price of an order and is allowed; a rate, a
term, a date it is owed by, an amount of credit and any approval word are absent.

**The confirmation travels as a LINK** (SPEC 17c). The message is the address; above it stands
WhatsApp's own preview, and the preview's picture is Rocoto's confirmation, drawn by the kit
(`wa.js`, `cardHTML(c, wide)`). The same drawing, without its tick, is the preview of the selling
link, where it states the order and its total.

| key | English (today) | Spanish (ships) |
|---|---|---|
| `card.mark` | Rocoto | Rocoto |
| `card.lead` | Funds sent | Pago enviado |
| `card.figure` | S/ 386.00 (the unit shares the number's line) | S/ 386.00 |
| `card.who` | *the supplier's own name* — Distribuidora Ricardo | *igual* |
| `prev.title` | Funds sent to Distribuidora Ricardo | Pago enviado a Distribuidora Ricardo |
| `prev.host` | soyrocoto.com | soyrocoto.com |
| `prev.url` | soyrocoto.com/p/5409-118 | soyrocoto.com/p/5409-118 |

**When you buy** (`demos/compras.html`), the buyer's own chat with Distribuidora Ricardo. The
thread opens empty; four orders cycle, each with its own goods, total and reference.

| key | English (today) | Spanish (ships) |
|---|---|---|
| `buy.ask` | Hi Ricardo, for tomorrow: 12 boxes of rice, 6 oil, 20 evaporated milk and 6 detergent. | Hola Ricardo, para mañana: 12 cajas de arroz, 6 aceite, 20 leche evaporada y 6 detergente. |
| `buy.reply` | Done, casero 👍 That comes to S/ 386.00. | Listo, casero 👍 Son S/ 386.00. |
| `buy.pay` | I’ll pay it later with Rocoto 👍 | Lo pago después con Rocoto 👍 |
| `buy.thanks` | Got the funds, thanks! 🙌 | ¡Ya me llegó, gracias! 🙌 |
| `buy.eta` | Your order goes out tomorrow. It is with you at 6. | Tu pedido sale mañana. A las 6 lo tienes. |

**When it is time to pay** (`demos/cobro.html`), Rocoto's own notification and the purchase it
opens. The day is named the way the notification names it, and no date is printed.

| key | English (today) | Spanish (ships) |
|---|---|---|
| `pay.note.t` | Rocoto | Rocoto |
| `pay.note.b` | Your purchase from Distribuidora Ricardo was collected from your Yape today. | Tu compra a Distribuidora Ricardo se cobró de tu Yape hoy. |
| `pay.full` | Paid in full | Pagado completo |
| `pay.taken` | Collected from your Yape today. | Cobrado de tu Yape hoy. |

**The Rocoto app on delivery** (`demos/pages.js`, `WA_PAGES.purchase`): its camera, and the purchase
it reads off the paper, set as our delivery notes are set. `WA_PAGES.collected` draws that same
document for the row above.

| key | English (today) | Spanish (ships) |
|---|---|---|
| `app.new` | New purchase | Nueva compra |
| `app.frame` | Hold the invoice in the frame. | Pon la factura dentro del marco. |
| `app.reading` | Reading the invoice… | Leyendo la factura… |
| `app.bar` | Purchase | Compra |
| `app.read` | Read from your photo | Leído de tu foto |
| `app.total` | Total | Total |
| `app.lines` | 4 lines | 4 líneas |
| `app.later` | Pay later | Pagar después |
| `app.paid` | Distribuidora Ricardo is paid today. | Distribuidora Ricardo cobra hoy. |
| `app.collect` | Rocoto collects it automatically on the agreed day. | Rocoto lo cobra automáticamente el día acordado. |

**When you sell** (`demos/tienda.html`, the selling page's demo): a customer's order, the answer
Rocoto sends for the shop, and the page that customer opens (`demos/pages.js`, `WA_PAGES.pay`, off
the prototype's `pay/link.tsx`).

| key | English (today) | Spanish (ships) |
|---|---|---|
| `sell.ask` | Morning Yesenia. Send me 1 sack of rice, 2 oil and 30 eggs. | Buen día Yesenia. Mándame 1 saco de arroz, 2 aceite y 30 huevos. |
| `sell.by` | Sent by Rocoto | Enviado por Rocoto |
| `sell.reply` | Your order comes to S/ 78.50. Pay here: | Tu pedido es S/ 78.50. Paga acá: |
| `sell.prev.lead` | Your order | Tu pedido |
| `sell.prev.title` | Pay Bodega Yesenia | Paga a Bodega Yesenia |
| `sell.paid` | Paid it, Yesenia 🙌 | Ya te pagué, Yesenia 🙌 |
| `sell.noted` | Rosa menú paid S/ 78.50 · noted with today’s sales | Rosa menú pagó S/ 78.50 · apuntado con las ventas de hoy |
| `pg.from` | From your chat | De tu chat |
| `pg.now` | Pay now | Pagar ahora |
| `pg.with` | Pay with Yape or Plin | Paga con Yape o Plin |
| `pg.send` | Send S/ 78.50 to this number. | Envía S/ 78.50 a este número. |
| `pg.copy` | Copy the amount | Copiar el monto |
| `pg.open` | Open Yape | Abrir Yape |
| `pg.first` | Copy the amount and Open Yape comes live. | Copia el monto y se activa Abrir Yape. |
| `pg.clip` | S/ 78.50 is on your clipboard. Paste it into Yape. | S/ 78.50 está en tu portapapeles. Pégalo en Yape. |

⚠ The photographed invoice (`demos/av/invoice-counter.webp`) is printed in ENGLISH, which is today's
review language. When Spanish ships, the paper is re-shot in Spanish from
`scratchpad/landing/delivery/shoot_invoice.py`, keeping its day (19/09/2026) and its number
(E001-004812), because the app reads those two back off the paper.

## Names, money and marks — the same in both columns

People and places keep their names: **Bodega Yesenia**, **Distribuidora Ricardo**, **Lácteos del
Valle**, **Iván gaseosas**, **Rosa menú**. Money stays in soles
(`S/ 540.00`). **Bodega** stays *bodega* in English: it is what the shop is called, and «corner
shop» is a different shop. The bank names, **WhatsApp**, **Yape**, **SBS** and **SUNAT** are the
same word in both columns.

## What the page drops when it goes back to Spanish

Nothing. The two ⚠ rows are the only keys whose columns say different things, and both differ
because the Spanish page needs a sentence about the product's screens being in English that an
English page has no reason to say.
