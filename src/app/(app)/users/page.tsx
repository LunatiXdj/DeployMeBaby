
'use client';

import { UserManagement } from '@/components/features/user-management';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function UsersPage() {
    const { authUser } = useAuth();

    if (authUser?.role !== 'admin') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Zugriff verweigert</CardTitle>
                    <CardDescription>Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Bitte wenden Sie sich an einen Administrator, wenn Sie Zugriff benötigen.</p>
                </CardContent>
            </Card>
        )
    }

  return <UserManagement />;
}
