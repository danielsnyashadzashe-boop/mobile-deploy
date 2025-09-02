import React from 'react';
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
import { Smartphone } from 'lucide-react';

const airtimeSchema = z.object({
  network: z.string().min(1, "Please select a network"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  amount: z.string().min(1, "Please select or enter an amount"),
});

type AirtimeFormValues = z.infer<typeof airtimeSchema>;

interface AirtimePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (data: AirtimeFormValues) => void;
  balance: number;
  isMobile: boolean;
}

const AirtimePurchaseModal: React.FC<AirtimePurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  balance,
  isMobile
}) => {
  const form = useForm<AirtimeFormValues>({
    resolver: zodResolver(airtimeSchema),
    defaultValues: {
      network: '',
      phoneNumber: '',
      amount: '',
    },
  });

  const handleSubmit = (data: AirtimeFormValues) => {
    onPurchase(data);
    form.reset();
  };

  const quickAmounts = ['10', '25', '50', '100', '200'];

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Network Selection */}
        <FormField
          control={form.control}
          name="network"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Network</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="vodacom"
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      field.value === 'vodacom' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="vodacom" id="vodacom" className="sr-only" />
                    <span className="font-medium">Vodacom</span>
                  </Label>
                  <Label
                    htmlFor="mtn"
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      field.value === 'mtn' 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="mtn" id="mtn" className="sr-only" />
                    <span className="font-medium">MTN</span>
                  </Label>
                  <Label
                    htmlFor="cellc"
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      field.value === 'cellc' 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="cellc" id="cellc" className="sr-only" />
                    <span className="font-medium">Cell C</span>
                  </Label>
                  <Label
                    htmlFor="telkom"
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      field.value === 'telkom' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="telkom" id="telkom" className="sr-only" />
                    <span className="font-medium">Telkom</span>
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="071 234 5678" 
                    {...field}
                    className="pl-10"
                    inputMode="tel"
                    type="tel"
                  />
                </div>
              </FormControl>
              <FormDescription>Enter the number to receive airtime</FormDescription>
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

        {/* Balance Display */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Balance:</span>
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
          {form.watch('amount') && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">After Purchase:</span>
              <span className={`font-semibold ${(balance - parseFloat(form.watch('amount') || '0')) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(balance - parseFloat(form.watch('amount') || '0'))}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isMobile ? (
          <DrawerFooter className="px-0">
            <Button type="submit" size="lg" className="w-full">
              Purchase Airtime
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
            <Button type="submit">Purchase Airtime</Button>
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
            <DrawerTitle>Buy Airtime</DrawerTitle>
            <DrawerDescription>
              Purchase airtime using your available balance
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buy Airtime</DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};

export default AirtimePurchaseModal;