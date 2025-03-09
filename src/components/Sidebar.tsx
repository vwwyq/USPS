import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Car, Bike, User, Settings, Users, ShoppingBag } from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const location = useLocation();
  
  const studentLinks = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, href: '/' },
    { name: 'Wallet', icon: <Wallet className="h-5 w-5" />, href: '/wallet' },
    { name: 'Rides', icon: <Car className="h-5 w-5" />, href: '/rides' },
    { name: 'Scooty Rental', icon: <Bike className="h-5 w-5" />, href: '/scooty' },
    { name: 'Profile', icon: <User className="h-5 w-5" />, href: '/profile' },
  ];
  
  const adminLinks = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, href: '/admin' },
    { name: 'Users', icon: <Users className="h-5 w-5" />, href: '/admin/users' },
    { name: 'Transactions', icon: <ShoppingBag className="h-5 w-5" />, href: '/admin/transactions' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/admin/settings' },
  ];
  
  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-indigo-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-white">
                {isAdmin ? 'USPS Admin' : 'USPS'}
              </h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {links.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-indigo-900 text-white'
                        : 'text-indigo-100 hover:bg-indigo-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;