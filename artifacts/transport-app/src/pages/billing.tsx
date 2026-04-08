import { useListBills, getListBillsQueryKey, useCreateBill, useUpdateBill, useListTrips, getListTripsQueryKey, useRecordPayment, useGetInvoiceData } from "@workspace/api-client-react";
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
import { Plus, Download, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import type { InvoiceData } from "@workspace/api-client-react/src/generated/api.schemas";

const billSchema = z.object({
  tripId: z.coerce.number().min(1, "Trip is required"),
  baseAmount: z.coerce.number().min(1, "Base amount must be greater than 0"),
  fuelSurcharge: z.coerce.number().optional().default(0),
  tollCharges: z.coerce.number().optional().default(0),
  otherCharges: z.coerce.number().optional().default(0),
  dueDate: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().optional(),
});

function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF();
  const { bill, trip, client, truck, driver } = data;
  
  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Bill number and date
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${bill.billNumber}`, 15, 35);
  doc.text(`Date: ${bill.issuedDate ? new Date(bill.issuedDate).toLocaleDateString() : 'N/A'}`, 15, 42);
  doc.text(`Due: ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}`, 15, 49);
  
  // Client info
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(client?.name ?? trip.clientCompany, 15, 69);
  if (client?.contactName) doc.text(client.contactName, 15, 76);
  if (client?.phone) doc.text(client.phone, 15, 83);
  if (client?.gstNumber) doc.text(`GST: ${client.gstNumber}`, 15, 90);
  
  // Trip info
  doc.setFont('helvetica', 'bold');
  doc.text('Trip Details:', 15, 103);
  doc.setFont('helvetica', 'normal');
  doc.text(`Route: ${trip.origin} -> ${trip.destination}`, 15, 110);
  doc.text(`Truck: ${truck.registrationNumber} (${truck.model})`, 15, 117);
  doc.text(`Driver: ${driver.name}`, 15, 124);
  doc.text(`Cargo: ${trip.cargoDescription}`, 15, 131);
  
  // Amounts table
  doc.setFont('helvetica', 'bold');
  doc.text('Charges', 15, 144);
  doc.line(15, 147, 195, 147);
  doc.setFont('helvetica', 'normal');
  doc.text('Base Amount', 15, 155);
  doc.text(`Rs. ${Number(bill.baseAmount).toLocaleString()}`, 160, 155, { align: 'right' });
  doc.text('Fuel Surcharge', 15, 163);
  doc.text(`Rs. ${Number(bill.fuelSurcharge).toLocaleString()}`, 160, 163, { align: 'right' });
  doc.text('Toll Charges', 15, 171);
  doc.text(`Rs. ${Number(bill.tollCharges).toLocaleString()}`, 160, 171, { align: 'right' });
  doc.text('Other Charges', 15, 179);
  doc.text(`Rs. ${Number(bill.otherCharges).toLocaleString()}`, 160, 179, { align: 'right' });
  doc.line(15, 183, 195, 183);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount', 15, 191);
  doc.text(`Rs. ${Number(bill.totalAmount).toLocaleString()}`, 160, 191, { align: 'right' });
  doc.text('Amount Paid', 15, 199);
  doc.text(`Rs. ${Number(bill.amountPaid).toLocaleString()}`, 160, 199, { align: 'right' });
  doc.text('Balance Due', 15, 207);
  doc.text(`Rs. ${(Number(bill.totalAmount) - Number(bill.amountPaid)).toLocaleString()}`, 160, 207, { align: 'right' });
  
  // Status
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Status: ${bill.status.toUpperCase()}`, 15, 220);
  if (bill.paymentMethod) doc.text(`Payment Method: ${bill.paymentMethod}`, 15, 227);
  
  doc.save(`invoice-${bill.billNumber}.pdf`);
}

export default function Billing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [paymentBillId, setPaymentBillId] = useState<number | null>(null);

  const { data: bills, isLoading: loadingBills } = useListBills(undefined, {
    query: { queryKey: getListBillsQueryKey() }
  });

  const { data: trips } = useListTrips(undefined, {
    query: { queryKey: getListTripsQueryKey() }
  });

  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const recordPayment = useRecordPayment();

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

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "",
      paymentDate: new Date().toISOString().split('T')[0],
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

  const onPaymentSubmit = (data: z.infer<typeof paymentSchema>) => {
    if (!paymentBillId) return;
    recordPayment.mutate(
      { id: paymentBillId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
          setPaymentBillId(null);
          paymentForm.reset();
          toast({ title: "Payment recorded successfully" });
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

  const handleDownloadInvoice = async (billId: number) => {
    try {
      const response = await fetch(`/api/billing/${billId}/invoice`);
      if (!response.ok) throw new Error('Failed to fetch invoice data');
      const invoiceData = await response.json();
      generateInvoicePdf(invoiceData);
      toast({ title: "Invoice downloaded" });
    } catch (err) {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    }
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

  const openPaymentModal = (bill: any) => {
    setPaymentBillId(bill.id);
    const balance = bill.totalAmount - bill.amountPaid;
    paymentForm.reset({
      amount: balance,
      paymentMethod: "",
      paymentDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
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

          <Dialog open={paymentBillId !== null} onOpenChange={(open) => !open && setPaymentBillId(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={recordPayment.isPending}>
                    {recordPayment.isPending ? "Recording..." : "Record Payment"}
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
              <TableHead>Paid / Balance</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBills ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading bills...</TableCell>
              </TableRow>
            ) : bills?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No bills found.</TableCell>
              </TableRow>
            ) : (
              bills?.map((bill) => {
                const balance = bill.totalAmount - bill.amountPaid;
                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>Trip #{bill.tripId}</TableCell>
                    <TableCell>${bill.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm text-green-600 font-medium">${bill.amountPaid.toLocaleString()}</div>
                      {balance > 0 && <div className="text-xs text-destructive">Bal: ${balance.toLocaleString()}</div>}
                    </TableCell>
                    <TableCell>{bill.issuedDate ? new Date(bill.issuedDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Select defaultValue={bill.status} onValueChange={(val) => handleStatusChange(bill.id, val)}>
                        <SelectTrigger className={`w-[110px] h-8 text-xs ${
                          bill.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          bill.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50'
                        }`}>
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
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openPaymentModal(bill)} title="Record Payment">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(bill.id)} title="Download Invoice PDF">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
