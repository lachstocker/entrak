import React, { useState } from 'react';
import TopNavbar from '@/components/layout/TopNavbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.ANTHROPIC_API_KEY || '');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [remindersBeforeDue, setRemindersBeforeDue] = useState('1');
  const { toast } = useToast();
  
  const handleSaveGeneralSettings = () => {
    setIsSaving(true);
    
    // Simulate saving settings
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully',
      });
    }, 1000);
  };
  
  const handleTestAPIConnection = async () => {
    setIsTestingAPI(true);
    
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      
      if (data.status === 'available') {
        toast({
          title: 'API Connection Successful',
          description: 'The connection to Anthropic API is working correctly.',
        });
      } else {
        toast({
          title: 'API Connection Failed',
          description: 'Could not connect to Anthropic API. Please check your API key.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'API Connection Error',
        description: 'An error occurred while testing the API connection.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingAPI(false);
    }
  };
  
  const handleSaveAPISettings = () => {
    setIsSaving(true);
    
    // Simulate saving API settings
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'API settings saved',
        description: 'Your API settings have been saved successfully',
      });
    }, 1000);
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopNavbar title="Settings" />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-montserrat font-bold text-3xl text-[#0F2B46] mb-2">Settings</h1>
            <p className="text-gray-600">Configure application settings and preferences</p>
          </div>
          
          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure basic application settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <select 
                      id="date-format" 
                      className="w-full rounded-md border border-gray-300 p-2"
                      defaultValue="MMM d, yyyy"
                    >
                      <option value="MMM d, yyyy">MMM d, yyyy (Oct 15, 2023)</option>
                      <option value="MM/dd/yyyy">MM/dd/yyyy (10/15/2023)</option>
                      <option value="dd/MM/yyyy">dd/MM/yyyy (15/10/2023)</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd (2023-10-15)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time-zone">Time Zone</Label>
                    <select 
                      id="time-zone" 
                      className="w-full rounded-md border border-gray-300 p-2"
                      defaultValue="America/New_York"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="auto-extract" 
                      defaultChecked={true}
                    />
                    <Label htmlFor="auto-extract">Automatically extract obligations from uploaded documents</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="dark-mode" 
                      defaultChecked={false}
                    />
                    <Label htmlFor="dark-mode">Dark Mode (Coming Soon)</Label>
                  </div>
                  
                  <Button 
                    className="mt-4" 
                    onClick={handleSaveGeneralSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* API Configuration */}
            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    Configure Anthropic API settings for obligation extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">Anthropic API Key</Label>
                    <Input 
                      id="api-key" 
                      type="password" 
                      placeholder="Enter your Anthropic API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      You can find your API key in the Anthropic dashboard
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model-version">Model Version</Label>
                    <select 
                      id="model-version" 
                      className="w-full rounded-md border border-gray-300 p-2"
                      defaultValue="claude-3-7-sonnet-20250219"
                    >
                      <option value="claude-3-7-sonnet-20250219">Claude 3 Sonnet (Latest)</option>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Response Tokens</Label>
                    <Input 
                      id="max-tokens" 
                      type="number" 
                      placeholder="Maximum tokens"
                      defaultValue="4000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={handleTestAPIConnection}
                      disabled={isTestingAPI}
                    >
                      {isTestingAPI ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing Connection...
                        </>
                      ) : 'Test API Connection'}
                    </Button>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">AI Extraction Settings</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="extract-dates" defaultChecked={true} />
                      <Label htmlFor="extract-dates">Extract dates from relative references (e.g., "within 30 days")</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="confidence-threshold" defaultChecked={true} />
                      <Label htmlFor="confidence-threshold">Only include obligations with confidence score above 70%</Label>
                    </div>
                  </div>
                  
                  <Button 
                    className="mt-4" 
                    onClick={handleSaveAPISettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save API Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notification Methods</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="email-notifications" 
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                    </div>
                    
                    {emailNotifications && (
                      <div className="ml-8 space-y-2">
                        <Label htmlFor="email-address">Email Address</Label>
                        <Input 
                          id="email-address" 
                          type="email" 
                          placeholder="your.email@example.com"
                          defaultValue="alex@entrak.com"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="in-app-notifications" 
                        checked={inAppNotifications}
                        onCheckedChange={setInAppNotifications}
                      />
                      <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Reminders</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reminder-days">Default Reminder (days before due date)</Label>
                      <select 
                        id="reminder-days" 
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={remindersBeforeDue}
                        onChange={(e) => setRemindersBeforeDue(e.target.value)}
                      >
                        <option value="0">On the due date</option>
                        <option value="1">1 day before</option>
                        <option value="3">3 days before</option>
                        <option value="7">1 week before</option>
                        <option value="14">2 weeks before</option>
                        <option value="30">1 month before</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-reminders" defaultChecked={true} />
                      <Label htmlFor="auto-reminders">Automatically create reminders for new obligations</Label>
                    </div>
                  </div>
                  
                  <Button 
                    className="mt-4" 
                    onClick={handleSaveGeneralSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Notification Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account and profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-[#0F2B46] flex items-center justify-center text-white text-xl font-bold">
                      AM
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Alex Morgan</h3>
                      <p className="text-gray-500">Legal Department</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input 
                          id="full-name" 
                          defaultValue="Alex Morgan"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          defaultValue="alex@entrak.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input 
                          id="department" 
                          defaultValue="Legal Department"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select 
                          id="role" 
                          className="w-full rounded-md border border-gray-300 p-2"
                          defaultValue="admin"
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Password</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="mt-4" 
                    onClick={handleSaveGeneralSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Account Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default Settings;
