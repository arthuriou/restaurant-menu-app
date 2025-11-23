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

// Mock Data
const MOCK_INVOICES = [
  { id: "INV-001", table: "Table 4", total: 12500, date: "21/11/2024 12:30", status: "paid", method: "Carte" },
  { id: "INV-002", table: "Table 2", total: 4500, date: "21/11/2024 12:45", status: "paid", method: "Espèces" },
  { id: "INV-003", table: "Table 6", total: 28000, date: "21/11/2024 13:15", status: "pending", method: "-" },
  { id: "INV-004", table: "Table 1", total: 8900, date: "21/11/2024 13:30", status: "paid", method: "Mobile" },
  { id: "INV-005", table: "Table 3", total: 15600, date: "21/11/2024 13:45", status: "paid", method: "Carte" },
];

export default function ServerInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvoices = MOCK_INVOICES.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.table.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.table}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{invoice.date}</TableCell>
                  <TableCell className="font-bold">{invoice.total.toLocaleString()} FCFA</TableCell>
                  <TableCell>{invoice.method}</TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
