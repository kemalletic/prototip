export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <p className="display text-[44px] md:text-[64px]">NIT</p>
        <p className="mt-3 max-w-[38ch] text-kost-2">
          Dostava u Bosnu i Hercegovinu, Srbiju, Hrvatsku i Crnu Goru. Plaćanje pouzećem ili karticom.
        </p>
      </div>
      <dl className="site-footer__facts">
        <div>
          <dt>Dostava</dt>
          <dd>Dva do četiri radna dana</dd>
        </div>
        <div>
          <dt>Povrat</dt>
          <dd>Četrnaest dana, bez pitanja</dd>
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
