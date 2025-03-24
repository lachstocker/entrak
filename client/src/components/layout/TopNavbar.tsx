import React, { useState } from 'react';
import { Menu, Bell, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Sidebar from './Sidebar';

interface TopNavbarProps {
  title: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ title }) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileSidebar}
              className="md:hidden mr-4"
            >
              <Menu className="text-[#0F2B46]" />
            </Button>
            <h2 className="font-montserrat font-semibold text-xl text-[#0F2B46]">{title}</h2>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="p-2 rounded-full hover:bg-[#E6F0F5] mr-2"
              title="Notifications"
            >
              <Bell className="text-[#0F2B46]" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="p-2 rounded-full hover:bg-[#E6F0F5] mr-2"
              title="Help"
            >
              <HelpCircle className="text-[#0F2B46]" />
            </Button>
            
            <div className="md:hidden">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User profile" 
                className="w-8 h-8 rounded-full" 
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={toggleMobileSidebar}
          />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 max-w-[80%] bg-[#0F2B46] text-white">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavbar;
