import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  LayoutDashboard, Vote, CheckCircle2,
  LogOut, X, FilePlus,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logocts from '../assets/logo-cts2-removebg-preview.png';

/* ─── Menu items ───────────────────────────────────────────────────────────
   Scrutins retiré de la nav (la page existe toujours mais n'est plus exposée
   dans la navigation principale).
   ───────────────────────────────────────────────────────────────────────── */
const MENU = [
  { id: 'dashboard',   to: '/voterDashboard', label: 'Accueil',   icon: LayoutDashboard },
  { id: 'candidature', to: '/candidature',    label: 'Postuler',  icon: FilePlus        },
  { id: 'votes',       to: '/voterHistory',   label: 'Mes votes', icon: CheckCircle2    },
];

/* ── Sidebar nav item (desktop ≥ 768px) ── */
function SideNavItem({ item, active }) {
  return (
    <Link
      to={item.to}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '0.125rem 0.5rem',
        borderRadius: '0.75rem',
        padding: '0.625rem 0.875rem',
        fontSize: '0.8125rem',
        fontWeight: 600,
        textDecoration: 'none',
        color: active ? '#15803d' : '#64748b',
        background: active ? '#f0fdf4' : 'transparent',
        transition: 'all 140ms',
      }}
    >
      {active && (
        <span style={{
          position: 'absolute',
          left: 0,
          top: '6px',
          bottom: '6px',
          width: '3px',
          borderRadius: '0 3px 3px 0',
          background: '#16a34a',
        }} />
      )}
      <span style={{
        display: 'flex',
        height: '1.875rem',
        width: '1.875rem',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.5rem',
        background: active ? '#dcfce7' : '#f1f5f9',
        color: active ? '#16a34a' : '#94a3b8',
        transition: 'all 140ms',
      }}>
        <item.icon size={14} strokeWidth={2} />
      </span>
      {item.label}
    </Link>
  );
}

/* ── Bottom nav item (mobile < 768px) ── */
function BottomNavItem({ item, active }) {
  return (
    <Link
      to={item.to}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '0.5rem 0 0.375rem',
        textDecoration: 'none',
        color: active ? '#16a34a' : '#94a3b8',
        transition: 'color 140ms',
        minWidth: 0,
      }}
    >
      <span style={{
        display: 'flex',
        height: '2.125rem',
        width: '2.125rem',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.75rem',
        background: active ? '#f0fdf4' : 'transparent',
        transition: 'background 140ms',
      }}>
        <item.icon size={20} strokeWidth={active ? 2.5 : 1.75} />
      </span>
      <span style={{
        fontSize: '0.5625rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: active ? '#16a34a' : '#94a3b8',
        lineHeight: 1,
      }}>
        {item.label}
      </span>
    </Link>
  );
}

/* ── Main layout ── */
export default function VoterLayout({ children, activePage }) {
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';
  const fullName = user
    ? `${user.first_name} ${user.last_name}`
    : 'Électeur';

  return (
    <div className="voter-layout-root">

      {/* ══════════════════════════════════════════
          SIDEBAR — visible desktop (≥768px) via CSS
          Cachée mobile : la bottom nav suffit
          ══════════════════════════════════════════ */}
      <aside className="voter-sidebar">

        {/* Logo */}
        <div className="voter-sidebar-logo">
          <img
            src={Logocts}
            alt="CTS"
            style={{ height: '2.25rem', width: '2.25rem', objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ lineHeight: 1.25 }}>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.01em',
            }}>
              Cyber Tech Squad
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: '#94a3b8',
              marginTop: '1px',
            }}>
              Plateforme électorale
            </span>
          </div>
        </div>

        {/* Nav label */}
        <p className="voter-sidebar-section-label">Navigation</p>

        {/* Nav links */}
        <nav className="voter-sidebar-nav">
          {MENU.map((item) => (
            <SideNavItem
              key={item.id}
              item={item}
              active={activePage === item.id}
            />
          ))}
        </nav>

        {/* User + logout */}
        <div className="voter-sidebar-user">
          <div className="voter-sidebar-user-card">
            <div className="voter-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}>
                {fullName}
              </p>
              <p style={{
                fontSize: '0.625rem',
                fontWeight: 600,
                color: '#16a34a',
                marginTop: '2px',
              }}>
                Électeur
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="voter-sidebar-logout"
          >
            <span className="voter-sidebar-logout-icon">
              <LogOut size={13} />
            </span>
            {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════ */}
      <div className="voter-main">

        {/* Topbar — épurée sur mobile : juste logo + user chip */}
        <header className="voter-topbar">

          {/* Logo — visible sur mobile uniquement (sidebar cachée) */}
          <div className="voter-topbar-logo-mobile">
            <img
              src={Logocts}
              alt="CTS"
              style={{ height: '1.875rem', width: '1.875rem', objectFit: 'contain' }}
            />
            <span style={{
              fontSize: '1rem',
              fontWeight: 900,
              color: '#16a34a',
              letterSpacing: '-0.01em',
            }}>
              CTS Vote
            </span>
          </div>

          {/* Badge session sécurisée — desktop uniquement */}
          <div className="voter-topbar-session-badge">
            <span className="status-dot-live" />
            Session sécurisée
          </div>

          {/* User chip — toujours visible */}
          <div className="voter-topbar-user">
            <div className="voter-avatar voter-avatar-sm">{initials}</div>
            <div className="voter-topbar-user-info">
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                {fullName}
              </p>
              <p style={{
                marginTop: '2px',
                fontSize: '0.5625rem',
                fontWeight: 700,
                color: '#16a34a',
              }}>
                Électeur
              </p>
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="voter-content">
          {children}
        </main>
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM NAV — mobile < 768px uniquement
          (masquée via CSS sur desktop)
          ══════════════════════════════════════════ */}
      <nav className="voter-bottom-nav">
        {MENU.map((item) => (
          <BottomNavItem
            key={item.id}
            item={item}
            active={activePage === item.id}
          />
        ))}

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '0.5rem 0 0.375rem',
            border: 'none',
            background: 'transparent',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            color: '#94a3b8',
            transition: 'color 140ms',
            minWidth: 0,
          }}
        >
          <span style={{
            display: 'flex',
            height: '2.125rem',
            width: '2.125rem',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.75rem',
          }}>
            <LogOut size={20} strokeWidth={1.75} />
          </span>
          <span style={{
            fontSize: '0.5625rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#94a3b8',
            lineHeight: 1,
          }}>
            {loggingOut ? '…' : 'Sortir'}
          </span>
        </button>
      </nav>
    </div>
  );
}
