import { NextResponse } from 'next/server';
import { getAllCustomers } from '@/server/services/customerService.admin';
import { getQuotesAdmin as getQuotes } from '@/server/services/quoteService.admin';
import { getInvoices } from '@/server/services/invoiceService';
import { getAllProjects } from '@/server/services/projectService.admin';
import { getEmployees } from '@/server/services/employeeService.admin';
import { getTransactions } from '@/server/services/financeService.admin';
import type { Customer, Quote, Project, Employee, SiteLog, TimeEntry, Invoice, Transaction } from '@/shared/types';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';

interface KpiData {
    newRequests: number;
    openQuotes: number;
    activeProjects: number;
    unplannedProjects: number;
    monthlyExpenses: number;
}

interface EmployeeStat {
    employee: Employee;
    totalHours: number;
    grossPay: number;
}

interface RecentActivity {
    project: Project;
    description: string;
    imageUrls: string[];
    date: string;
}

interface MonthlyRevenue {
    name: string;
    total: number;
}

export interface DashboardData {
    kpi: KpiData;
    employeeStats: EmployeeStat[];
    recentActivities: RecentActivity[];
    monthlyRevenue: MonthlyRevenue[];
}

export async function GET() {
    console.log('[GET /api/dashboard] - Request received');
    try {
        const db = getFirebaseAdminDb();
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Fetch all base data in parallel
        console.log('[GET /api/dashboard] - Fetching base data...');
        const [
            customersResult,
            quotesResult,
            projectsResult,
            employeesResult,
            invoicesResult,
            transactionsResult,
        ] = await Promise.allSettled([
            getAllCustomers(),
            getQuotes(),
            getAllProjects(),
            getEmployees(),
            getInvoices(),
            getTransactions(),
        ]);
        console.log('[GET /api/dashboard] - Base data fetching settled.');
        console.log({
            customersResult: customersResult.status,
            quotesResult: quotesResult.status,
            projectsResult: projectsResult.status,
            employeesResult: employeesResult.status,
            invoicesResult: invoicesResult.status,
            transactionsResult: transactionsResult.status,
        });

        const getFulfilledValue = <T>(result: PromiseSettledResult<T[]>): T[] => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                return result.value;
            }
            if (result.status === 'rejected') {
                console.error(`[GET /api/dashboard] - A promise was rejected:`, result.reason);
            }
            return [];
        };

        if (customersResult.status === 'rejected') {
            return NextResponse.json({ error: `Failed to fetch customers: ${customersResult.reason}` }, { status: 500 });
        }
        if (quotesResult.status === 'rejected') {
            return NextResponse.json({ error: `Failed to fetch quotes: ${quotesResult.reason}` }, { status: 500 });
        }
        if (projectsResult.status === 'rejected') {
            return NextResponse.json({ error: `Failed to fetch projects: ${projectsResult.reason}` }, { status: 500 });
        }
        if (employeesResult.status === 'rejected') {
            return NextResponse.json({ error: `Failed to fetch employees: ${employeesResult.reason}` }, { status: 500 });
        }
        if (invoicesResult.status === 'rejected') {
            return NextResponse.json({ error: `Failed to fetch invoices: ${invoicesResult.reason}` }, { status: 500 });
        }
        if (transactionsResult.status === 'rejected') {
            return NextResponse.json({ error: `Failed to fetch transactions: ${transactionsResult.reason}` }, { status: 500 });
        }

        const customers = getFulfilledValue(customersResult);
        const quotes = getFulfilledValue(quotesResult);
        const projects = getFulfilledValue(projectsResult);
        const employees = getFulfilledValue(employeesResult);
        const invoices = getFulfilledValue(invoicesResult);
        const transactions = getFulfilledValue(transactionsResult);

        console.log('[GET /api/dashboard] - Base data fetched and processed successfully.');

        // Create a map for projects for efficient lookup
        const projectsMap = new Map(projects.map((p: Project) => [p.id, p]));

        // 2. Calculate KPIs
        console.log('[GET /api/dashboard] - Calculating KPIs...');
        const newRequests = customers.filter((c: Customer) => c.status === 'Kundenportal NEU').length;
        const openQuotes = quotes.filter((q: Quote) => q.status === 'sent' && new Date(q.date) >= firstDayOfMonth).length;
        const activeProjects = projects.filter((p: Project) => p.status === 'Aktiv').length;
        const unplannedProjects = projects.filter((p: Project) => !p.startDate && p.status !== 'Abgeschlossen' && p.status !== 'on-hold').length;
        const monthlyExpenses = transactions
            .filter((t: Transaction) => t.type === 'expense' && new Date(t.date) >= firstDayOfMonth)
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);


        const kpi: KpiData = { newRequests, openQuotes, activeProjects, unplannedProjects, monthlyExpenses };
        console.log('[GET /api/dashboard] - KPIs calculated.');

        // 3. Calculate Employee Stats
        console.log('[GET /api/dashboard] - Calculating Employee Stats...');
        let monthlyTimeEntries: TimeEntry[] = [];
        try {
            const timeEntriesSnap = await db.collection('timeEntries').where('date', '>=', firstDayOfMonth).get();
            monthlyTimeEntries = timeEntriesSnap.docs.map(doc => doc.data() as TimeEntry);
        } catch (e: any) {
            console.log("[GET /api/dashboard] - Error while getting time entries", e.message, e.stack);
        }

        const employeeHoursMap = new Map<string, number>();
        monthlyTimeEntries.forEach(entry => {
            const currentHours = employeeHoursMap.get(entry.employeeId) || 0;
            let startTime, endTime, duration;

            try {
                startTime = new Date(`${entry.date}T${entry.startTime}`);
                endTime = new Date(`${entry.date}T${entry.endTime}`);
                duration = (endTime.getTime() - startTime.getTime()) / 3600000;
            } catch (e: any) {
                console.log("[GET /api/dashboard] - Error while calculating duration", e.message, e.stack, entry);
                return;
            }

            employeeHoursMap.set(entry.employeeId, currentHours + duration);
        });

        const employeeStats: EmployeeStat[] = employees
            .map((employee: Employee) => {
                const totalHours = employeeHoursMap.get(employee.id) || 0;
                return {
                    employee,
                    totalHours,
                    grossPay: totalHours * employee.hourlyRate,
                }
            })
            .filter((stat: EmployeeStat) => stat.totalHours > 0)
            .sort((a: EmployeeStat, b: EmployeeStat) => b.totalHours - a.totalHours)
            .slice(0, 5); // Top 5 active employees
        console.log('[GET /api/dashboard] - Employee Stats calculated.');


        // 4. Get Recent Activities
        console.log('[GET /api/dashboard] - Getting Recent Activities...');
        let recentLogsSnap = null;
        try {
            recentLogsSnap = await db.collection('siteLogs').orderBy('date', 'desc').limit(5).get();
        } catch (e: any) {
            console.log("[GET /api/dashboard] - Error while getting sitelogs", e.message, e.stack);
        }

        const recentActivities: RecentActivity[] = recentLogsSnap ? recentLogsSnap.docs.map(doc => {
            const log = doc.data() as SiteLog;
            const project = projectsMap.get(log.projectId);
            return {
                project: project || { id: 'unknown', projectName: 'Unbekanntes Projekt' } as Project,
                description: log.description || log.type,
                imageUrls: log.imageUrls || [],
                date: log.date
            }
        }) : [];
        console.log('[GET /api/dashboard] - Recent Activities fetched.');

        // 5. Calculate Monthly Revenue for the last 6 months
        console.log('[GET /api/dashboard] - Calculating Monthly Revenue...');
        const monthlyRevenue: MonthlyRevenue[] = [];
        const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit' });

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const nextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

            const monthName = monthFormatter.format(date);

            const revenueForMonth = invoices
                .filter((inv: Invoice) => {
                    const invDate = new Date(inv.date);
                    // Ensure invoice has a valid date
                    if (isNaN(invDate.getTime())) return false;
                    return invDate >= date && invDate < nextMonthDate;
                })
                .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

            monthlyRevenue.push({ name: monthName, total: revenueForMonth });
        }
        console.log('[GET /api/dashboard] - Monthly Revenue calculated.');

        const dashboardData: DashboardData = {
            kpi,
            employeeStats,
            recentActivities,
            monthlyRevenue,
        };

        console.log('[GET /api/dashboard] - Successfully prepared dashboard data. Sending response.');
        return NextResponse.json(dashboardData);
    } catch (error: any) {
        console.error("Unhandled error in GET /api/dashboard:", error.message, error.stack);
        return NextResponse.json({ error: 'Unhandled error in GET /api/dashboard: ' + error.message, stack: error.stack }, { status: 500 });
    }
}
