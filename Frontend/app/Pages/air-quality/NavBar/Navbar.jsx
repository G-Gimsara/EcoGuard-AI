"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/app/Images/logo.png"; 
import Image from "next/image";



const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    { name: "Home", path: "/Pages/Flood_Risk/Dashboard" },
        { name: "PollutionReport", path: "/Pages/Flood_Risk/map" },
    { name: "PollutionRegisteruser", path: "/Pages/Flood_Risk/Guide" },
    { name: "About", path: "/Pages/Flood_Risk/about" },
   
  ];

  return (
    <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
              <div className="flex items-center">
        <div className="relative w-12 h-12">
          <Image
            src={Logo}
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? "bg-green-400 text-gray-900"
                    : "hover:bg-green-500 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Info + Logout */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-sm text-gray-200">
                  <div>{user.name}</div>
                  <div className="text-xs text-gray-400">
                    {user.role.replace("_", " ")}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-green-400 text-gray-900 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-500 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Placeholder */}
          <div className="md:hidden">
            {/* Add mobile hamburger menu if needed */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
