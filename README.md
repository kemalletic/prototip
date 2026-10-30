# NIT, prototip (faza 1)

Premium web shop za odjeću: farmerke, jakne, džemperi, majice, trenerke, prsluci, pantalone i kaiševi, za BiH i region.
Koncept: **butik koji postoji samo online**. Kupac stoji ispred izloga, uđe kroz vrata i prošeta kroz radnju u stilu "topli loft"
(kreč, hrast, travertin, crni čelik). Indigo nit je potpis brenda: loader, kursor, etikete, zavjesa kabine.

## Pokretanje

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
```

## Šta je u fazi 1

- **Izlog (hero)**: denim u izlogu simuliran u stvarnom vremenu (verlet fizika). Kursor ga gura, a na telefonu ga pomjera naginjanje.
- **Šetnja kroz butik**: scroll vodi kameru kroz vrata i zone: sto s majicama, zid s jaknama i prslucima, police s farmerkama i pantalonama,
  kaiševi, džemperi i trenerke, kabina. Filter kategorija i mini tlocrt vode do zone. Raspored je u `apps/web/lib/boutique.ts`.
- **Svjetlo prema dobu dana**: sunce kroz izlog danju, zalazak uveče, a noću butik svijetli iznutra i natpis sija.
- **Stranica proizvoda**: komad se skine s vješalice i dođe pred kameru, šina se razmakne, a kupac ga okreće prevlačenjem. Ima lupu za tkaninu i tačke s detaljima.
- **Patent "Dodaj u korpu"** (klik ili povlačenje, zvuk i vibracija) i **korpa sa zavjesom**.
- **Cijene po regiji** (KM, RSD, EUR) i **mreža** svih komada za brzu kupovinu.
- **Lagana verzija** bez 3D-a za slabe uređaje i "smanjene pokrete".

Svi komadi su privremeni i crtaju se proceduralno u pregledniku (`apps/web/lib/garments`). U fazi 2 ih zamjenjuju prave fotografije, iz kojih pipeline pravi istu kartu boje i visine.

## Parametri za testiranje

- `?verzija=lagana` ili `?verzija=puna` forsira verziju sajta
- `?sat=21` simulira doba dana (jutro, dan, veče, noć)

## Struktura

```
apps/web
  app/                 stranice (početna, /proizvod/[slug])
  components/canvas/   3D scena: butik, kamera, svjetla, šine, složeni komadi, tkanina
  components/          zaglavlje, loader, korpa, patent, lupa, nit-kursor
  lib/garments/        proceduralne tkanine, krojevi, normal mape
  lib/                 katalog, raspored butika, regije, stanje, doba dana
```
