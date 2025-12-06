
'use client';

import { getProjects } from '@/client/services/projectService';
import { getMaterialOrdersForProject } from '@/client/services/materialOrderService';
import { getInvoices } from '@/client/services/invoiceService';
import { getArticles } from '@/client/services/articleService';
import { getEmployees } from '@/client/services/employeeService';
import { getTimeEntriesForProject } from '@/client/services/timeEntryService';
import { getCustomers } from '@/client/services/customerService';
import type { Invoice, MaterialOrder, TimeEntry, Employee, Article, Customer } from '@/shared/types';

export interface CustomerPnl {
    id: string;
    name: string;
    profit: number;
    revenue: number;
    cost: number;
    materialCost: number;
    personnelCost: number;
}

export interface PnlData {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    totalMaterialCosts: number;
    totalPersonnelCosts: number;
    customers: CustomerPnl[];
}


export async function getPnlData(): Promise<PnlData> {
    const [projects, allInvoices, allArticles, allEmployees, allCustomers] = await Promise.all([
        getProjects(),
        getInvoices(),
        getArticles(),
        getEmployees(),
        getCustomers(),
    ]);

    const completedProjects = projects.filter(p => p.status === 'Abgeschlossen');
    const articlesMap = new Map(allArticles.map(a => [a.id, a]));
    const employeesMap = new Map(allEmployees.map(e => [e.id, e]));
    const customersMap = new Map(allCustomers.map(c => [c.id, c]));

    let totalRevenue = 0;
    let totalCosts = 0;
    let totalMaterialCosts = 0;
    let totalPersonnelCosts = 0;
    
    const customerPnlMap = new Map<string, Omit<CustomerPnl, 'id' | 'name'>>();

    for (const project of completedProjects) {
        const projectInvoices = allInvoices.filter(inv => inv.projectId === project.id);
        const revenue = projectInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

        const materialOrders = await getMaterialOrdersForProject(project.id);
        const materialCost = materialOrders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => {
                const article = articlesMap.get(item.articleId);
                return itemSum + (article ? article.purchasePrice * item.quantity : 0);
            }, 0)
        }, 0);

        const timeEntries = await getTimeEntriesForProject(project.id);
        const personnelCost = timeEntries.reduce((sum, entry) => {
            const employee = employeesMap.get(entry.employeeId);
            return sum + (employee ? employee.hourlyRate * entry.totalTime : 0);
        }, 0);
        
        const cost = materialCost + personnelCost;
        const profit = revenue - cost;
        
        totalRevenue += revenue;
        totalMaterialCosts += materialCost;
        totalPersonnelCosts += personnelCost;
        totalCosts += cost;

        const customerId = project.customerId;
        const existingPnl = customerPnlMap.get(customerId) || { profit: 0, revenue: 0, cost: 0, materialCost: 0, personnelCost: 0 };

        customerPnlMap.set(customerId, {
            profit: existingPnl.profit + profit,
            revenue: existingPnl.revenue + revenue,
            cost: existingPnl.cost + cost,
            materialCost: existingPnl.materialCost + materialCost,
            personnelCost: existingPnl.personnelCost + personnelCost,
        });
    }

    const customersPnl: CustomerPnl[] = Array.from(customerPnlMap.entries()).map(([customerId, pnl]) => ({
        id: customerId,
        name: customersMap.get(customerId)?.name || 'Unbekannter Kunde',
        ...pnl,
    }));
    
    const netProfit = totalRevenue - totalCosts;

    return {
        totalRevenue,
        totalCosts,
        netProfit,
        totalMaterialCosts,
        totalPersonnelCosts,
        customers: customersPnl.sort((a,b) => b.profit - a.profit),
    };
}
