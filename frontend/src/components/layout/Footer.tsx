'use client';

import React, { memo, useMemo, useState } from 'react';
import { Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

// Dropdown content data
const dropdownContent = {
  'Size Guide': {
    title: 'Size Guide',
    content: [
      { label: 'Men\'s Clothing', info: 'XS (32-34"), S (34-36"), M (36-38"), L (38-40"), XL (40-42")' },
      { label: 'Women\'s Clothing', info: 'XS (24-26"), S (26-28"), M (28-30"), L (30-32"), XL (32-34")' },
      { label: 'Shoes', info: 'US 6-12 available. See detailed size chart for conversions.' },
      { label: 'International Sizing', info: 'EU, UK, and Asian sizes available with conversion guide.' }
    ]
  },
  'Returns': {
    title: 'Returns & Exchanges',
    content: [
      { label: 'Return Window', info: '30 days from delivery date for full refund' },
      { label: 'Condition', info: 'Items must be unworn, unwashed, with original tags' },
      { label: 'Process', info: 'Free returns with prepaid shipping label included' },
      { label: 'Exchanges', info: 'Free size/color exchanges within 14 days' }
    ]
  },
  'Shipping': {
    title: 'Shipping Information',
    content: [
      { label: 'Standard Shipping', info: '5-7 business days - Free on orders $75+' },
      { label: 'Express Shipping', info: '2-3 business days - $12.99' },
      { label: 'Next Day Delivery', info: 'Order by 2PM for next day - $24.99' },
      { label: 'International', info: '7-14 business days - Rates vary by location' }
    ]
  },
  'Contact': {
    title: 'Contact Support',
    content: [
      { label: 'Live Chat', info: 'Available 24/7 for instant assistance' },
      { label: 'Email Support', info: 'Response within 24 hours - support@brand.com' },
      { label: 'Phone', info: 'Mon-Fri 9AM-8PM EST - +1 (555) 123-4567' },
      { label: 'Store Locator', info: 'Find nearest store location and hours' }
    ]
  },
  'FAQ': {
    title: 'Frequently Asked Questions',
    content: [
      { label: 'Order Tracking', info: 'Track your order with confirmation email link' },
      { label: 'Payment Methods', info: 'Visa, Mastercard, PayPal, Apple Pay, Google Pay accepted' },
      { label: 'Gift Cards', info: 'Digital gift cards available, never expire' },
      { label: 'Loyalty Program', info: 'Earn points with every purchase, exclusive member benefits' }
    ]
  }
};

// Dropdown Component
const CustomerServiceDropdown = memo(function CustomerServiceDropdown({ 
  label, 
  href 
}: { 
  label: string; 
  href: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const content = dropdownContent[label as keyof typeof dropdownContent];

  if (!content) {
    return (
      <a 
        href={href} 
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block"
      >
        {label}
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
        aria-expanded={isOpen}
      >
        {label}
        {isOpen ? (
          <ChevronUp className="w-3 h-3 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-3 h-3 transition-transform duration-200" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">
            {content.title}
          </h4>
          <div className="space-y-3">
            {content.content.map((item, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium text-gray-800 mb-1">{item.label}</div>
                <div className="text-gray-600 leading-relaxed">{item.info}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Updated Footer Section Component
const FooterSection = memo(function FooterSection({ 
  title, 
  links 
}: { 
  title: string; 
  links: Array<{ label: string; href: string }> 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-3 flex flex-col">
        {links.map((link) => (
          <div key={link.label}>
            {title === 'Customer Service' ? (
              <CustomerServiceDropdown label={link.label} href={link.href} />
            ) : (
              <a 
                href={link.href} 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block"
              >
                {link.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const SocialLink = memo(function SocialLink({ 
  icon: Icon, 
  href, 
  label 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  href: string; 
  label: string; 
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
    >
      <Icon className="w-4 h-4" />
    </a>
  );
});

export default function ZaraFooter() {
  // Memoized footer sections
  const footerSections = useMemo(() => [
    {
      title: 'Customer Service',
      links: [
        { label: 'Size Guide', href: '/size-guide' },
        { label: 'Returns', href: '/returns' },
        { label: 'Shipping', href: '/shipping' },
        { label: 'Contact', href: '/contact' },
        { label: 'FAQ', href: '/faq' }
      ]
    },
  ], []);

  const socialLinks = useMemo(() => [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' }
  ], []);

  const paymentMethods = useMemo(() => [
    'Visa', 'Mastercard', 'AmEx', 'PayPal', 'ApplePay', 'GooglePay'
  ], []);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        // This would normally close dropdowns, but since we're using individual state,
        // we'd need a more complex state management solution
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <footer className="bg-stone-100 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h3 className="text-2xl font-light text-gray-900 tracking-wide mb-4">
                BRAND
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                Contemporary fashion for the modern lifestyle. 
                Quality craftsmanship meets timeless design.
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-3" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-3" />
                <span className="text-sm">hello@brand.com</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-3" />
                <span className="text-sm">New York, NY</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <SocialLink
                  key={social.label}
                  icon={social.icon}
                  href={social.href}
                  label={social.label}
                />
              ))}
            </div>
          </div>

          {/* Footer Navigation Sections */}
          {footerSections.map((section) => (
            <FooterSection
              key={section.title}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            
            {/* Legal Links */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <p>&copy; 2024 BRAND. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="/privacy" className="hover:text-gray-900 transition-colors duration-200">
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-gray-900 transition-colors duration-200">
                  Terms & Conditions
                </a>
                <a href="/cookies" className="hover:text-gray-900 transition-colors duration-200">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}