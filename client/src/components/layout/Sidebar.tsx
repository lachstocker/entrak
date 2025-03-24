import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  Calendar, 
  BarChart3, 
  Settings, 
  Zap 
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, isActive }) => {
  return (
    <li className={`px-6 py-3 ${isActive ? 'bg-[#1E4265]' : 'hover:bg-[#193857] transition-colors'}`}>
      <Link href={href}>
        <div className="flex items-center font-semibold cursor-pointer">
          <span className="mr-3">{icon}</span>
          {children}
        </div>
      </Link>
    </li>
  );
};

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0F2B46] text-white">
      <div className="p-6">
        <h1 className="font-montserrat font-bold text-2xl flex items-center">
          <Zap className="mr-2" />
          EnTrak
        </h1>
      </div>
      
      <nav className="flex-1">
        <ul>
          <NavItem 
            href="/" 
            icon={<LayoutDashboard size={20} />} 
            isActive={location === '/'}
          >
            Dashboard
          </NavItem>
          
          <NavItem 
            href="/documents" 
            icon={<FileText size={20} />} 
            isActive={location === '/documents'}
          >
            Documents
          </NavItem>
          
          <NavItem 
            href="/obligations" 
            icon={<ClipboardList size={20} />} 
            isActive={location === '/obligations'}
          >
            Obligations
          </NavItem>
          
          <NavItem 
            href="/calendar" 
            icon={<Calendar size={20} />} 
            isActive={location === '/calendar'}
          >
            Calendar
          </NavItem>
          
          <NavItem 
            href="/analytics" 
            icon={<BarChart3 size={20} />} 
            isActive={location === '/analytics'}
          >
            Analytics
          </NavItem>
          
          <NavItem 
            href="/settings" 
            icon={<Settings size={20} />} 
            isActive={location === '/settings'}
          >
            Settings
          </NavItem>
        </ul>
      </nav>
      
      <div className="p-6 border-t border-[#1E4265]">
        <div className="flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="User profile" 
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <p className="font-semibold">Alex Morgan</p>
            <p className="text-xs text-gray-300">Legal Department</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
