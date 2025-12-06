
export async function submitPortalRequest(data: any): Promise<void> {
    const response = await fetch('/api/portal-request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Beim Senden der Anfrage ist ein Fehler aufgetreten.');
    }
}
