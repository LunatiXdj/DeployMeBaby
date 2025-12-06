
"use client"
import { useEffect, useState } from "react";
import type { CompanySettings } from "@/shared/types";


export default function ImpressumPage() {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanySettings() {
      try {
        const response = await fetch("/api/company-settings");
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data: CompanySettings = await response.json();
        setCompanySettings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanySettings();
  }, []);

  if (loading) {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <h1 className="text-3xl font-bold mb-6">Impressum</h1>
          <p>Loading company data...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <h1 className="text-3xl font-bold mb-6">Impressum</h1>
          <p className="text-red-500">Error loading company data: {error}</p>
        </div>
    );
  }

  return (
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Impressum</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>
            <strong>{companySettings?.companyName}</strong><br />
            Inhaber: {companySettings?.owner}<br />
            {companySettings?.address}<br />
            {companySettings?.zipCode} {companySettings?.city}<br />
          </p>
          <p>
            <strong>Kontakt:</strong><br />
            Telefon: {companySettings?.phone}<br />
            E-Mail: {companySettings?.email}<br />
          </p>
          <p>
            <strong>Umsatzsteuer-ID:</strong><br />
            Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
            {companySettings?.vatId}
          </p>
          <p>
            <strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br />
            {companySettings?.owner}<br />
            {companySettings?.address}<br />
            {companySettings?.zipCode} {companySettings?.city}
          </p>
          <h2 className="text-xl font-semibold text-foreground pt-4">Haftungsausschluss (Disclaimer)</h2>
          <p>
            <strong>Haftung für Inhalte</strong><br />
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>
        </div>
      </div>
  );
}
