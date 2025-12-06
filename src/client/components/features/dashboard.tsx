

'use client';

import { useState, useEffect } from 'react';
import type { DashboardData } from '../../services/dashboardService';
import { getDashboardData } from '../../services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowUpRight, FileText, FolderKanban, HardHat, UserCheck, ListTodo, TrendingDown } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { cn } from '../../lib/utils';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE').format(date);
};

export function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dashboardData = await getDashboardData();
                setData(dashboardData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (!data) {
        return <div>Fehler beim Laden der Dashboard-Daten.</div>;
    }
    
    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                <Link href="/projects">
                                    <Card className={cn("hover:bg-muted/50", { 'animate-blink-green': data.kpi.newRequests > 0 })}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{data.kpi.newRequests}</div>
                                            <p className="text-xs text-muted-foreground text-balance">Anfragen über das Kundenportal</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                                <Link href="/quotes?status=sent">
                                    <Card className="hover:bg-muted/50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Offene Angebote</CardTitle>
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{data.kpi.openQuotes}</div>
                                             <p className="text-xs text-muted-foreground text-balance">Diesen Monat erstellt</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                                 <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Laufende Projekte</CardTitle>
                                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.kpi.activeProjects}</div>
                                        <p className="text-xs text-muted-foreground text-balance">Projekte im Status "Aktiv"</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Ungeplante Projekte</CardTitle>
                                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.kpi.unplannedProjects}</div>
                                        <p className="text-xs text-muted-foreground text-balance">Projekte ohne Startdatum</p>
                                    </CardContent>
                                </Card>
                                <Link href="/finance">
                                    <Card className="hover:bg-muted/50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Ausgaben (Monat)</CardTitle>
                                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{formatCurrency(data.kpi.monthlyExpenses)}</div>
                                            <p className="text-xs text-muted-foreground text-balance">Laufende Betriebsausgaben</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                <Card className="lg:col-span-4">
                                    <CardHeader>
                                        <CardTitle>Projekt-Zeitleiste</CardTitle>
                                        <CardDescription className="text-balance">Die neuesten Aktivitäten und Uploads aus Ihren Projekten.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-2">
                                       <div className="space-y-6">
                                         {data.recentActivities.map((activity, index) => (
                                             <div key={index} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                       <HardHat className="h-4 w-4" />
                                                    </div>
                                                    {index < data.recentActivities.length - 1 && <div className="h-full w-px bg-border" />}
                                                </div>
                                                <div className='w-full'>
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold">{activity.project.projectName}</p>
                                                        <time className="text-xs text-muted-foreground">{formatDate(activity.date)}</time>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground text-balance">{activity.description}</p>
                                                    {activity.imageUrls && activity.imageUrls.length > 0 && (
                                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                                            {activity.imageUrls.slice(0, 3).map(url => (
                                                                url ? ( // Only render if URL is valid
                                                                    <Image
                                                                        key={url}
                                                                        src={url}
                                                                        alt="Baustellenbild"
                                                                        width={150}
                                                                        height={150}
                                                                        className="rounded-md object-cover aspect-square"
                                                                    />
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                             </div>
                                         ))}
                                       </div>
                                    </CardContent>
                                </Card>
                
                                <Card className="lg:col-span-3">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Mitarbeiter-Aktivität</CardTitle>
                                        <Link href="/employees"><Button variant="ghost" size="sm"><ArrowUpRight className="h-4 w-4" /></Button></Link>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {data.employeeStats.map(stat => (
                                                <div key={stat.employee.id} className="flex items-center gap-4">
                                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                                        {stat.employee.photoUrl && <AvatarImage src={stat.employee.photoUrl} alt="Avatar" />}
                                                        <AvatarFallback>{stat.employee.firstName[0]}{stat.employee.lastName[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="grid gap-1">
                                                        <p className="text-sm font-medium leading-none">{stat.employee.firstName} {stat.employee.lastName}</p>
                                                        <p className="text-sm text-muted-foreground">{stat.totalHours.toFixed(2)} Stunden diesen Monat</p>
                                                    </div>
                                                    <div className="ml-auto font-medium">{formatCurrency(stat.grossPay)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Umsatz der letzten 6 Monate</CardTitle>
                                    <CardDescription className="text-balance">
                                        Gesamtumsatz aus Rechnungen pro Monat.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={data.monthlyRevenue}>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${formatCurrency(value as number)}`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'hsl(var(--muted))' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                                <p className="text-sm font-bold mb-1">Umsatz im {payload[0].payload.name}</p>
                                                                <p className="text-sm text-primary">{formatCurrency(payload[0].value as number)}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    );
                }


function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-3 w-3/4 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
             <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
             {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                   <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div >
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    </div >
  );
}
