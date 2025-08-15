
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Settings, Trash2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from 'react-hook-form';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

const AdminRoles = () => {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access',
      permissions: ['user_management', 'role_management', 'tenant_management', 'system_settings'],
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Location and guard management',
      permissions: ['user_management', 'location_management'],
      createdAt: '2024-01-20'
    }
  ]);

  const [permissions] = useState<Permission[]>([
    { id: 'user_management', name: 'User Management', description: 'Create, edit, and delete users' },
    { id: 'role_management', name: 'Role Management', description: 'Manage roles and permissions' },
    { id: 'tenant_management', name: 'Tenant Management', description: 'Manage SaaS tenants' },
    { id: 'location_management', name: 'Location Management', description: 'Manage guard locations' },
    { id: 'system_settings', name: 'System Settings', description: 'Configure application settings' },
    { id: 'reports_access', name: 'Reports Access', description: 'View and generate reports' }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const handleCreateRole = (data: { name: string; description: string }) => {
    const newRole: Role = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      permissions: selectedPermissions,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setRoles([...roles, newRole]);
    setIsCreateDialogOpen(false);
    form.reset();
    setSelectedPermissions([]);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(role => role.id !== roleId));
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-tippa-accent">Role Management</h2>
          <p className="text-tippa-neutral">Define roles and assign permissions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="tippa-btn-primary">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateRole)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter role name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter role description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <div>
                          <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                            {permission.name}
                          </label>
                          <p className="text-xs text-tippa-neutral">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="tippa-btn-primary">
                    Create Role
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permId) => {
                        const perm = permissions.find(p => p.id === permId);
                        return (
                          <span key={permId} className="px-2 py-1 bg-tippa-secondary/10 text-tippa-secondary text-xs rounded">
                            {perm?.name}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>{role.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
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

export default AdminRoles;
