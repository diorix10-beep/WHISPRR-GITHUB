import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, MessageSquare, Bot, Globe, BookOpen, Users } from 'lucide-react';

export function CreationMenuFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOraclePage = location.pathname === '/oracle' || location.pathname === '/help';

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isOraclePage) return null;

  const menuItems = [
    { label: 'Create Post', icon: <MessageSquare size={16} />, path: '/feed?create=true', color: 'text-primary-500' },
    { label: 'Create Character', icon: <Bot size={16} />, path: '/nexa/create', color: 'text-amber-500' },
    { label: 'Create World', icon: <Globe size={16} />, path: '/nexa/worlds/create', color: 'text-emerald-500' },
    { label: 'Create Lorebook', icon: <BookOpen size={16} />, path: '/nexa/lorebooks/create', color: 'text-purple-500' },
    { label: 'Create Community', icon: <Users size={16} />, path: '/communities/create', color: 'text-blue-500' },
  ];

  return (
    <div className="fixed z-40 bottom-20 lg:bottom-6 right-4 lg:right-6" ref={menuRef}>
      {/* Expandable Menu Items */}
      <div 
        className={`absolute bottom-full right-0 mb-4 flex flex-col gap-2 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-4 invisible pointer-events-none'
        }`}
      >
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              setIsOpen(false);
            }}
            className="flex items-center gap-3 bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-800 rounded-xl py-2 px-4 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-warm-50 dark:hover:bg-warm-800 transition-all text-sm font-medium text-warm-700 dark:text-warm-200"
            style={{ 
              transitionDelay: isOpen ? `${(menuItems.length - index) * 50}ms` : '0ms',
              transformOrigin: 'bottom right'
            }}
          >
            <span className={item.color}>{item.icon}</span>
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all flex items-center justify-center group relative ${
          isOpen ? 'bg-warm-800 dark:bg-warm-100 scale-95 rotate-45' : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:scale-110'
        }`}
        title="Creation Menu"
        aria-label="Toggle Creation Menu"
      >
        {isOpen ? (
          <X size={24} className="text-white dark:text-warm-900" />
        ) : (
          <>
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-full h-full rounded-full object-cover border-2 border-white/30 group-hover:border-white/50 transition-all"
              onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
            />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-warm-900 animate-pulse" />
          </>
        )}
      </button>
    </div>
  );
}
