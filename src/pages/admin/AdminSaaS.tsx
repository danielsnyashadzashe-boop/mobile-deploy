
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Settings, Trash2, Building } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from 'react-hook-form';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  users: number;
  createdAt: string;
}

const AdminSaaS = () => {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: '1',
      name: 'Acme Corp',
      domain: 'acme.tippa.app',
      plan: 'enterprise',
      status: 'active',
      users: 25,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'StartupXYZ',
      domain: 'startupxyz.tippa.app',
      plan: 'premium',
      status: 'active',
      users: 8,
      createdAt: '2024-01-20'
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      domain: '',
      plan: ''
    }
  });

  const handleCreateTenant = (data: { name: string; domain: string; plan: string }) => {
    const newTenant: Tenant = {
      id: Date.now().toString(),
      name: data.name,
      domain: `${data.domain}.tippa.app`,
      plan: data.plan as 'basic' | 'premium' | 'enterprise',
      status: 'active',
      users: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setTenants([...tenants, newTenant]);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const handleDeleteTenant = (tenantId: string) => {
    setTenants(tenants.filter(tenant => tenant.id !== tenantId));
  };

  const toggleTenantStatus = (tenantId: string) => {
    setTenants(tenants.map(tenant => 
      tenant.id === tenantId 
        ? { 
            ...tenant, 
            status: tenant.status === 'active' ? 'suspended' : 'active' as 'active' | 'suspended' | 'inactive'
          }
        : tenant
    ));
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-tippa-accent">SaaS Tenant Management</h2>
          <p className="text-tippa-neutral">Manage multi-tenant environments and subscriptions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="tippa-btn-primary">
              <Building className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTenant)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter tenant name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input {...field} placeholder="subdomain" className="rounded-r-none" />
                          <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                            .tippa.app
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic - $29/month</SelectItem>
                          <SelectItem value="premium">Premium - $79/month</SelectItem>
                          <SelectItem value="enterprise">Enterprise - $199/month</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="tippa-btn-primary">
                    Create Tenant
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-tippa-accent">{tenants.length}</div>
            <div className="text-sm text-tippa-neutral">Total Tenants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {tenants.filter(t => t.status === 'active').length}
            </div>
            <div className="text-sm text-tippa-neutral">Active Tenants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-tippa-secondary">
              {tenants.reduce((sum, t) => sum + t.users, 0)}
            </div>
            <div className="text-sm text-tippa-neutral">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-tippa-accent">
              ${tenants.filter(t => t.status === 'active').length * 79}
            </div>
            <div className="text-sm text-tippa-neutral">Monthly Revenue</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.domain}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan}
                    </span>
                  </TableCell>
                  <TableCell>{tenant.users}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </TableCell>
                  <TableCell>{tenant.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleTenantStatus(tenant.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteTenant(tenant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSaaS;
