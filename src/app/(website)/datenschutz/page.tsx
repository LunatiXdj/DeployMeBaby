
import { WebsiteLayout } from "@/components/website/layout";

export default function DatenschutzPage() {
  return (
    <WebsiteLayout>
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Verantwortlicher im Sinne der Datenschutzgesetze, insbesondere der EU-Datenschutzgrundverordnung (DSGVO), ist:
          </p>
          <p>
            <strong>PH-Service</strong><br />
            Inhaber: Phillip Hüting<br />
            Alte Poststraße 1a<br />
            46459 Rees<br />
          </p>

          <h2 className="text-xl font-semibold text-foreground pt-4">Ihre Betroffenenrechte</h2>
          <p>
            Unter den oben angegebenen Kontaktdaten können Sie jederzeit folgende Rechte ausüben:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Auskunft über Ihre bei uns gespeicherten Daten und deren Verarbeitung (Art. 15 DSGVO),</li>
            <li>Berichtigung unrichtiger personenbezogener Daten (Art. 16 DSGVO),</li>
            <li>Löschung Ihrer bei uns gespeicherten Daten (Art. 17 DSGVO),</li>
            <li>Einschränkung der Datenverarbeitung, sofern wir Ihre Daten aufgrund gesetzlicher Pflichten noch nicht löschen dürfen (Art. 18 DSGVO),</li>
            <li>Widerspruch gegen die Verarbeitung Ihrer Daten bei uns (Art. 21 DSGVO) und</li>
            <li>Datenübertragbarkeit, sofern Sie in die Datenverarbeitung eingewilligt haben oder einen Vertrag mit uns abgeschlossen haben (Art. 20 DSGVO).</li>
          </ul>
          <p>
            Sofern Sie uns eine Einwilligung erteilt haben, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>

           <h2 className="text-xl font-semibold text-foreground pt-4">Erfassung allgemeiner Informationen beim Besuch unserer Website</h2>
           <p>
             Wenn Sie auf unsere Website zugreifen, werden automatisch mittels eines Cookies Informationen allgemeiner Natur erfasst. Diese Informationen (Server-Logfiles) beinhalten etwa die Art des Webbrowsers, das verwendete Betriebssystem, den Domainnamen Ihres Internet-Service-Providers und Ähnliches. Hierbei handelt es sich ausschließlich um Informationen, welche keine Rückschlüsse auf Ihre Person zulassen.
           </p>
        </div>
      </div>
    </WebsiteLayout>
  );
}
