'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Catalog' },
  { href: '/dashboard', label: 'My Progress' },
  { href: '/admin', label: 'Admin' }
];

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthed(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link href="/">
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-secondary)' }}>
            EthosLearn xAPI
          </span>
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {isAuthed ? (
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 1rem' }}>
              Log out
            </button>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
