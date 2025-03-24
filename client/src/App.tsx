import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import Obligations from "@/pages/Obligations";
import CalendarView from "@/pages/CalendarView";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Sidebar from "@/components/layout/Sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/documents" component={Documents} />
      <Route path="/obligations" component={Obligations} />
      <Route path="/calendar" component={CalendarView} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[#E6F0F5]">
        <Sidebar />
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
