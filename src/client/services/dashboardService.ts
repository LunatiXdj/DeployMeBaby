
import type { DashboardData } from './dashboardService.d';

export async function getDashboardData(): Promise<DashboardData> {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        throw error;
    }
}
