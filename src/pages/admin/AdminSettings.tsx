
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { Settings } from 'lucide-react';

interface AppSettings {
  appName: string;
  timezone: string;
  currency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Tippa Administration',
    timezone: 'UTC',
    currency: 'ZAR',
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30
  });

  const form = useForm({
    defaultValues: settings
  });

  const handleSaveSettings = (data: AppSettings) => {
    setSettings(data);
    console.log('Settings saved:', data);
    // Here you would typically save to your backend
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-tippa-accent">Application Settings</h2>
        <p className="text-tippa-neutral">Configure system-wide application settings</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter application name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="maxLoginAttempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Login Attempts</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1" 
                          max="10"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Timeout (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="5" 
                          max="480"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <Label>System Mode</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={form.watch('maintenanceMode')}
                      onChange={(e) => form.setValue('maintenanceMode', e.target.checked)}
                    />
                    <label htmlFor="maintenanceMode" className="text-sm">
                      Enable Maintenance Mode
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Notification Channels</Label>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={form.watch('emailNotifications')}
                      onChange={(e) => form.setValue('emailNotifications', e.target.checked)}
                    />
                    <label htmlFor="emailNotifications" className="text-sm">
                      Enable Email Notifications
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      checked={form.watch('smsNotifications')}
                      onChange={(e) => form.setValue('smsNotifications', e.target.checked)}
                    />
                    <label htmlFor="smsNotifications" className="text-sm">
                      Enable SMS Notifications
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-tippa-neutral">Version</Label>
                    <div className="font-medium">v2.1.0</div>
                  </div>
                  <div>
                    <Label className="text-tippa-neutral">Environment</Label>
                    <div className="font-medium">Production</div>
                  </div>
                  <div>
                    <Label className="text-tippa-neutral">Database</Label>
                    <div className="font-medium">PostgreSQL 14</div>
                  </div>
                  <div>
                    <Label className="text-tippa-neutral">Cache</Label>
                    <div className="font-medium">Redis 6.2</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    Download System Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="tippa-btn-primary">
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminSettings;
