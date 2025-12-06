'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction } from '@/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

interface VatReportCardProps {
  transactions: Transaction[];
}

export function VatReportCard({ transactions }: VatReportCardProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const { 
    collectedVat, 
    paidVat, 
    vatDifference,
    netRevenue19,
    netRevenue7
  } = useMemo(() => {
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear && transactionDate.getMonth() + 1 === selectedMonth;
    });

    let collectedVat = 0;
    let paidVat = 0;
    let netRevenue19 = 0;
    let netRevenue7 = 0;

    for (const t of filteredTransactions) {
      if (t.type === 'income' && t.vatAmount && t.netAmount) {
        collectedVat += t.vatAmount;
        if (t.taxRate === 19) {
          netRevenue19 += t.netAmount;
        } else if (t.taxRate === 7) {
          netRevenue7 += t.netAmount;
        }
      } else if (t.type === 'expense' && t.vatAmount) {
        paidVat += t.vatAmount;
      }
    }

    return {
      collectedVat,
      paidVat,
      vatDifference: collectedVat - paidVat,
      netRevenue19,
      netRevenue7,
    };
  }, [transactions, selectedYear, selectedMonth]);

  const years = useMemo(() => {
    const allYears = transactions.map(t => new Date(t.date).getFullYear());
    return [...new Set(allYears)].sort((a, b) => b - a);
  }, [transactions]);

  const handleExportCsv = () => {
    const elsterData = [
      { kennzahl: '81', description: 'Steuerpflichtige Umsätze zum Steuersatz von 19 %', value: netRevenue19.toFixed(2) },
      { kennzahl: '86', description: 'Steuerpflichtige Umsätze zum Steuersatz von 7 %', value: netRevenue7.toFixed(2) },
      { kennzahl: '66', description: 'Abziehbare Vorsteuerbeträge', value: paidVat.toFixed(2) },
    ];

    const headers = ['Kennzahl', 'Beschreibung', 'Betrag'];
    const csvRows = [headers.join(';')];

    for (const row of elsterData) {
      const values = [
        row.kennzahl,
        `"${row.description}"`,
        String(row.value).replace('.', ','),
      ];
      csvRows.push(values.join(';'));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ustva_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Umsatzsteuer-Voranmeldung</CardTitle>
        <CardDescription>Berechnung der Umsatzsteuerzahllast für einen ausgewählten Zeitraum.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Monat" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(0, i).toLocaleString('de-DE', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <span className="font-medium">Eingenommene USt. (aus Einnahmen)</span>
                <span className="font-bold text-green-600">{formatCurrency(collectedVat)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <span className="font-medium">Abziehbare Vorsteuer (aus Ausgaben)</span>
                <span className="font-bold text-red-600">{formatCurrency(paidVat)}</span>
            </div>
            <div className="flex justify-between items-center p-4 border-t mt-2">
                <span className="text-lg font-bold">Zahllast / Erstattung</span>
                <span className={`text-xl font-extrabold ${vatDifference >= 0 ? '' : 'text-green-600'}`}>
                    {formatCurrency(vatDifference)}
                </span>
            </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
            <Button onClick={handleExportCsv}>Export für ELSTER (CSV)</Button>
            <Button disabled>Als gemeldet markieren</Button>
        </div>
      </CardContent>
    </Card>
  );
}
