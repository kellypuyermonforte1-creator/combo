import React, { useState, useEffect, useRef } from 'react';
import { trackEvent } from '../services/api.ts';

interface ProductPageProps {
  onNavigateToCheckout: () => void;
  onOpenAdmin: () => void;
}

const IMAGES = [
  '/images/kitchen-combo1.png',
  '/images/kitchen-combo2.png',
  '/images/kitchen-combo3.png',
  '/images/kitchen-combo4.png'
];

export default function ProductPage({ onNavigateToCheckout, onOpenAdmin }: ProductPageProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDescCollapsed, setIsDescCollapsed] = useState(true);
  const [isPiModalOpen, setIsPiModalOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  
  // Daily deal timer (rolling countdown)
  const [dealTime, setDealTime] = useState('08:42:17');
  const [deadlineText, setDeadlineText] = useState('Order within 7h 35m for delivery tomorrow');
  const [demandCount, setDemandCount] = useState(54);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const touchStartX = useRef<number>(0);

  // Track ViewContent on load
  useEffect(() => {
    trackEvent('ViewContent', '/');
  }, []);

  // Rolling countdown timer
  useEffect(() => {
    const seed = new Date();
    const dayMin = seed.getHours() * 60 + seed.getMinutes();
    const win = 150 + (dayMin % 30);
    const elapsed = dayMin % win;
    let totalSecs = Math.max(0, (win - elapsed) * 60 - seed.getSeconds());

    const pad = (n: number) => String(n).padStart(2, '0');

    const tick = () => {
      if (totalSecs <= 0) {
        totalSecs = (150 + Math.floor(Math.random() * 30)) * 60;
      }
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setDealTime(`${pad(h)}:${pad(m)}:${pad(s)}`);

      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}m`);
      setDeadlineText(`Order within ${parts.join(' ')} for delivery tomorrow`);
      totalSecs--;
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live demand counter fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setDemandCount((prev) => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        return Math.max(42, Math.min(75, prev + delta));
      });
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // Prevent background scrolling when modals/drawer are open
  useEffect(() => {
    if (isPiModalOpen || isReviewsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPiModalOpen, isReviewsOpen]);

  // Touch swipe handling on hero image
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) {
        // Next image
        setActiveImageIndex((prev) => (prev + 1) % IMAGES.length);
      } else {
        // Prev image
        setActiveImageIndex((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);
      }
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackEvent('AddToCart', '/');
    onNavigateToCheckout();
  };

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased selection:bg-blue-100">
      {/* DAILY DEAL STRIP */}
      <div className="dd-strip">
        <svg
          className="dd-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <span className="dd-label">Daily Deal - ends in</span>
        <span className="dd-timer" id="ddTimer">
          {dealTime}
        </span>
      </div>

      {/* TOPBAR */}
      <header className="topbar" aria-label="Top Bar">
        <div className="topbar__left">
          <button className="icon-btn" aria-label="Menu" type="button">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        <div className="topbar__center" aria-label="Takealot logo">
          <img src="/images/logo-takealot.svg" alt="takealot.com" className="logo-img" />
        </div>
        <div className="topbar__right">
          <button className="icon-btn" aria-label="Search" type="button">
            <svg
              className="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M20 20l-3.2-3.2"></path>
            </svg>
          </button>
          <button className="icon-btn" aria-label="Cart" onClick={handleAddToCartClick} type="button">
            <svg
              className="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6h15l-2 9H7L6 6Z"></path>
              <path d="M6 6l-2-2H2"></path>
              <circle cx="9" cy="20" r="1"></circle>
              <circle cx="18" cy="20" r="1"></circle>
            </svg>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT WRAP */}
      <div className="wrap">
        {/* HERO IMAGE SECTION */}
        <section className="hero" aria-label="Product hero">
          <div
            className="hero__imgbox"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              id="productImage"
              className="hero__img transition-opacity duration-200"
              src={IMAGES[activeImageIndex]}
              alt="Defy 30L Microwave + Russell Hobbs 6.5L Air Fryer + Mellerware Glass Kettle"
            />
            <div className="badge-off" aria-label="Discount badge">
              UP TO 65%
              <span>OFF</span>
            </div>
            <button
              className="btn-expand"
              id="expandBtn"
              aria-label="Expand image"
              onClick={() => setIsImageModalOpen(true)}
              type="button"
            >
              <svg
                className="expand-ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3H3v6"></path>
                <path d="M15 21h6v-6"></path>
                <path d="M21 9V3h-6"></path>
                <path d="M3 15v6h6"></path>
              </svg>
            </button>
          </div>

          {/* CAROUSEL DOTS */}
          <div className="dots" aria-label="Image carousel indicators">
            {IMAGES.map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === activeImageIndex ? 'is-active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`Image ${idx + 1}`}
                type="button"
              ></button>
            ))}
          </div>
        </section>

        {/* INFO SECTION */}
        <section className="info" aria-label="Product info">
          <div className="title-row">
            <h1 className="title">
              Defy 30L Microwave + Russell Hobbs 6.5L Air Fryer + Mellerware Glass Kettle
            </h1>
            <button
              className="share-btn"
              aria-label="Share"
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: document.title,
                    url: window.location.href
                  }).catch(() => {});
                }
              }}
            >
              <svg
                className="share-ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="2"></circle>
                <circle cx="6" cy="12" r="2"></circle>
                <circle cx="18" cy="19" r="2"></circle>
                <path d="M8 12l8-6"></path>
                <path d="M8 12l8 6"></path>
              </svg>
            </button>
          </div>

          <p className="subtitle">Defy &middot; Russell Hobbs &middot; Mellerware</p>

          <div className="demand-line">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span id="demandText">
              In high demand - <strong>{demandCount} people</strong> have this in their cart
            </span>
          </div>

          <div className="rating" aria-label="Rating and reviews">
            <svg className="star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.76 1.64 7.03z"></path>
            </svg>
            <strong>4.6</strong>
            <button
              className="reviews-link text-left bg-transparent border-0 p-0 underline cursor-pointer"
              onClick={() => setIsReviewsOpen(true)}
              type="button"
            >
              3564 Reviews
            </button>
            <span className="sold-count">1,200+ sold</span>
          </div>
        </section>
      </div>

      {/* SINGLE PRICE SECTION */}
      <section className="single-price" aria-label="Price and delivery">
        <div className="price-row">
          <div className="price-left">
            <div className="main-price">
              <span className="currency">R</span>
              <span className="price">599</span>
            </div>
            <div className="was-price">
              <span className="was">R1,697</span>
              <span className="save-pill">You save R1,098</span>
            </div>
            <div className="installment">
              or <strong>R49/mo</strong> x 12 with takealot.credit
            </div>
            <div className="est-delivery">
              <span className="muted">Estimated Delivery</span>
              <span className="pill">CPT</span>
              <span className="pill">DBN</span>
              <span className="pill">JHB</span>
            </div>
            <div className="delivery-inline">
              <span className="delivery-range" id="singleDeliveryRange">
                Get It Tomorrow!
              </span>
              <div className="delivery-deadline" id="deliveryDeadline">
                Order within <strong>{deadlineText.replace('Order within ', '').replace(' for delivery tomorrow', '')}</strong> for delivery tomorrow
              </div>
              <a className="tcs" href="#tcs" onClick={(e) => e.preventDefault()}>
                T&Cs Apply
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LOW STOCK BADGE */}
      <div className="low-stock">Only 4 left at this price</div>

      {/* TAKEALOTMORE & REWARDS */}
      <section className="takealotmore">
        <div className="takealotmore-box">
          <span className="takealotmore-text">
            FREE DELIVERY WITH <strong>TAKEALOTMORE</strong>
          </span>
        </div>

        <div className="card credit-card" aria-label="takealot credit">
          <div className="credit-brand">
            <span className="credit-takealot">takealot</span>
            <span className="credit-dot">.</span>
            <span className="credit-credit">credit</span>
          </div>
          <p className="credit-text">
            Buy using <strong>takealot.credit</strong> for <strong>R 49</strong> p/m x{' '}
            <strong>12</strong>
            <br />
            months and get <strong>1%</strong> of your purchase back*.
          </p>
          <div className="credit-more">
            <div className="credit-more-inner">
              Get 3% with <span className="credit-more-logo">takealot<span>more</span></span>
            </div>
            <a className="credit-options" href="#credit" onClick={(e) => e.preventDefault()}>
              More Credit Options
            </a>
          </div>
        </div>

        <div className="card reward-row" aria-label="eBucks">
          <div className="reward-left">
            <div className="reward-badge eb">eB</div>
            <div className="reward-name">
              <span className="reward-name-accent">e</span>Bucks
            </div>
          </div>
          <div className="reward-value">eB10,990</div>
        </div>

        <div className="card reward-row" aria-label="Discovery Miles">
          <div className="reward-left">
            <div className="reward-d">D</div>
            <div className="reward-name miles">
              <span className="miles-top">Discovery</span>
              <span className="miles-bottom">MILES</span>
            </div>
          </div>
          <div className="reward-value">10,990</div>
        </div>
      </section>

      {/* STOCK & DELIVERY TRUST LIST */}
      <section className="ta-stock" aria-label="Stock and delivery information">
        <div className="ta-stock__head">
          <div className="ta-stock__title">In stock</div>
          <div className="ta-stock__pills" aria-label="Regions">
            <span className="ta-pill">CPT</span>
            <span className="ta-pill">DBN</span>
            <span className="ta-pill">JHB</span>
          </div>
          <a className="ta-stock__link" href="#learn-more" onClick={(e) => e.preventDefault()}>
            Learn More
          </a>
        </div>
        <ul className="ta-stock__list">
          <li className="ta-stock__row">
            <span className="ta-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.76 1.64 7.03z"></path>
              </svg>
            </span>
            <span className="ta-stock__text">Eligible for next-day delivery or collection.</span>
            <button className="ta-info" type="button" aria-label="More info">
              <span>i</span>
            </button>
          </li>
          <li className="ta-stock__row">
            <span className="ta-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="10" rx="2"></rect>
                <circle cx="12" cy="12" r="2.2"></circle>
                <path d="M6.5 9.5h0M17.5 14.5h0"></path>
              </svg>
            </span>
            <span className="ta-stock__text">Eligible for Cash on Delivery.</span>
            <button className="ta-info" type="button" aria-label="More info">
              <span>i</span>
            </button>
          </li>
          <li className="ta-stock__row">
            <span className="ta-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 7h11v10H3z"></path>
                <path d="M14 10h4l3 3v4h-7z"></path>
                <circle cx="7" cy="19" r="1.4"></circle>
                <circle cx="18" cy="19" r="1.4"></circle>
              </svg>
            </span>
            <span className="ta-stock__text">Free Delivery Available.</span>
            <button className="ta-info" type="button" aria-label="More info">
              <span>i</span>
            </button>
          </li>
          <li className="ta-stock__row">
            <span className="ta-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 0 1 15-6"></path>
                <path d="M18 6v6h-6"></path>
                <path d="M21 12a9 9 0 0 1-15 6"></path>
                <path d="M6 18v-6h6"></path>
              </svg>
            </span>
            <span className="ta-stock__text">Hassle-Free Exchanges & Returns for 30 Days.</span>
            <button className="ta-info" type="button" aria-label="More info">
              <span>i</span>
            </button>
          </li>
          <li className="ta-stock__row ta-stock__row--last">
            <span className="ta-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                <path d="M8 3v4M16 3v4"></path>
                <path d="M3 10h18"></path>
              </svg>
            </span>
            <span className="ta-stock__text">6-Month Limited Warranty.</span>
            <button className="ta-info" type="button" aria-label="More info">
              <span>i</span>
            </button>
          </li>
        </ul>
      </section>

      {/* DESCRIPTION SECTION */}
      <section className="desc-section" aria-label="Description">
        <h2 className="desc-title">Description</h2>
        <div className={`desc-box ${isDescCollapsed ? 'is-collapsed' : ''}`} id="descBox">
          <div className="desc-content" id="descContent">
            <p>
              Upgrade your kitchen with this ultimate 3-in-1 appliance combo. The Defy 30L Digital Microwave offers spacious capacity with digital touch controls for precise cooking, the Russell Hobbs 6.5L Digital Air Fryer lets you enjoy crispy, oil-free meals with ease, and the Mellerware 1.7L Glass Kettle boils water in under two minutes with a stunning blue LED light. Together, they cover every everyday kitchen need at unbeatable value.
            </p>
            <p className="desc-subhead">Defy 30L Digital Microwave:</p>
            <ul className="desc-list">
              <li>30 Litre capacity.</li>
              <li>Digital touch control panel.</li>
              <li>Multiple power levels.</li>
              <li>Defrost by time or weight.</li>
              <li>Auto cook menus.</li>
              <li>Child lock safety feature.</li>
              <li>Glass turntable plate included.</li>
              <li>Power: 1000 W.</li>
            </ul>
            <p className="desc-subhead">Russell Hobbs 6.5L Digital Air Fryer:</p>
            <ul className="desc-list">
              <li>6.5 Litre capacity.</li>
              <li>Digital touch screen controls.</li>
              <li>Adjustable temperature up to 200&deg;C.</li>
              <li>60-minute timer with auto shut-off.</li>
              <li>Dishwasher-safe non-stick basket.</li>
              <li>Oil-free healthy cooking.</li>
              <li>Power: 1700 W.</li>
            </ul>
            <p className="desc-subhead">Mellerware 1.7L Glass Kettle:</p>
            <ul className="desc-list">
              <li>1.7 Litre capacity.</li>
              <li>Blue LED illumination.</li>
              <li>Boil-dry protection.</li>
              <li>360&deg; cordless swivel base.</li>
              <li>Concealed stainless steel element.</li>
              <li>Auto shut-off.</li>
              <li>Power: 2200 W.</li>
            </ul>
            <p className="desc-subhead">What's in the box</p>
            <p>
              x 1 Defy 30L Digital Microwave<br />
              x 1 Russell Hobbs 6.5L Digital Air Fryer<br />
              x 1 Mellerware 1.7L Glass Kettle<br />
              x 1 Microwave Glass Turntable Plate<br />
              x 3 User Manuals
            </p>
          </div>
        </div>
      </section>

      {isDescCollapsed && <div className="desc-fade" id="descFade"></div>}
      <button
        className="show-more"
        id="showMoreBtn"
        type="button"
        onClick={() => setIsDescCollapsed(!isDescCollapsed)}
      >
        {isDescCollapsed ? 'Show More' : 'Show Less'}
      </button>

      {/* PRODUCT INFORMATION */}
      <section className="pi-section" aria-label="Product Information">
        <h2 className="pi-title">Product Information</h2>
        <div className="pi-table">
          <div className="pi-row">
            <div className="pi-key">Categories</div>
            <div className="pi-val pi-links">
              <a href="#cat" onClick={(e) => e.preventDefault()}>Home & Kitchen</a> /<br />
              <a href="#cat" onClick={(e) => e.preventDefault()}>Appliances</a> /<br />
              <a href="#cat" onClick={(e) => e.preventDefault()}>Small Kitchen Appliances</a> /<br />
              <a href="#cat" onClick={(e) => e.preventDefault()}>Appliance Combos</a>
            </div>
          </div>
          <div className="pi-row">
            <div className="pi-key">Brand</div>
            <div className="pi-val pi-links">
              <a href="#b" onClick={(e) => e.preventDefault()}>Defy</a> /{' '}
              <a href="#b" onClick={(e) => e.preventDefault()}>Russell Hobbs</a> /{' '}
              <a href="#b" onClick={(e) => e.preventDefault()}>Mellerware</a>
            </div>
          </div>
          <div className="pi-row">
            <div className="pi-key">Total Power</div>
            <div className="pi-val">1000 W &middot; 1700 W &middot; 2200 W</div>
          </div>
        </div>
        <button
          className="pi-showmore"
          id="piOpen"
          type="button"
          onClick={() => setIsPiModalOpen(true)}
        >
          Show More
        </button>
      </section>

      {/* PRODUCT INFORMATION MODAL / BOTTOM SHEET */}
      <div
        className={`pi-modal ${isPiModalOpen ? 'is-open' : ''}`}
        id="piModal"
        aria-hidden={!isPiModalOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsPiModalOpen(false);
        }}
      >
        <div className="pi-sheet" role="dialog" aria-modal="true" aria-label="Product Information">
          <div className="pi-sheet-head">
            <button
              className="pi-close"
              id="piClose"
              type="button"
              aria-label="Close"
              onClick={() => setIsPiModalOpen(false)}
            >
              &#10005;
            </button>
            <div className="pi-sheet-title">Product Information</div>
            <div className="pi-head-spacer" aria-hidden="true"></div>
          </div>
          <div className="pi-sheet-body">
            <div className="pi-table pi-table--full">
              <div className="pi-row">
                <div className="pi-key">Categories</div>
                <div className="pi-val pi-links">
                  <a href="#c" onClick={(e) => e.preventDefault()}>Home & Kitchen</a> /<br />
                  <a href="#c" onClick={(e) => e.preventDefault()}>Appliances</a> /<br />
                  <a href="#c" onClick={(e) => e.preventDefault()}>Small Kitchen Appliances</a> /<br />
                  <a href="#c" onClick={(e) => e.preventDefault()}>Appliance Combos</a>
                </div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Brand</div>
                <div className="pi-val pi-links">
                  <a href="#b" onClick={(e) => e.preventDefault()}>Defy</a> /{' '}
                  <a href="#b" onClick={(e) => e.preventDefault()}>Russell Hobbs</a> /{' '}
                  <a href="#b" onClick={(e) => e.preventDefault()}>Mellerware</a>
                </div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Microwave Capacity</div>
                <div className="pi-val">30 L</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Air Fryer Capacity</div>
                <div className="pi-val">6.5 L</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Kettle Capacity</div>
                <div className="pi-val">1.7 L</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Total Power</div>
                <div className="pi-val">1000 W &middot; 1700 W &middot; 2200 W</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Voltage</div>
                <div className="pi-val">220&ndash;240 V</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Warranty</div>
                <div className="pi-val">6-month limited warranty</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Material</div>
                <div className="pi-val">Stainless steel &middot; Glass &middot; Plastic</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Colour</div>
                <div className="pi-val">Stainless Steel / Black / Grey</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Control Type</div>
                <div className="pi-val">Digital Touch</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Use</div>
                <div className="pi-val">Everyday Kitchen Cooking</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">What's in the box</div>
                <div className="pi-val">
                  x 1 Defy 30L Digital Microwave<br />
                  x 1 Russell Hobbs 6.5L Digital Air Fryer<br />
                  x 1 Mellerware 1.7L Glass Kettle<br />
                  x 1 Microwave Glass Turntable Plate<br />
                  x 3 User Manuals
                </div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Merchandising Tags</div>
                <div className="pi-val pi-links"><a href="#tag" onClick={(e) => e.preventDefault()}>Top Picks</a></div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Pack Contents</div>
                <div className="pi-val">3 appliances</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Cleaning</div>
                <div className="pi-val">Dishwasher-safe air fryer basket</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Weight</div>
                <div className="pi-val">22 kg (combined)</div>
              </div>
              <div className="pi-row">
                <div className="pi-key">Barcode</div>
                <div className="pi-val">6009812440371</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS PREVIEW SECTION */}
      <section className="rv-preview" aria-label="Reviews preview">
        <div className="rv-preview-head">
          <div className="rv-preview-title">Reviews</div>
          <div className="rv-preview-meta">
            <span className="rv-star">&#9733;</span>
            <span className="rv-score">4.6</span>
            <span className="rv-count">3564 reviews</span>
          </div>
        </div>
        <div className="rv-card">
          <div className="rv-card-top">
            <div className="rv-name-date">
              <strong>Refilwe</strong> - 09 Aug 2021
            </div>
            <div className="rv-mini-right">
              <span className="rv-mini-star">&#9733;</span>
              <span className="rv-mini-score">5</span>
              <span className="rv-mini-paren">(</span>
              <span className="rv-mini-like">&#128077;</span>
              <span className="rv-mini-likecount">1133</span>
              <span className="rv-mini-paren">)</span>
            </div>
          </div>
          <div className="rv-snippet">
            This combo is exactly what I needed for my new place. The microwave is roomy, the air fryer cooks chips perfectly crispy without oil, and the glass kettle boils in under two minutes. Amazing value for three appliances.
          </div>
          <a
            href="#read-more"
            className="rv-readmore"
            id="rvOpenFromReadMore"
            onClick={(e) => {
              e.preventDefault();
              setIsReviewsOpen(true);
            }}
          >
            Read More
          </a>
        </div>
        <div className="rv-viewall-row">
          <a
            href="#view-all"
            className="rv-viewall"
            id="rvOpenFromViewAll"
            onClick={(e) => {
              e.preventDefault();
              setIsReviewsOpen(true);
            }}
          >
            View All
          </a>
        </div>
      </section>

      {/* REVIEWS SLIDE-OVER DRAWER (rvPage) */}
      <div
        className={`rv-page ${isReviewsOpen ? 'is-open' : ''}`}
        id="rvPage"
        aria-hidden={!isReviewsOpen}
      >
        <div className="rv-topbar">
          <button
            className="rv-back"
            id="rvClose"
            aria-label="Back"
            onClick={() => setIsReviewsOpen(false)}
            type="button"
          >
            &larr;
          </button>
          <div className="rv-top-title">Defy 30L MW + RH Air Fryer...</div>
          <div className="rv-top-spacer"></div>
        </div>

        <div className="rv-summary">
          <div className="rv-summary-left">
            <div className="rv-big">4.6</div>
          </div>
          <div className="rv-summary-mid">
            <div className="rv-stars" aria-label="Stars">
              <span>&#9733;</span>
              <span>&#9733;</span>
              <span>&#9733;</span>
              <span>&#9733;</span>
              <span className="rv-star-dim">&#9733;</span>
            </div>
          </div>
          <div className="rv-summary-right">
            <div className="rv-total">3564 Reviews</div>
          </div>
        </div>

        <div className="rv-bars">
          <div className="rv-bar-row">
            <div className="rv-bar-left">
              5 <span className="rv-bar-star">&#9733;</span>
            </div>
            <div className="rv-bar-track">
              <div className="rv-bar-fill rv5"></div>
            </div>
            <div className="rv-bar-num">2624</div>
          </div>
          <div className="rv-bar-row">
            <div className="rv-bar-left">
              4 <span className="rv-bar-star">&#9733;</span>
            </div>
            <div className="rv-bar-track">
              <div className="rv-bar-fill rv4"></div>
            </div>
            <div className="rv-bar-num">685</div>
          </div>
          <div className="rv-bar-row">
            <div className="rv-bar-left">
              3 <span className="rv-bar-star">&#9733;</span>
            </div>
            <div className="rv-bar-track">
              <div className="rv-bar-fill rv3"></div>
            </div>
            <div className="rv-bar-num">104</div>
          </div>
          <div className="rv-bar-row">
            <div className="rv-bar-left">
              2 <span className="rv-bar-star">&#9733;</span>
            </div>
            <div className="rv-bar-track">
              <div className="rv-bar-fill rv2"></div>
            </div>
            <div className="rv-bar-num">40</div>
          </div>
          <div className="rv-bar-row">
            <div className="rv-bar-left">
              1 <span className="rv-bar-star">&#9733;</span>
            </div>
            <div className="rv-bar-track">
              <div className="rv-bar-fill rv1"></div>
            </div>
            <div className="rv-bar-num">111</div>
          </div>
          <a href="#write-review" className="rv-write" onClick={(e) => e.preventDefault()}>
            Write Review
          </a>
        </div>

        <div className="rv-controls">
          <button className="rv-ctrl" type="button">Sort</button>
          <button className="rv-ctrl" type="button">Filter</button>
        </div>

        <div className="rv-list" aria-label="Reviews list">
          <div className="rv-item">
            <div className="rv-item-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="rv-item-head">
              <strong>Refilwe</strong> - 09 Aug 2021
            </div>
            <div className="rv-item-sub">(Reviewed on day of purchase)</div>
            <div className="rv-item-text">
              This combo is exactly what I needed for my new place. The microwave is roomy, the air fryer cooks chips perfectly crispy without oil, and the glass kettle boils in under two minutes. Amazing value for three appliances.
            </div>
          </div>

          <div className="rv-item">
            <div className="rv-item-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="rv-item-head">
              <strong>Nomsa Mkhize</strong> - 27 Sep 2021
            </div>
            <div className="rv-item-sub">(Reviewed 15 days after purchase)</div>
            <div className="rv-item-text">
              Don't wait. Perfect.<br /><br />
              One of the best buys I've made. The air fryer has replaced my oven for most meals, the microwave heats evenly, and the kettle with the blue light looks beautiful on the counter. Highly recommended for anyone setting up a kitchen.
            </div>
          </div>

          <div className="rv-item">
            <div className="rv-item-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="rv-item-head">
              <strong>Robynn</strong> - 29 May 2023
            </div>
            <div className="rv-item-sub">(Reviewed 7 days after purchase)</div>
            <div className="rv-item-text">
              Perfect, ideal for a family kitchen<br /><br />
              Very good quality appliances. Buying the microwave, air fryer and kettle together saved me a lot of money, and they all match so the kitchen looks tidy. Great value for a complete bundle.
            </div>
          </div>

          <div className="rv-item">
            <div className="rv-item-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="rv-item-head">
              <strong>Lize</strong> - 26 Jun 2023
            </div>
            <div className="rv-item-sub">(Reviewed 14 days after purchase)</div>
            <div className="rv-item-text">
              I really like this combo. Everything is simple to use and does exactly what it promises. The air fryer for supper and the kettle for morning coffee have become part of my daily routine. Great results.
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      {isImageModalOpen && (
        <div
          className="modal is-open"
          id="modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsImageModalOpen(false);
          }}
        >
          <button
            className="modal-close"
            id="modalClose"
            aria-label="Close"
            onClick={() => setIsImageModalOpen(false)}
            type="button"
          >
            &#10005;
          </button>
          <img
            id="modalImg"
            src={IMAGES[activeImageIndex]}
            alt="Expanded product image"
          />
        </div>
      )}

      {/* FOOTER BANNER */}
      <div className="footer-banner">
        <img
          src="/images/takealot-credit.png"
          alt="takealot.credit shop now pay later"
          loading="lazy"
        />
      </div>

      {/* FOOTER LINKS & ADMIN TRIGGER */}
      <footer className="bg-[#f4f4f4] py-8 px-4 text-center text-xs text-[#777] border-t border-[#e5e5e5] mb-20 md:mb-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo-takealot.svg" alt="takealot.com" className="h-5 opacity-70" />
            <span>&copy; {new Date().getFullYear()} Takealot Online (Pty) Ltd.</span>
          </div>
          <div className="flex items-center gap-4 text-[#555]">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:underline">Terms & Conditions</a>
            <span>&bull;</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:underline">Privacy Policy</a>
            <span>&bull;</span>
            <button
              onClick={onOpenAdmin}
              className="text-[#0b79d0] font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0 text-xs"
              type="button"
            >
              Order Database & Admin
            </button>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM ACTION BAR */}
      <footer className="bottom-bar" aria-label="Bottom action bar">
        <div className="bottom-actions">
          <button
            className={`wish-btn ${isWishlisted ? 'text-red-500' : ''}`}
            aria-label="Add to wishlist"
            onClick={() => setIsWishlisted(!isWishlisted)}
            type="button"
          >
            <span className="plus">+</span>
            <svg
              className="heart"
              viewBox="0 0 24 24"
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.8 4.6c-1.5-1.5-3.9-1.5-5.4 0L12 8l-3.4-3.4c-1.5-1.5-3.9-1.5-5.4 0s-1.5 3.9 0 5.4L12 21l8.8-11c1.5-1.5 1.5-3.9 0-5.4z"></path>
            </svg>
          </button>
          <button
            onClick={handleAddToCartClick}
            className="add-btn text-white font-bold cursor-pointer text-center no-underline border-0 flex items-center justify-center gap-2"
            aria-label="Add to Cart"
            type="button"
          >
            <svg
              className="cart-ico"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 6h15l-2 9H7L6 6Z"></path>
              <path d="M6 6l-2-2H2"></path>
              <circle cx="9" cy="20" r="1"></circle>
              <circle cx="18" cy="20" r="1"></circle>
            </svg>
            Add to Cart
          </button>
        </div>
      </footer>
    </div>
  );
}
