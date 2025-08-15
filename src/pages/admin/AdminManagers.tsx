
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { mockManagers, mockLocations, mockCarGuards, mockTransactions } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Form schema for manager
const managerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().min(10, { message: "Phone number is required." }),
  locationId: z.string().min(1, { message: "Location is required." }),
});

type ManagerFormValues = z.infer<typeof managerSchema>;

const AdminManagers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentManager, setCurrentManager] = useState<string | null>(null);
  const [managerData, setManagerData] = useState(mockManagers);

  // Get unique locations for filter
  const locations = mockLocations;
  
  // Filter managers based on search term and selected location
  const filteredManagers = managerData.filter(manager => {
    const matchesSearch = 
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      manager.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !selectedLocation || manager.locationId === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

  // Form setup
  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      locationId: '',
    },
  });

  const handleOpenDialog = (id?: string) => {
    if (id) {
      // Edit mode
      setIsEditing(true);
      setCurrentManager(id);
      const manager = managerData.find(m => m.id === id);
      if (manager) {
        form.reset({
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          locationId: manager.locationId || '',
        });
      }
    } else {
      // Add mode
      setIsEditing(false);
      setCurrentManager(null);
      form.reset({
        name: '',
        email: '',
        phone: '',
        locationId: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleViewManager = (id: string) => {
    setCurrentManager(id);
    setIsViewDialogOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setCurrentManager(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteManager = () => {
    if (currentManager) {
      // In a real app, this would call an API to delete the manager
      const newManagerData = managerData.filter(manager => manager.id !== currentManager);
      setManagerData(newManagerData);
      setIsDeleteDialogOpen(false);
      toast.success("Manager deleted successfully");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  const onSubmit = (data: ManagerFormValues) => {
    // Get location name from locationId
    const location = mockLocations.find(loc => loc.id === data.locationId);
    const locationName = location ? location.name : '';
    
    if (isEditing && currentManager) {
      // Update existing manager
      const updatedManagers = managerData.map(manager => {
        if (manager.id === currentManager) {
          return {
            ...manager,
            name: data.name,
            email: data.email,
            phone: data.phone,
            location: locationName,
            locationId: data.locationId
          };
        }
        return manager;
      });
      
      setManagerData(updatedManagers);
      toast.success("Manager updated successfully");
    } else {
      // Add new manager
      const newManager = {
        id: `m${managerData.length + 1}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: locationName,
        locationId: data.locationId,
        guardsCount: 0
      };
      
      setManagerData([...managerData, newManager]);
      toast.success("New manager added successfully");
    }
    
    handleCloseDialog();
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nogada-dark">Managers Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="nogada-btn-primary mt-2 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add New Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Manager' : 'Add New Manager'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="072 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Update Manager' : 'Add Manager'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* View Manager Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manager Details</DialogTitle>
          </DialogHeader>
          {currentManager && (
            <div className="space-y-4">
              {(() => {
                const manager = managerData.find(m => m.id === currentManager);
                const managedGuards = mockCarGuards.filter(g => g.managerId === currentManager);
                
                // Get all transactions for guards managed by this manager
                const guardIds = managedGuards.map(g => g.id);
                const transactions = mockTransactions.filter(t => 
                  t.guardId && guardIds.includes(t.guardId)
                );
                
                return manager ? (
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="guards">Car Guards</TabsTrigger>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm font-medium">ID:</div>
                        <div>{manager.id}</div>
                        
                        <div className="text-sm font-medium">Name:</div>
                        <div>{manager.name}</div>
                        
                        <div className="text-sm font-medium">Email:</div>
                        <div>{manager.email}</div>
                        
                        <div className="text-sm font-medium">Phone:</div>
                        <div>{manager.phone}</div>
                        
                        <div className="text-sm font-medium">Location:</div>
                        <div>{manager.location}</div>
                        
                        <div className="text-sm font-medium">Guards Count:</div>
                        <div>{manager.guardsCount}</div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="guards">
                      {managedGuards.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Guard ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {managedGuards.map((guard) => (
                              <TableRow key={guard.id}>
                                <TableCell>{guard.guardId}</TableCell>
                                <TableCell>{guard.name}</TableCell>
                                <TableCell>{guard.phoneNumber || 'N/A'}</TableCell>
                                <TableCell className="text-right">R{guard.balance.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No guards assigned to this manager.
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="transactions">
                      {transactions.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Guard</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((transaction) => {
                              const isInflow = transaction.amount > 0;
                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell>{new Date(transaction.timestamp).toLocaleDateString()}</TableCell>
                                  <TableCell>{transaction.guardName}</TableCell>
                                  <TableCell>
                                    <span className={`text-xs px-2 py-1 rounded ${isInflow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </span>
                                  </TableCell>
                                  <TableCell>{transaction.description}</TableCell>
                                  <TableCell className={`text-right font-medium ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
                                    {`R${Math.abs(transaction.amount).toFixed(2)}`}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found for guards under this manager.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : <p>Manager not found</p>;
              })()}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Manager</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this manager? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteManager}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="nogada-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:flex-1">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="nogada-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="nogada-input"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="nogada-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Manager ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Guards</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.map(manager => (
                <tr key={manager.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{manager.id}</td>
                  <td className="py-3 px-4">{manager.name}</td>
                  <td className="py-3 px-4">{manager.email}</td>
                  <td className="py-3 px-4">{manager.phone}</td>
                  <td className="py-3 px-4">{manager.location}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {manager.guardsCount} guards
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      className="text-blue-600 hover:text-blue-800"
                      size="sm"
                      onClick={() => handleViewManager(manager.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleOpenDialog(manager.id)} 
                      variant="ghost" 
                      className="text-blue-600 hover:text-blue-800"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-800"
                      size="sm"
                      onClick={() => handleDeleteConfirm(manager.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4 px-4 py-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {filteredManagers.length} of {managerData.length} managers
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="px-3 py-1">
              Previous
            </Button>
            <Button variant="default" size="sm" className="px-3 py-1">
              1
            </Button>
            <Button variant="outline" size="sm" className="px-3 py-1">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagers;
