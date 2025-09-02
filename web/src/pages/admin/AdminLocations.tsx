
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, MapPin } from 'lucide-react';
import { mockLocations, mockManagers, mockCarGuards, mockTransactions } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema for location
const locationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address is required." }),
});

type LocationFormValues = z.infer<typeof locationSchema>;

const AdminLocations = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [locationData, setLocationData] = useState(mockLocations);
  const [activeTab, setActiveTab] = useState("details");
  const [transactionType, setTransactionType] = useState("all");
  
  // Filter locations based on search term
  const filteredLocations = locationData.filter(location => 
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form setup
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const handleOpenDialog = (id?: string) => {
    if (id) {
      // Edit mode
      setIsEditing(true);
      setCurrentLocation(id);
      const location = locationData.find(loc => loc.id === id);
      if (location) {
        form.reset({
          name: location.name,
          address: location.address,
        });
      }
    } else {
      // Add mode
      setIsEditing(false);
      setCurrentLocation(null);
      form.reset({
        name: '',
        address: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleViewLocation = (id: string) => {
    setCurrentLocation(id);
    setIsViewDialogOpen(true);
    setActiveTab("details");
    setTransactionType("all");
  };

  const handleDeleteConfirm = (id: string) => {
    setCurrentLocation(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLocation = () => {
    if (currentLocation) {
      // In a real app, this would call an API to delete the location
      const newLocationData = locationData.filter(location => location.id !== currentLocation);
      setLocationData(newLocationData);
      setIsDeleteDialogOpen(false);
      toast.success("Location deleted successfully");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  const onSubmit = (data: LocationFormValues) => {
    // In a real app, you would save the data to the backend
    console.log('Location form submitted:', data);
    
    if (isEditing && currentLocation) {
      // Update existing location
      const updatedLocations = locationData.map(location => {
        if (location.id === currentLocation) {
          return {
            ...location,
            name: data.name,
            address: data.address,
          };
        }
        return location;
      });
      
      setLocationData(updatedLocations);
      toast.success("Location updated successfully");
    } else {
      // Add new location
      const newLocation = {
        id: `l${locationData.length + 1}`,
        name: data.name,
        address: data.address,
        guardsCount: 0
      };
      
      setLocationData([...locationData, newLocation]);
      toast.success("New location added successfully");
    }
    
    handleCloseDialog();
  };

  // Filter transactions by type
  const filterTransactions = (transactions) => {
    if (transactionType === "all") return transactions;
    return transactions.filter(t => t.type === transactionType);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `R${amount.toFixed(2)}`;
  };

  // Get transaction style (inflow/outflow)
  const getTransactionStyle = (transaction) => {
    if (['tip', 'deposit', 'refund'].includes(transaction.type)) {
      return "text-green-600"; // inflow
    } else if (['withdrawal', 'purchase', 'fee'].includes(transaction.type)) {
      return "text-red-600"; // outflow
    }
    return ""; // neutral
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nogada-dark">Locations Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="nogada-btn-primary mt-2 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add New Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mall of Africa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Update Location' : 'Add Location'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* View Location Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
          </DialogHeader>
          {currentLocation && (
            <div className="space-y-4">
              {(() => {
                const location = locationData.find(loc => loc.id === currentLocation);
                const managers = mockManagers.filter(m => m.locationId === currentLocation);
                const guards = mockCarGuards.filter(g => g.locationId === currentLocation);
                // Get transactions related to this location
                const locationTransactions = mockTransactions.filter(t => 
                  t.locationId === currentLocation || 
                  guards.some(g => g.id === t.guardId) ||
                  (t.managerId && managers.some(m => m.id === t.managerId)) // Use optional chaining
                );
                const filteredTransactions = filterTransactions(locationTransactions);
                
                return location ? (
                  <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="managers">Managers</TabsTrigger>
                      <TabsTrigger value="guards">Car Guards</TabsTrigger>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm font-medium">ID:</div>
                        <div>{location.id}</div>
                        
                        <div className="text-sm font-medium">Name:</div>
                        <div>{location.name}</div>
                        
                        <div className="text-sm font-medium">Address:</div>
                        <div>{location.address}</div>
                        
                        <div className="text-sm font-medium">Guards Count:</div>
                        <div>{guards.length}</div>
                        
                        <div className="text-sm font-medium">Managers Count:</div>
                        <div>{managers.length}</div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="managers">
                      {managers.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead className="text-right">Guards Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {managers.map((manager) => (
                              <TableRow key={manager.id}>
                                <TableCell>{manager.name}</TableCell>
                                <TableCell>{manager.email}</TableCell>
                                <TableCell>{manager.phone || 'N/A'}</TableCell>
                                <TableCell className="text-right">{manager.guardsCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No managers assigned to this location.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="guards">
                      {guards.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Guard ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Bank Details</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {guards.map((guard) => (
                              <TableRow key={guard.id}>
                                <TableCell>{guard.guardId}</TableCell>
                                <TableCell>{guard.name}</TableCell>
                                <TableCell>{guard.phoneNumber || 'N/A'}</TableCell>
                                <TableCell>
                                  {guard.bankDetails || 
                                   (guard.bankName && guard.accountNumber ? 
                                    `${guard.bankName} - ${guard.accountNumber}` : 
                                    'Not provided')}
                                </TableCell>
                                <TableCell className="text-right">R{guard.balance.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No guards assigned to this location.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="transactions">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Transactions</h3>
                        <Select value={transactionType} onValueChange={setTransactionType}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Transactions</SelectItem>
                            <SelectItem value="tip">Tips</SelectItem>
                            <SelectItem value="withdrawal">Withdrawals</SelectItem>
                            <SelectItem value="purchase">Purchases</SelectItem>
                            <SelectItem value="deposit">Deposits</SelectItem>
                            <SelectItem value="fee">Fees</SelectItem>
                            <SelectItem value="refund">Refunds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {filteredTransactions.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransactions.map((transaction) => {
                              // Find related user
                              const guard = mockCarGuards.find(g => g.id === transaction.guardId);
                              const manager = transaction.managerId ? mockManagers.find(m => m.id === transaction.managerId) : null;
                              const userName = guard ? `${guard.name} (Guard)` : 
                                              manager ? `${manager.name} (Manager)` : 'System';
                              
                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell>
                                    {new Date(transaction.timestamp).toLocaleString('en-ZA', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </TableCell>
                                  <TableCell>{transaction.description}</TableCell>
                                  <TableCell>
                                    <span className="capitalize">{transaction.type}</span>
                                  </TableCell>
                                  <TableCell>{userName}</TableCell>
                                  <TableCell className={`text-right ${getTransactionStyle(transaction)}`}>
                                    {formatCurrency(transaction.amount)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found for the selected filter.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : <p>Location not found</p>;
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
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="nogada-card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or address..."
              className="nogada-input"
            />
          </div>
        </div>
      </div>
      
      <div className="nogada-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Location ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Address</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Guards</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map(location => (
                <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{location.id}</td>
                  <td className="py-3 px-4">{location.name}</td>
                  <td className="py-3 px-4">{location.address}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {location.guardsCount} guards
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      className="text-blue-600 hover:text-blue-800"
                      size="sm"
                      onClick={() => handleViewLocation(location.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleOpenDialog(location.id)} 
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
                      onClick={() => handleDeleteConfirm(location.id)}
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
            Showing {filteredLocations.length} of {locationData.length} locations
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

export default AdminLocations;
