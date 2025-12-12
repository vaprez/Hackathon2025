import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Zap, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  History,
  Map,
  User,
  Menu,
  X,
  Warehouse,
  Truck,
  Building2,
  FlaskConical,
  PackageCheck,
  Send,
  RotateCcw
} from 'lucide-react';
import { useState } from 'react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Items de navigation par défaut (admin voit tout)
const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/inventaire', label: 'Inventaire', icon: Package },
  { path: '/map', label: 'Carte', icon: Map },
  { path: '/actions', label: 'Mes Actions', icon: History },
];

const magasinItems = [
  { path: '/magasin/stock', label: 'Stock Magasin', icon: Warehouse },
  { path: '/magasin/reception', label: 'Réception', icon: Truck },
  { path: '/magasin/transfert', label: 'Transferts', icon: Truck },
];

const boItems = [
  { path: '/bo/stock', label: 'Stock BO', icon: Building2 },
  { path: '/bo/pose', label: 'Pose', icon: Zap },
  { path: '/bo/depose', label: 'Depose', icon: RotateCcw },
  { path: '/bo/reception', label: 'Reception', icon: PackageCheck },
  { path: '/bo/demande', label: 'Demande transfert', icon: Send },
];

const laboItems = [
  { path: '/labo/file-attente', label: 'File d\'attente', icon: FlaskConical },
  { path: '/labo/test', label: 'Tests', icon: FlaskConical },
];

// Fonction pour déterminer les sections visibles selon le rôle
const canAccessSection = (role: string | undefined, section: 'magasin' | 'bo' | 'labo'): boolean => {
  if (!role) return false;
  if (role === 'admin') return true;
  
  switch (section) {
    case 'magasin':
      return role === 'magasin';
    case 'bo':
      return role === 'bo' || role === 'agent_terrain' || role === 'gestionnaire';
    case 'labo':
      return role === 'labo';
    default:
      return false;
  }
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.layout}>
      {/* Mobile menu button */}
      <button 
        className={styles.menuButton}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Zap size={32} className={styles.logo} />
          <div>
            <h1 className={styles.brandTitle}>EDF Corse</h1>
            <p className={styles.brandSubtitle}>Gestion CPL</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Section Magasin - visible pour admin et magasin */}
          {canAccessSection(user?.role, 'magasin') && (
            <>
              <div className={styles.navDivider} />
              <span className={styles.navSection}>Magasin</span>
              {magasinItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
          
          {/* Section BO - visible pour admin, bo et agent_terrain */}
          {canAccessSection(user?.role, 'bo') && (
            <>
              <div className={styles.navDivider} />
              <span className={styles.navSection}>Base Opérationnelle</span>
              {boItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
          
          {/* Section Labo - visible pour admin et labo */}
          {canAccessSection(user?.role, 'labo') && (
            <>
              <div className={styles.navDivider} />
              <span className={styles.navSection}>Laboratoire</span>
              {laboItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <User size={20} />
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.prenom} {user?.nom}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
