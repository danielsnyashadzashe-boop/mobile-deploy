import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TippaLogo from '@/components/shared/TippaLogo';
import { toast } from "sonner";
import { mockLocations } from '@/data/mockData';

const CarGuardRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    preferredLocation: '',
    bankName: '',
    accountNumber: '',
    accountType: '',
    branchCode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.preferredLocation) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Simulate registration submission
    console.log('Registration submitted:', formData);
    toast.success("Registration submitted! You'll receive an SMS once approved.");
    
    // Store registration in localStorage (in production, this would be an API call)
    const pendingRegistrations = JSON.parse(localStorage.getItem('pendingRegistrations') || '[]');
    pendingRegistrations.push({
      ...formData,
      id: `pr-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    });
    localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
    
    // Navigate back to login
    setTimeout(() => {
      navigate('/car-guard');
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-tippa-primary to-tippa-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <TippaLogo size="lg" />
          <h1 className="text-2xl font-bold text-white mt-4">Guard Registration</h1>
          <p className="text-white/80 mt-2">Apply to become a Nogada car guard</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
            <CardDescription>
              Fill in your details below. You'll be notified via SMS once your application is approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Personal Information</h3>
                
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Mokoena"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="9001015800084"
                    maxLength={13}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="073 456 7890"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Work Location */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Work Location</h3>
                
                <div>
                  <Label htmlFor="preferredLocation">Preferred Location *</Label>
                  <Select
                    value={formData.preferredLocation}
                    onValueChange={(value) => setFormData({ ...formData, preferredLocation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Banking Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Banking Details (Optional)</h3>
                <p className="text-xs text-gray-500">You can add or update these later</p>
                
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Select
                    value={formData.bankName}
                    onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fnb">FNB</SelectItem>
                      <SelectItem value="standardbank">Standard Bank</SelectItem>
                      <SelectItem value="absa">ABSA</SelectItem>
                      <SelectItem value="nedbank">Nedbank</SelectItem>
                      <SelectItem value="capitec">Capitec</SelectItem>
                      <SelectItem value="tymebank">TymeBank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="transmission">Transmission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="branchCode">Branch Code</Label>
                  <Input
                    id="branchCode"
                    name="branchCode"
                    type="text"
                    value={formData.branchCode}
                    onChange={handleChange}
                    placeholder="250655"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Submit Registration
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/car-guard" className="text-tippa-primary hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarGuardRegister;