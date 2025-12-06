
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card';
import { Button } from '@/client/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select';
import { Badge } from '@/client/components/ui/badge';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown, Scale, Bot, FileDown, Loader2 } from 'lucide-react';
import type { Transaction, TransactionCategory, TransactionType } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { getTransactions, saveTransaction, deleteTransaction } from '@/services/financeService';
import { getPnlData, PnlData } from '@/services/pnlService';
import { Skeleton } from '../ui/skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { VatReportCard } from './VatReportCard';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const transactionCategories: TransactionCategory[] = [
  'Umsatzerlöse', 'Materialkosten', 'Personalkosten', 'Fahrzeugkosten', 'Miete', 'Versicherungen', 'Bürobedarf', 'Marketing', 'Steuern', 'Sonstige Ausgaben', 'Privateinlage', 'Privatentnahme'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function FinanceManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      toast({ title: "Fehler", description: "Transaktionen konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const { totalIncome, totalExpenses, balance, expensesByCategory } = useMemo(() => {
    const result = transactions.reduce((acc, t) => {
      if (t.type === 'income') {
        acc.totalIncome += t.amount;
      } else {
        acc.totalExpenses += t.amount;
        acc.expensesByCategory[t.category] = (acc.expensesByCategory[t.category] || 0) + t.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, expensesByCategory: {} as Record<string, number> });

    return {
      totalIncome: result.totalIncome,
      totalExpenses: result.totalExpenses,
      balance: result.totalIncome - result.totalExpenses,
      expensesByCategory: Object.entries(result.expensesByCategory).map(([name, value]) => ({ name, value })),
    };
  }, [transactions]);

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({ title: "Gelöscht", description: "Transaktion wurde entfernt." });
      fetchTransactions();
    } catch (error) {
      toast({ title: "Fehler", description: "Transaktion konnte nicht gelöscht werden.", variant: "destructive" });
    }
  };

  const handleSave = () => {
    setIsFormOpen(false);
    fetchTransactions();
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      toast({ title: "Keine Daten für den Export", description: "Es sind keine Transaktionen zum Exportieren vorhanden.", variant: "destructive" });
      return;
    }

    const headers = ['Datum', 'Beschreibung', 'Betrag', 'Typ', 'Kategorie', 'Projekt-ID'];

    const csvRows = [headers.join(';')];

    for (const transaction of transactions) {
      const values = [
        transaction.date,
        `"${transaction.description.replace(/"/g, '""')}"`,
        String(transaction.amount).replace('.', ','),
        transaction.type,
        transaction.category,
        transaction.projectId || ''
      ];
      csvRows.push(values.join(';'));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `finanztransaktionen_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Export erfolgreich", description: "Die Transaktionsdaten wurden als CSV-Datei heruntergeladen." });
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Gesamteinnahmen</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Gesamtausgaben</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Saldo</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(balance)}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaktionen</CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={handleExportCsv} size="sm" variant="outline" className="gap-1" disabled={transactions.length === 0}><FileDown className="h-4 w-4" /> CSV Export</Button>
                <Button onClick={handleAddNew} size="sm" className="gap-1"><PlusCircle className="h-4 w-4" /> Neue Buchung</Button>
              </div>
            </div>
            <CardDescription>Liste aller Einnahmen und Ausgaben.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Datum</TableHead><TableHead>Beschreibung</TableHead><TableHead>Kategorie</TableHead><TableHead className="text-right">Betrag</TableHead><TableHead><span className="sr-only">Aktion</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                  : transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                      <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Ausgaben nach Kategorie</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <AiAnalysisCard />

      <TransactionFormDialog
        key={editingTransaction?.id || 'new'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={editingTransaction}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

function AiAnalysisCard() {
  const [analysis, setAnalysis] = useState<PnlData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAnalysis = async () => {
    setIsGenerating(true);
    try {
      const pnlData = await getPnlData();
      setAnalysis(pnlData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle>KI-gestützte Finanzanalyse</CardTitle>
          </div>
          <Button onClick={generateAnalysis} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyse der abgeschlossenen Projekte
          </Button>
        </div>
        <CardDescription>Erhalten Sie eine Zusammenfassung Ihrer abgeschlossenen Projekte, um die Profitabilität zu bewerten.</CardDescription>
      </CardHeader>
      <CardContent>
        {isGenerating && <Skeleton className="h-24 w-full" />}
        {analysis && !isGenerating && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div>
              <h4 className="font-bold">Gesamtergebnis</h4>
              <p className="text-sm">
                Der Gesamtumsatz aus {analysis.customers.length > 0 ? analysis.customers.map(c => c.revenue).reduce((a, b) => a + b, 0) > 0 ? 'den ausgewerteten' : '0' : '0'} abgeschlossenen Projekten beträgt <span className="font-semibold text-green-600">{formatCurrency(analysis.totalRevenue)}</span>.
                Davon werden Gesamtkosten von <span className="font-semibold text-red-600">{formatCurrency(analysis.totalCosts)}</span> abgezogen,
                was zu einem Nettogewinn von <span className="font-bold text-lg">{formatCurrency(analysis.netProfit)}</span> führt.
              </p>
            </div>
            <div>
              <h4 className="font-bold">Kostenzusammensetzung</h4>
              <p className="text-sm">
                Die Kosten teilen sich auf in <span className="font-semibold">{formatCurrency(analysis.totalMaterialCosts)}</span> für Material und <span className="font-semibold">{formatCurrency(analysis.totalPersonnelCosts)}</span> für Personal.
              </p>
            </div>
            {analysis.customers[0] && (
              <div>
                <h4 className="font-bold">Top-Kunde</h4>
                <p className="text-sm">
                  Der profitabelste Kunde war <span className="font-semibold">{analysis.customers[0].name}</span> mit einem Gewinn von <span className="font-semibold">{formatCurrency(analysis.customers[0].profit)}</span>.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSave: () => void;
  onDelete: (id: string) => Promise<void>;
}

function TransactionFormDialog({ open, onOpenChange, transaction, onSave, onDelete }: TransactionFormDialogProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // State for tax calculation
  const [amount, setAmount] = useState<number | string>(transaction?.amount || '');
  const [taxRate, setTaxRate] = useState<number>(transaction?.taxRate || 19);
  const [vatAmount, setVatAmount] = useState<number>(transaction?.vatAmount || 0);
  const [netAmount, setNetAmount] = useState<number>(transaction?.netAmount || 0);

  useEffect(() => {
    const grossAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    if (!isNaN(grossAmount) && grossAmount > 0) {
      const calculatedNetAmount = grossAmount / (1 + taxRate / 100);
      const calculatedVatAmount = grossAmount - calculatedNetAmount;
      setNetAmount(calculatedNetAmount);
      setVatAmount(calculatedVatAmount);
    } else {
      setNetAmount(0);
      setVatAmount(0);
    }
  }, [amount, taxRate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const grossAmount = parseFloat((formData.get('amount') as string).replace(',', '.'));

    const data: Omit<Transaction, 'id' | 'createdAt' | 'receiptUrl'> = {
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      amount: grossAmount,
      netAmount: netAmount,
      vatAmount: vatAmount,
      taxRate: parseInt(formData.get('taxRate') as string) as 19 | 7 | 0,
      category: formData.get('category') as TransactionCategory,
      type: formData.get('type') as TransactionType,
      projectId: formData.get('projectId') as string || null,
    };

    console.log('Saving transaction with data:', { ...data, id: transaction?.id });

    try {
      await saveTransaction({ ...data, id: transaction?.id });
      toast({ title: "Gespeichert", description: "Transaktion wurde erfolgreich gespeichert.", className: "bg-accent text-accent-foreground" });
      onSave();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      toast({ title: "Fehler", description: "Konnte Transaktion nicht speichern.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (transaction) {
      await onDelete(transaction.id);
      onOpenChange(false);
    }
  };

  const incomeCategories: TransactionCategory[] = ['Umsatzerlöse', 'Privateinlage'];
  const expenseCategories: TransactionCategory[] = transactionCategories.filter(c => !incomeCategories.includes(c));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{transaction ? 'Buchung bearbeiten' : 'Neue Buchung'}</DialogTitle>
            <DialogDescription>Erfassen Sie eine Einnahme oder Ausgabe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Typ</Label>
              <Select name="type" value={type} onValueChange={(v) => setType(v as TransactionType)} required>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="expense">Ausgabe</SelectItem><SelectItem value="income">Einnahme</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Datum</Label>
              <Input id="date" name="date" type="date" defaultValue={transaction?.date || new Date().toISOString().split('T')[0]} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Beschreibung</Label>
              <Input id="description" name="description" defaultValue={transaction?.description} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Bruttobetrag (€)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxRate" className="text-right">Steuersatz</Label>
              <Select name="taxRate" value={taxRate.toString()} onValueChange={(v) => setTaxRate(parseInt(v))} required>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="19">19%</SelectItem>
                  <SelectItem value="7">7%</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="netAmount" className="text-right">Nettobetrag (€)</Label>
              <Input id="netAmount" name="netAmount" type="number" step="0.01" value={netAmount.toFixed(2)} className="col-span-3 bg-muted" readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vatAmount" className="text-right">USt.-Betrag (€)</Label>
              <Input id="vatAmount" name="vatAmount" type="number" step="0.01" value={vatAmount.toFixed(2)} className="col-span-3 bg-muted" readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Kategorie</Label>
              <Select name="category" defaultValue={transaction?.category} required>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Kategorie auswählen" /></SelectTrigger>
                <SelectContent>
                  {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {transaction && (
              <Button type="button" variant="destructive" onClick={handleDeleteClick} className="mr-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Löschen
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

