import React from "react";

function About() {
  return (
    <div className="container">
      <div className="about">
        <header className="about-hero container">
          <h1 className="main-title">Hakkında</h1>
          <p className="about-lead">
            Lebbverse, tek kullanıcılı bir veri çalışma alanıdır. CSV yükle → ön işle → görselleştir → modelini eğit ve sonuçları dışa aktar.
            Amaç: Veri bilimi akışını <strong>hızlı</strong>, <strong>tekrarlanabilir</strong> ve <strong>öğretici</strong> kılmak.
          </p>
        </header>

        <section className="about-grid container">
          <article className="about-card">
            <div className="about-icon" aria-hidden="true">
              {/* upload icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3>Uçtan Uca Akış</h3>
            <p>Yükleme, ön işleme, görselleştirme ve modelleme tek ekranda akış şeklinde ilerler.</p>
          </article>

          <article className="about-card">
            <div className="about-icon" aria-hidden="true">
              {/* shield icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3>Yerel ve Basit</h3>
            <p>Kimlik gerektirmez. Tek kullanıcı için tasarlanmış demo platformu.</p>
          </article>

          <article className="about-card">
            <div className="about-icon" aria-hidden="true">
              {/* spark icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2v6M12 16v6M4 12h6M14 12h6M6.5 6.5l4.2 4.2M13.3 13.3l4.2 4.2M17.5 6.5l-4.2 4.2M10.5 13.3l-4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3>Öğrenmeye Odaklı</h3>
            <p>Adım adım açıklamalar ve öntanımlı ayarlar ile hızlı başlangıç.</p>
          </article>
        </section>

        <section className="about-stack container">
          <h4 className="section-title">Teknoloji Yığını</h4>
          <ul className="badge-list">
            <li className="badge">React</li>
            <li className="badge">Flask</li>
            <li className="badge">pandas</li>
            <li className="badge">scikit-learn</li>
            <li className="badge">matplotlib</li>
            <li className="badge">seaborn</li>
          </ul>
        </section>

        <section className="about-stats container">
          <div className="kpi">
            <span className="kpi-top">3</span>
            <span className="kpi-bottom">Modül</span>
          </div>
          <div className="kpi">
            <span className="kpi-top">10+</span>
            <span className="kpi-bottom">Grafik</span>
          </div>
          <div className="kpi">
            <span className="kpi-top">5+</span>
            <span className="kpi-bottom">Model</span>
          </div>
        </section>

        <section className="about-cta container">
          <div className="about-cta-box">
            <h4>Hızlı Başlangıç</h4>
            <p>CSV dosyanı yükle ve modüllere girerek akışı başlat.</p>
            <a href="/modules" className="landing-button">Modüllere Git</a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
