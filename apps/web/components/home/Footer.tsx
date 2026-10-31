"use client";

import { useEffect, useState } from "react";
import { Patch, Selvedge, Wordmark } from "../brand/Wordmark";
import { DropCountdown } from "./DropCountdown";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setDone(localStorage.getItem("nit-drop02") === "1");
    } catch {
      /* privatni prozor */
    }
  }, []);

  return (
    <footer className="site-footer">
      <Selvedge className="site-footer__edge" />
      <div className="site-footer__brand">
        <Wordmark className="site-footer__mark" />
        <p className="display site-footer__claim">Sve počinje od tkanine.</p>
        <Patch>Drop 01, jesen 2026</Patch>
      </div>
      <form
        className="drop-signup"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.includes("@")) return;
          setDone(true);
          try {
            localStorage.setItem("nit-drop02", "1");
          } catch {
            /* privatni prozor */
          }
        }}
      >
        <h2 className="drop-signup__title">Javi mi za Drop 02</h2>
        <DropCountdown />
        {done ? (
          <p className="drop-signup__ok" role="status">
            Prijavljen si. Javljamo se dan prije dropa.
          </p>
        ) : (
          <div className="drop-signup__row">
            <label className="sr-only" htmlFor="drop-email">
              E-mail adresa
            </label>
            <input id="drop-email" type="email" required placeholder="tvoj@email.ba" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="btn-solid">
              Prijavi me
            </button>
          </div>
        )}
        <p className="drop-signup__note">Prototip: adresa se još ne šalje nigdje.</p>
      </form>
      <dl className="site-footer__facts">
        <div>
          <dt>Dostava</dt>
          <dd>BiH 2 dana, region 3 do 4</dd>
        </div>
        <div>
          <dt>Povrat</dt>
          <dd>14 dana, besplatno</dd>
        </div>
        <div>
          <dt>Plaćanje</dt>
          <dd>Pouzećem ili karticom</dd>
        </div>
        <div>
          <dt>Kontakt</dt>
          <dd>Instagram i e-mail, uskoro</dd>
        </div>
      </dl>
      <p className="site-footer__note">Prototip, faza 1. Ime brenda, komadi i cijene su privremeni.</p>
    </footer>
  );
}
