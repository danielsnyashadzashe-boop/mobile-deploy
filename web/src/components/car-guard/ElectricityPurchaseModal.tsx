import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency } from '@/data/mockData';
import { Zap, Home, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const electricitySchema = z.object({
  provider: z.string().min(1, "Please select a provider"),
  meterNumber: z.string().min(11, "Please enter a valid meter number"),
  amount: z.string().min(1, "Please select or enter an amount"),
  saveDetails: z.boolean().optional(),
});

type ElectricityFormValues = z.infer<typeof electricitySchema>;

interface ElectricityPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (data: ElectricityFormValues) => void;
  balance: number;
  isMobile: boolean;
}

const ElectricityPurchaseModal: React.FC<ElectricityPurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  balance,
  isMobile
}) => {
  const [savedMeters, setSavedMeters] = useState<{name: string; number: string}[]>([
    { name: 'Home', number: '01234567890' },
    { name: 'Mom\'s House', number: '09876543210' }
  ]);

  const form = useForm<ElectricityFormValues>({
    resolver: zodResolver(electricitySchema),
    defaultValues: {
      provider: 'eskom',
      meterNumber: '',
      amount: '',
      saveDetails: false,
    },
  });

  const handleSubmit = (data: ElectricityFormValues) => {
    onPurchase(data);
    form.reset();
  };

  const quickAmounts = ['50', '100', '200', '300', '500'];

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Provider Selection */}
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Electricity Provider</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="eskom"
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      field.value === 'eskom' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="eskom" id="eskom" className="sr-only" />
                    <Zap className="h-6 w-6 mb-1" />
                    <span className="font-medium">Eskom</span>
                  </Label>
                  <Label
                    htmlFor="city-power"
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      field.value === 'city-power' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="city-power" id="city-power" className="sr-only" />
                    <Building2 className="h-6 w-6 mb-1" />
                    <span className="font-medium">City Power</span>
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Saved Meters */}
        {savedMeters.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Select</Label>
            <div className="grid grid-cols-1 gap-2">
              {savedMeters.map((meter, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('meterNumber', meter.number)}
                  className="justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{meter.name}</span>
                  <span className="text-xs text-gray-500">{meter.number}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Meter Number */}
        <FormField
          control={form.control}
          name="meterNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meter Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="01234567890" 
                  {...field}
                  inputMode="numeric"
                  maxLength={11}
                />
              </FormControl>
              <FormDescription>Enter your 11-digit meter number</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount Selection */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Amount</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant={field.value === amt ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(amt)}
                        className="font-medium"
                      >
                        R{amt}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant={field.value === '1000' ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange('1000')}
                      className="font-medium col-span-3"
                    >
                      R1000
                    </Button>
                  </div>
                  {/* Custom amount input */}
                  <Input
                    type="number"
                    placeholder="Enter custom amount"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    inputMode="numeric"
                    min="1"
                    max={balance.toString()}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Save Details Checkbox */}
        <FormField
          control={form.control}
          name="saveDetails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                Save meter details for quick access
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Balance Display */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Balance:</span>
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
          {form.watch('amount') && (
            <>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Purchase Amount:</span>
                <span className="font-semibold">R{form.watch('amount')}</span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-2 border-t">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className={`font-semibold ${(balance - parseFloat(form.watch('amount') || '0')) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance - parseFloat(form.watch('amount') || '0'))}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            You will receive a token via SMS once the purchase is complete. 
            Processing usually takes 1-2 minutes.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        {isMobile ? (
          <DrawerFooter className="px-0">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={balance < parseFloat(form.watch('amount') || '0')}
            >
              Purchase Electricity
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              onClick={onClose}
              className="w-full"
            >
              Cancel
            </Button>
          </DrawerFooter>
        ) : (
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={balance < parseFloat(form.watch('amount') || '0')}
            >
              Purchase Electricity
            </Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Buy Electricity</DrawerTitle>
            <DrawerDescription>
              Purchase prepaid electricity tokens
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buy Electricity</DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};

export default ElectricityPurchaseModal;