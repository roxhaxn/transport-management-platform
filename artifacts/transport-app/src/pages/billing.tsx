import { useListBills, getListBillsQueryKey, useCreateBill, useUpdateBill, useListTrips, getListTripsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const billSchema = z.object({
  tripId: z.coerce.number().min(1, "Trip is required"),
  baseAmount: z.coerce.number().min(1, "Base amount must be greater than 0"),
  fuelSurcharge: z.coerce.number().optional().default(0),
  tollCharges: z.coerce.number().optional().default(0),
  otherCharges: z.coerce.number().optional().default(0),
  dueDate: z.string().optional(),
});

export default function Billing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: bills, isLoading: loadingBills } = useListBills(undefined, {
    query: { queryKey: getListBillsQueryKey() }
  });

  const { data: trips } = useListTrips(undefined, {
    query: { queryKey: getListTripsQueryKey() }
  });

  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  const form = useForm<z.infer<typeof billSchema>>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      tripId: 0,
      baseAmount: 0,
      fuelSurcharge: 0,
      tollCharges: 0,
      otherCharges: 0,
      dueDate: "",
    }
  });

  const onSubmit = (data: z.infer<typeof billSchema>) => {
    createBill.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
          setIsAddOpen(false);
          form.reset();
        }
      }
    );
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateBill.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        }
      }
    );
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/billing/export/csv');
      if (!response.ok) throw new Error('Export failed');
      const data = await response.json();
      
      const csvContent = [
        data.headers.join(','),
        ...data.rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'bills_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Export successful", description: "CSV file downloaded" });
    } catch (err) {
      toast({ title: "Export failed", description: "Could not export bills", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Bill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tripId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trip" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {trips?.map(trip => (
                              <SelectItem key={trip.id} value={trip.id.toString()}>
                                #{trip.id} - {trip.clientCompany}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="baseAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fuelSurcharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Surcharge ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tollCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Toll Charges ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="otherCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Charges ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createBill.isPending}>
                    {createBill.isPending ? "Creating..." : "Create Bill"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Number</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBills ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading bills...</TableCell>
              </TableRow>
            ) : bills?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bills found.</TableCell>
              </TableRow>
            ) : (
              bills?.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>Trip #{bill.tripId}</TableCell>
                  <TableCell>${bill.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{bill.issuedDate ? new Date(bill.issuedDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      bill.status === 'paid' ? 'default' : 
                      bill.status === 'overdue' ? 'destructive' : 
                      bill.status === 'issued' ? 'secondary' : 'outline'
                    }>
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select defaultValue={bill.status} onValueChange={(val) => handleStatusChange(bill.id, val)}>
                      <SelectTrigger className="w-[120px] ml-auto h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
