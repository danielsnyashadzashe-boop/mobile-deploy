import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import { 
  mockCarGuards, 
  mockManagers, 
  mockLocations,
  mockTransactions, 
  formatCurrency, 
  formatDateTime
} from '@/data/mockData';
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
import QRCodeDisplay from '@/components/car-guard/QRCodeDisplay';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Form schema for car guard
const guardSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  locationId: z.string().min(1, { message: "Location selection is required." }),
  managerId: z.string().min(1, { message: "Manager selection is required." }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required." }).optional(),
  bankName: z.string().min(2, { message: "Bank name is required." }).optional(),
  accountNumber: z.string().min(5, { message: "Valid account number is required." }).optional()
});

type GuardFormValues = z.infer<typeof guardSchema>;

const AdminGuards = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentGuard, setCurrentGuard] = useState<string | null>(null);
  const [guardData, setGuardData] = useState(mockCarGuards);
  
  // Function to generate a unique QR code
  const generateQRCode = (guardId: string) => {
    // In production, this would generate a more secure code with encryption
    // For now, creating a simple unique string with timestamp and guard ID
    const timestamp = new Date().getTime();
    return `NOGADA-${guardId}-${timestamp}`;
  };

  // Get unique locations for filter
  const locations = mockLocations;
  
  // Filter guards based on search term and selected location
  const filteredGuards = guardData.filter(guard => {
    const matchesSearch = 
      guard.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      guard.guardId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !selectedLocation || guard.locationId === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

  // Form setup
  const form = useForm<GuardFormValues>({
    resolver: zodResolver(guardSchema),
    defaultValues: {
      name: '',
      locationId: '',
      managerId: '',
      phoneNumber: '',
      bankName: '',
      accountNumber: ''
    },
  });

  // Filter managers based on selected location
  const [selectedFormLocationId, setSelectedFormLocationId] = useState<string | null>(null);
  
  // Get filtered managers based on selected location
  const filteredManagers = selectedFormLocationId 
    ? mockManagers.filter(manager => manager.locationId === selectedFormLocationId)
    : mockManagers;

  const handleOpenDialog = (id?: string) => {
    if (id) {
      // Edit mode
      setIsEditing(true);
      setCurrentGuard(id);
      const guard = guardData.find(g => g.id === id);
      if (guard) {
        setSelectedFormLocationId(guard.locationId || null);
        form.reset({
          name: guard.name,
          locationId: guard.locationId || '',
          managerId: guard.managerId || '',
          phoneNumber: guard.phoneNumber || '',
          bankName: guard.bankName || '',
          accountNumber: guard.accountNumber || ''
        });
      }
    } else {
      // Add mode
      setIsEditing(false);
      setCurrentGuard(null);
      setSelectedFormLocationId(null);
      form.reset({
        name: '',
        locationId: '',
        managerId: '',
        phoneNumber: '',
        bankName: '',
        accountNumber: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleShowQRCode = (id: string) => {
    setCurrentGuard(id);
    setIsQrDialogOpen(true);
  };

  const handleViewGuard = (id: string) => {
    setCurrentGuard(id);
    setIsViewDialogOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setCurrentGuard(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteGuard = () => {
    if (currentGuard) {
      // In a real app, this would call an API to delete the guard
      const newGuardData = guardData.filter(guard => guard.id !== currentGuard);
      setGuardData(newGuardData);
      setIsDeleteDialogOpen(false);
      toast.success("Car guard deactivated successfully");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedFormLocationId(locationId);
    form.setValue('locationId', locationId);
    
    // Reset manager selection when location changes
    form.setValue('managerId', '');
  };

  const onSubmit = (data: GuardFormValues) => {
    // Get location name from locationId
    const location = mockLocations.find(loc => loc.id === data.locationId);
    const locationName = location ? location.name : '';
    
    if (isEditing && currentGuard) {
      // Update existing guard
      const updatedGuards = guardData.map(guard => {
        if (guard.id === currentGuard) {
          return {
            ...guard,
            name: data.name,
            locationId: data.locationId,
            location: locationName + (location ? ' - Entrance 3' : ''),
            managerId: data.managerId,
            phoneNumber: data.phoneNumber,
            bankName: data.bankName,
            accountNumber: data.accountNumber
          };
        }
        return guard;
      });
      
      setGuardData(updatedGuards);
      toast.success("Car guard updated successfully");
    } else {
      // Add new guard - now with QR code generation
      const guardId = `NG${(guardData.length + 1).toString().padStart(3, '0')}`;
      const newQrCode = generateQRCode(guardId);
      
      const newGuard = {
        id: `g${guardData.length + 1}`,
        name: data.name,
        guardId: guardId,
        locationId: data.locationId,
        location: locationName + (location ? ' - Entrance 3' : ''),
        balance: 0,
        minPayoutThreshold: 100,
        qrCode: newQrCode,
        managerId: data.managerId,
        phoneNumber: data.phoneNumber,
        bankName: data.bankName,
        accountNumber: data.accountNumber
      };
      
      setGuardData([...guardData, newGuard]);
      setCurrentGuard(newGuard.id);
      
      // Show QR code after adding
      setTimeout(() => {
        toast.success("New car guard added successfully");
        handleCloseDialog();
        setIsQrDialogOpen(true);
      }, 500);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-nogada-dark">Car Guards Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="nogada-btn-primary mt-2 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add New Guard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Car Guard' : 'Add New Car Guard'}</DialogTitle>
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="071 234 5678" {...field} />
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
                        onValueChange={(value) => handleLocationChange(value)} 
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
                
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedFormLocationId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedFormLocationId ? "Assign to a manager" : "Select a location first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredManagers.map(manager => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} - {manager.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Banking Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="FNB, Standard Bank, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">{isEditing ? 'Update Guard' : 'Add Guard'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Guard QR Code</DialogTitle>
            <DialogDescription>
              This QR code can be used for receiving tips.
            </DialogDescription>
          </DialogHeader>
          {currentGuard && (
            <div className="flex justify-center">
              {(() => {
                const guard = guardData.find(g => g.id === currentGuard);
                return guard ? (
                  <QRCodeDisplay 
                    qrCode={guard.qrCode} 
                    guardName={guard.name} 
                    guardId={guard.guardId} 
                  />
                ) : null;
              })()}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsQrDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Guard Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guard Details</DialogTitle>
          </DialogHeader>
          {currentGuard && (
            <div className="space-y-4">
              {(() => {
                const guard = guardData.find(g => g.id === currentGuard);
                const manager = guard?.managerId ? 
                  mockManagers.find(m => m.id === guard.managerId) : null;
                const guardTransactions = guard ? 
                  mockTransactions.filter(t => t.guardId === guard.id) : [];
                
                return guard ? (
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                      <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm font-medium">ID:</div>
                        <div>{guard.guardId}</div>
                        
                        <div className="text-sm font-medium">Name:</div>
                        <div>{guard.name}</div>
                        
                        <div className="text-sm font-medium">Phone Number:</div>
                        <div>{guard.phoneNumber || 'Not provided'}</div>
                        
                        <div className="text-sm font-medium">Location:</div>
                        <div>{guard.location}</div>
                        
                        <div className="text-sm font-medium">Manager:</div>
                        <div>{manager ? manager.name : 'Not assigned'}</div>
                        
                        <div className="text-sm font-medium">Current Balance:</div>
                        <div>{formatCurrency(guard.balance)}</div>
                        
                        <div className="text-sm font-medium">Payout Threshold:</div>
                        <div>{formatCurrency(guard.minPayoutThreshold)}</div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium mb-2">Banking Details</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium">Bank Name:</div>
                          <div>{guard.bankName || 'Not provided'}</div>
                          
                          <div className="text-sm font-medium">Account Number:</div>
                          <div>{guard.accountNumber || 'Not provided'}</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm font-medium mb-2">Status</div>
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="transactions">
                      {guardTransactions.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {guardTransactions.map((transaction) => {
                              const isInflow = transaction.amount > 0;
                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell>{formatDateTime(transaction.timestamp)}</TableCell>
                                  <TableCell>
                                    <span className={`text-xs px-2 py-1 rounded ${isInflow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </span>
                                  </TableCell>
                                  <TableCell>{transaction.description}</TableCell>
                                  <TableCell className={`text-right font-medium ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(Math.abs(transaction.amount))}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found for this guard.
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="qrcode">
                      <div className="flex justify-center py-4">
                        <QRCodeDisplay 
                          qrCode={guard.qrCode} 
                          guardName={guard.name} 
                          guardId={guard.guardId} 
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : <p>Guard not found</p>;
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
            <DialogTitle>Deactivate Car Guard</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this car guard? This action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGuard}>
              Deactivate
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
              placeholder="Search by name or ID..."
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Guard ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Manager</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Current Balance</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuards.map(guard => {
                const managerName = guard.managerId 
                  ? mockManagers.find(m => m.id === guard.managerId)?.name || 'Not assigned'
                  : 'Not assigned';
                  
                return (
                  <tr key={guard.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{guard.guardId}</td>
                    <td className="py-3 px-4">{guard.name}</td>
                    <td className="py-3 px-4">{guard.phoneNumber || 'N/A'}</td>
                    <td className="py-3 px-4">{guard.location}</td>
                    <td className="py-3 px-4">{managerName}</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(guard.balance)}
                      {guard.balance >= guard.minPayoutThreshold && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Eligible for payout
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-800"
                        size="sm"
                        onClick={() => handleViewGuard(guard.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-green-600 hover:text-green-800"
                        size="sm"
                        onClick={() => handleShowQRCode(guard.id)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-gray-600 hover:text-gray-800"
                        size="sm"
                        onClick={() => handleOpenDialog(guard.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-800"
                        size="sm"
                        onClick={() => handleDeleteConfirm(guard.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4 px-4 py-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {filteredGuards.length} of {guardData.length} guards
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

export default AdminGuards;
