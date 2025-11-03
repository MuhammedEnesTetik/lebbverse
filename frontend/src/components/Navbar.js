import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import brandMark from "../assets/brand/lebbverse-logo.svg"; // <- SVG logo

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar-left">
        <Link to="/" className="nav-logo" aria-label="lebbverse anasayfa">
          {/* SVG varsa göster; yoksa sadece yazı çalışır */}
          <img className="nav-brand-mark" src={brandMark} alt="" />
          <span className="nav-brand-text">lebbverse</span>
        </Link>
      </div>

      <div className="navbar-right">
        <Link to="/">Ana Sayfa</Link>
        <Link to="/modules">Modüller</Link>
        <Link to="/about">Hakkında</Link>
      </div>
    </nav>
  );
}

export default Navbar;
