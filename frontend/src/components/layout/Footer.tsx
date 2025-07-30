'use client';

import React, { useMemo } from 'react';
import { Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone } from 'lucide-react';

export default function LuxuryFooter() {
  // Memoized footer sections for performance
  const footerSections = useMemo(() => [
    {
      title: 'Collections',
      links: [
        { label: 'Men', href: '#' },
        { label: 'Women', href: '#' },  
        { label: 'Kids', href: '#' },
        { label: 'Home', href: '#' },
        { label: 'Limited Edition', href: '#' }
      ]
    },
    {
      title: 'Customer Care',
      links: [
        { label: 'Size Guide', href: '#' },
        { label: 'Returns & Exchanges', href: '#' },
        { label: 'Shipping Info', href: '#' },
        { label: 'Contact Concierge', href: '#' },
        { label: 'Care Instructions', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'Our Story', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Sustainability', href: '#' },
        { label: 'Artisan Partners', href: '#' }
      ]
    }
  ], []);

  const socialLinks = useMemo(() => [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Youtube, href: '#', label: 'YouTube' }
  ], []);

  return (
    <footer className="bg-gradient-to-b bg-[#006466] via-[#003e3f] to-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="border-b border-gray-700/50 pb-16 mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-light text-amber-200 mb-4 tracking-wide">
              Join Our Inner Circle
            </h2>
            <p className="text-gray-300 mb-8 font-light leading-relaxed">
              Be the first to discover new collections, exclusive events, and artisan stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200"
                />
              </div>
              <button className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-medium rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-3xl font-light text-amber-200 tracking-wider mb-4">LUXE</h3>
              <p className="text-gray-300 font-light leading-relaxed mb-6">
                Curating exceptional experiences through timeless design and sustainable craftsmanship.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-3 text-amber-400" />
                <span className="text-sm font-light">New York • London • Tokyo</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="w-4 h-4 mr-3 text-amber-400" />
                <span className="text-sm font-light">+1 (555) 123-LUXE</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail className="w-4 h-4 mr-3 text-amber-400" />
                <span className="text-sm font-light">concierge@luxe.com</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-gray-800/50 border border-gray-700/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all duration-200 transform hover:scale-105"
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-medium text-amber-200 mb-6 tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-gray-300 hover:text-amber-200 transition-colors duration-200 font-light text-sm block py-1"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700/50 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-400">
              <p className="font-light">© 2024 LUXE. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-amber-200 transition-colors duration-200">Privacy Policy</a>
                <a href="#" className="hover:text-amber-200 transition-colors duration-200">Terms of Service</a>
                <a href="#" className="hover:text-amber-200 transition-colors duration-200">Cookies</a>
              </div>
            </div>
            
            {/* Payment Icons Placeholder */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-light mr-2">Secure payments</span>
              <div className="flex space-x-2">
                {['VISA', 'MC', 'AMEX', 'PAYPAL'].map((payment) => (
                  <div 
                    key={payment}
                    className="w-8 h-5 bg-gray-800 border border-gray-700/50 rounded text-[8px] text-gray-500 flex items-center justify-center font-mono"
                  >
                    {payment.slice(0, 4)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </footer>
  );
};
