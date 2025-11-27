"use client";
// Force re-compile

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Printer, Eye, Download, FileText } from "lucide-react";
import { useState } from "react";
import { useInvoiceStore } from "@/stores/invoices";

export default function ServerInvoicesPage() {
  const { invoices } = useInvoiceStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.tableId && inv.tableId.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

  const handlePrint = (invoiceId: string) => {
    window.open(`/admin/invoices/${invoiceId}/print`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground">Historique des encaissements et factures en attente.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher (N°, Table)..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Dernières Factures
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune facture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.tableId || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(invoice.createdAt.seconds * 1000).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-bold">{invoice.total.toLocaleString()} FCFA</TableCell>
                    <TableCell>
                      {invoice.paymentMethod === 'cash' && 'Espèces'}
                      {invoice.paymentMethod === 'card' && 'Carte'}
                      {invoice.paymentMethod === 'mobile' && 'Mobile'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={
                        invoice.status === 'paid' 
                          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
                      }>
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handlePrint(invoice.id)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
