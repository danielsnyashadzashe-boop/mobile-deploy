import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import { mockCarGuards, formatCurrency } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { 
  Edit, 
  Save, 
  X, 
  User, 
  CreditCard, 
  Phone, 
  Shield, 
  HelpCircle, 
  LogOut,
  Camera,
  CheckCircle,
  AlertCircle,
  Smartphone,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form schemas
const personalInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Please select a bank'),
  accountNumber: z.string().min(6, 'Account number must be at least 6 digits'),
  accountType: z.string().min(1, 'Please select account type'),
  branchCode: z.string().min(6, 'Branch code must be 6 digits'),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

const CarGuardProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Using the first mock guard as the logged-in guard
  const guard = mockCarGuards[0];
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Personal info form
  const personalForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: guard.name,
      phoneNumber: guard.phoneNumber || '',
      email: '',
    },
  });

  // Bank details form
  const bankForm = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: guard.bankName || '',
      accountNumber: guard.accountNumber || '',
      accountType: 'savings',
      branchCode: '',
    },
  });
  
  const handlePersonalInfoSave = (data: PersonalInfoFormValues) => {
    console.log('Personal info updated:', data);
    toast.success('Personal information updated successfully!');
    setIsEditingPersonal(false);
  };
  
  const handleBankDetailsSave = (data: BankDetailsFormValues) => {
    console.log('Bank details updated:', data);
    toast.success('Banking details updated successfully!');
    setIsEditingBank(false);
    // In production, this would update the guard data
  };
  
  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo must be smaller than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhoto(result);
        toast.success('Photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleLogout = () => {
    navigate('/car-guard');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const hasBankingDetails = guard.bankName && guard.accountNumber;
  const hasEWalletSetup = guard.phoneNumber;
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-nogada-dark">My Profile</h1>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="banking">
              <CreditCard className="w-4 h-4 mr-2" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="support">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  {!isEditingPersonal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPersonal(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Profile Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-nogada-primary flex items-center justify-center text-white text-2xl font-bold">
                        {getInitials(guard.name)}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      onClick={handlePhotoUpload}
                      type="button"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Tap camera to change photo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {isEditingPersonal ? (
                  <Form {...personalForm}>
                    <form onSubmit={personalForm.handleSubmit(handlePersonalInfoSave)} className="space-y-4">
                      <FormField
                        control={personalForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  {...field} 
                                  className="pl-10"
                                  placeholder="071 234 5678"
                                  inputMode="tel"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Required for e-wallet functionality
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="your.email@example.com"
                                type="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col gap-3 mt-6">
                        <Button type="submit" className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setIsEditingPersonal(false);
                            personalForm.reset();
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Full Name</Label>
                        <div className="font-medium text-lg">{guard.name}</div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Guard ID</Label>
                        <div className="font-medium font-mono">{guard.guardId}</div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Phone Number</Label>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{guard.phoneNumber || 'Not set'}</span>
                          {!guard.phoneNumber && (
                            <AlertCircle className="w-4 h-4 ml-2 text-amber-500" />
                          )}
                        </div>
                        {!guard.phoneNumber && (
                          <p className="text-sm text-amber-600 mt-1">Phone number required for e-wallet</p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Assigned Location</Label>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{guard.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banking Details Tab */}
          <TabsContent value="banking" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Banking Details
                    </CardTitle>
                    <CardDescription>
                      Manage your banking information for payouts
                    </CardDescription>
                  </div>
                  {!isEditingBank && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBank(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {hasBankingDetails ? 'Edit' : 'Add'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!hasBankingDetails && !isEditingBank && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Add your banking details to receive payouts directly to your bank account.
                      Without banking details, you'll only receive voucher payouts.
                    </AlertDescription>
                  </Alert>
                )}

                {isEditingBank ? (
                  <Form {...bankForm}>
                    <form onSubmit={bankForm.handleSubmit(handleBankDetailsSave)} className="space-y-4">
                      <FormField
                        control={bankForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your bank" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="absa">ABSA</SelectItem>
                                <SelectItem value="fnb">FNB</SelectItem>
                                <SelectItem value="standardbank">Standard Bank</SelectItem>
                                <SelectItem value="nedbank">Nedbank</SelectItem>
                                <SelectItem value="capitec">Capitec Bank</SelectItem>
                                <SelectItem value="tymebank">TymeBank</SelectItem>
                                <SelectItem value="discovery">Discovery Bank</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bankForm.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="1234567890"
                                inputMode="numeric"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bankForm.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="savings">Savings</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="transmission">Transmission</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bankForm.control}
                        name="branchCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="250655"
                                inputMode="numeric"
                                maxLength={6}
                              />
                            </FormControl>
                            <FormDescription>
                              6-digit branch code (universal branch code for most banks)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col gap-3 mt-6">
                        <Button type="submit" className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          Save Banking Details
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setIsEditingBank(false);
                            bankForm.reset();
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : hasBankingDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Bank Name</Label>
                        <div className="font-medium">{guard.bankName}</div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Account Number</Label>
                        <div className="font-medium font-mono">
                          ****{guard.accountNumber?.slice(-4)}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Account Type</Label>
                        <div className="font-medium capitalize">Savings</div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-700 font-medium">
                          Banking details verified
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        You'll receive direct bank transfers for payouts
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* E-Wallet Status */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      <span className="font-medium">E-Wallet Setup</span>
                    </div>
                    {hasEWalletSetup ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Setup Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {hasEWalletSetup 
                      ? `E-wallet linked to ${guard.phoneNumber}` 
                      : 'Add your phone number to enable e-wallet functionality'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Help & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-3" />
                  Frequently Asked Questions
                </Button>
                
                <Button variant="ghost" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-3" />
                  Contact Support
                </Button>
                
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-3" />
                  Privacy Policy
                </Button>
                
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-3" />
                  Terms & Conditions
                </Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* App Info */}
            <div className="text-center text-xs text-gray-400 space-y-1">
              <div>Nogada Car Guard App</div>
              <div>Version 1.0.0</div>
              <div>© 2025 Nogada SA</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default CarGuardProfile;