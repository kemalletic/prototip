# NIT, prototip (faza 1)

Premium web shop za odjeću: farmerke, jakne, džemperi, majice, trenerke, prsluci, pantalone i kaiševi, za BiH i region.
Koncept "NIT": jedna indigo nit prolazi kroz cijeli sajt (loader, kursor, etikete, korpa), a kolekcija visi na šini u mračnoj galeriji.

## Pokretanje

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
```

## Šta je u fazi 1

- **Hero sa živom tkaninom**: komad denima simuliran u stvarnom vremenu (verlet fizika). Kursor ga gura, a na telefonu ga pomjera naginjanje.
- **Šina**: scroll vodi kameru duž šipke s vješalicama, komadi se njišu, a filter kategorija ih skida ili vraća na šinu.
- **Stranica proizvoda**: komad se skine s vješalice i dođe pred kameru, šina se razmakne, a kupac ga okreće prevlačenjem. Ima lupu za tkaninu i tačke s detaljima.
- **Patent "Dodaj u korpu"** (klik ili povlačenje, zvuk i vibracija) i **korpa sa zavjesom**.
- **Svjetlo prema dobu dana** posjetioca, **cijene po regiji** (KM, RSD, EUR).
- **Lagana verzija** bez 3D-a za slabe uređaje i "smanjene pokrete".

Svi komadi su privremeni i crtaju se proceduralno u pregledniku (`apps/web/lib/garments`). U fazi 2 ih zamjenjuju prave fotografije, iz kojih pipeline pravi istu kartu boje i visine.

## Parametri za testiranje

- `?verzija=lagana` ili `?verzija=puna` forsira verziju sajta
- `?sat=21` simulira doba dana (jutro, dan, veče, noć)

## Struktura

```
apps/web
  app/                 stranice (početna, /proizvod/[slug])
  components/canvas/   3D scena: kamera, svjetla, šina, tkanina, vješalice
  components/          zaglavlje, loader, korpa, patent, lupa, nit-kursor
  lib/garments/        proceduralne tkanine, krojevi, normal mape
  lib/                 katalog, regije, stanje, doba dana
```
