"use client";

import React from "react";
import Link from "next/link";
import { Linkedin, Twitter, Github, Facebook } from "lucide-react";

const SOCIAL_LINKS = [
  { icon: Linkedin, href: "https://linkedin.com" },
  { icon: Twitter, href: "https://twitter.com" },
  { icon: Github, href: "https://github.com" },
  { icon: Facebook, href: "https://facebook.com" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            EnvRisk
          </h2>
          <p className="text-slate-400 text-sm">AI + IoT for environmental risk management</p>
        </div>

        {/* Quick Links */}
        <div className="flex gap-6 text-sm">
          <Link href="/privacy" className="hover:text-blue-400 transition">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-blue-400 transition">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-blue-400 transition">
            Contact
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex gap-3">
          {SOCIAL_LINKS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-blue-600 transition"
              >
                <Icon className="w-4 h-4 text-white" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div className="text-center text-slate-500 text-xs mt-4">
        &copy; {year} EnvRisk. All rights reserved.
      </div>
    </footer>
  );
}