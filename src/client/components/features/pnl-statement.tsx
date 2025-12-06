
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { getPnlData, PnlData } from '@/services/pnlService';
import { Skeleton } from '../ui/skeleton';


const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

export function PnlStatement() {
    const [pnlData, setPnlData] = useState<PnlData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getPnlData();
                setPnlData(data);
            } catch (error) {
                console.error("Failed to fetch PNL data", error);
                // Optionally set an error state here to show in the UI
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                 <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <Card key={i}>
                             <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-2/3" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-7 w-1/2" />
                                <Skeleton className="h-3 w-1/3 mt-1" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!pnlData || pnlData.customers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gewinn- und Verlustrechnung</CardTitle>
                    <CardDescription>
                        Aktuell sind keine abgeschlossenen Projekte mit Rechnungen und Kosten vorhanden, um eine Auswertung zu erstellen.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground mt-8">Bitte schließen Sie zuerst Projekte ab, um hier Daten zu sehen.</p>
                </CardContent>
            </Card>
        )
    }

    const profitMargin = pnlData.totalRevenue > 0 ? pnlData.netProfit / pnlData.totalRevenue : 0;

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pnlData.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">aus abgeschlossenen Projekten</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Gesamtkosten</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pnlData.totalCosts)}</div>
                        <p className="text-xs text-muted-foreground">Material- & Personalkosten</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Nettogewinn</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pnlData.netProfit)}</div>
                        <p className="text-xs text-muted-foreground">vor Steuern</p>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Gewinnmarge</CardTitle>
                        <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {profitMargin.toLocaleString('de-DE', { style: 'percent', minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Durchschnittliche Marge</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Gewinn nach Kunde</CardTitle>
                    <CardDescription>
                        Eine Übersicht über den Gewinnbeitrag der einzelnen Kunden (Top 20).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={pnlData.customers.slice(0, 20)}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${formatCurrency(value as number)}`}
                            />
                             <Tooltip 
                                cursor={{fill: 'hsl(var(--background))'}}
                                content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="rounded-lg border bg-card p-2 shadow-sm text-sm">
                                      <p className="font-bold mb-2">{data.name}</p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <span className="text-muted-foreground">Gewinn:</span>
                                        <span className="font-bold text-right">{formatCurrency(data.profit)}</span>
                                        <span className="text-muted-foreground">Umsatz:</span>
                                        <span className="text-right">{formatCurrency(data.revenue)}</span>
                                        <span className="text-muted-foreground">Kosten:</span>
                                        <span className="text-right">{formatCurrency(data.cost)}</span>
                                      </div>
                                    </div>
                                  )
                                }
                          
                                return null
                              }}
                            />
                            <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
