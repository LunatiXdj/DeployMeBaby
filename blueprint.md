# Blueprint: PH-Service Anwendung

Dieses Dokument beschreibt die Architektur, die Funktionen und den allgemeinen Aufbau der PH-Service-Anwendung.

## Funktionen der App

Die PH-Service-Anwendung ist ein umfassendes System zur Verwaltung von Geschäftsabläufen, das sich an Handwerks- und Dienstleistungsunternehmen richtet. Die Hauptfunktionen sind in einem internen Bereich namens "Cockpit" zusammengefasst und umfassen:

*   **Dashboard:** Eine zentrale Übersicht über die wichtigsten Kennzahlen und Aktivitäten des Unternehmens. Hier laufen alle relevanten Informationen zusammen, um einen schnellen Überblick zu ermöglichen.
*   **Kundenverwaltung (Customers):** Erfassen, Verwalten und Einsehen von Kundendaten. Dies ist das CRM-Herzstück der Anwendung. Google Maps Integration 
*   **Mitarbeiterverwaltung (Employees):** Verwaltung von Mitarbeiterdaten und möglicherweise deren Berechtigungen im System. Stammdatenverwaltung 
*   **Lieferantenverwaltung (Suppliers):** Verwalten von Lieferanten und deren Konditionen.
*   **Projektverwaltung (Projects):** Anlegen, Verfolgen und Verwalten von Projekten von der Anfrage bis zum Abschluss.
*   **Angebotsverwaltung (Quotes):** Erstellen, Versenden und Verwalten von Angeboten an Kunden.
*   **Auftragsverwaltung (Orders):** Umwandeln von Angeboten in Aufträge und deren weitere Bearbeitung.
*   **Rechnungslegung (Invoices):** Erstellen, Versenden und Verwalten von Rechnungen. Wahrscheinlich mit Funktionen zur Nachverfolgung von Zahlungen.
*   **Finanzübersicht (Finance/PNL):** Werkzeuge zur Überwachung der finanziellen Gesundheit des Unternehmens, wahrscheinlich einschließlich einer Gewinn- und Verlustrechnung (PNL).
*   **Brief- und Dokumentenerstellung (Letter):** Eine Funktion zum Erstellen von standardisierten Briefen oder anderen Dokumenten.
*   **Artikel- und Materialverwaltung (Articles):** Verwalten von Artikeln, Materialien und Dienstleistungen, die das Unternehmen anbietet.
*   **Protokollierung (Sitelogs):** Führen von Protokollen, Bautagebüchern oder anderen standortbezogenen Aufzeichnungen.
*   **Einstellungen (Settings):** Konfiguration der Anwendung und der Unternehmensdaten.
*   **Benutzerverwaltung (Users):** Verwalten der Benutzerkonten und deren Zugriffsrechte für das Cockpit.
*   **Werkzeuge (Tools):** Möglicherweise eine Sammlung von kleineren Werkzeugen und Hilfsprogrammen, die den Arbeitsalltag erleichtern.

## Gliederung der App

Die Anwendung ist in zwei Hauptbereiche unterteilt:

1.  **Die öffentliche Webseite (`app/(website)`):** Dies ist der Teil der Anwendung, den jeder im Internet besuchen kann. Er dient der Präsentation des Unternehmens und zur Lead-Generierung. Hier finden sich Seiten wie die Homepage, "Über uns", "Leistungen" und das Kundenportal zur Projektanfrage.
2.  **Die interne Anwendung "Cockpit" (`app/(app)`):** Dies ist der passwortgeschützte Bereich für die Mitarbeiter des Unternehmens. Er enthält alle oben genannten Funktionen zur Verwaltung der Geschäftsabläufe. Der Zugriff erfolgt über eine separate Login-Seite.

Technologisch basiert die Anwendung auf Next.js, was diese Trennung durch das "App Router"-Konzept mit Layout-Gruppen ermöglicht.

## Zugang zur App über die Homepage

Es gibt zwei Hauptwege, wie ein Benutzer mit der Anwendung interagiert:

1.  **Für potenzielle Kunden:**
    *   Ein Besucher landet auf der Homepage (`/`).
    *   Auf der Homepage gibt es mehrere Schaltflächen wie "Jetzt anfragen" oder "Kontakt aufnehmen", die zum Kundenportal (`/portal`) führen.
    *   Im Kundenportal kann der Besucher ein Formular mit seinen Kontaktdaten und Projektwünschen ausfüllen und absenden. Diese Anfrage wird dann im internen System zur weiteren Bearbeitung erfasst.

2.  **Für Mitarbeiter:**
    *   Ein Mitarbeiter navigiert direkt zur Login-Seite (`/login`).
    *   Dort gibt er seine Anmeldedaten ein, um Zugang zum "Cockpit" zu erhalten.
    *   Nach erfolgreicher Anmeldung wird der Mitarbeiter zum Dashboard oder einer anderen Startseite innerhalb des Cockpits weitergeleitet.

## Mehrwert der App

Der Hauptmehrwert der Anwendung liegt in der **Digitalisierung und Zentralisierung** aller wichtigen Geschäftsprozesse eines Dienstleistungs- oder Handwerksbetriebs. Statt mit verschiedenen Insellösungen (z.B. Excel für Rechnungen, ein separates CRM, ein Word für Angebote) zu arbeiten, bietet die Anwendung eine **einzige, integrierte Plattform**.

Dies führt zu:

*   **Effizienzsteigerung:** Schnellere und einfachere Erstellung von Angeboten, Rechnungen und anderen Dokumenten.
*   **Bessere Übersicht:** Alle Informationen zu Kunden, Projekten und Finanzen sind an einem Ort verfügbar.
*   **Verbesserte Zusammenarbeit:** Mehrere Mitarbeiter können gleichzeitig an verschiedenen Aspekten eines Projekts arbeiten.
*   **Professionalisierung:** Ein einheitlicher und professioneller Auftritt gegenüber dem Kunden.
*   **Datengrundlage für Entscheidungen:** Das System sammelt wertvolle Daten, die für die Unternehmenssteuerung genutzt werden können.

## Technische Umsetzung von Kernfunktionen

### Brief- und Dokumentenerstellung

Für die Erstellung von Briefen und anderen Dokumenten wird ein Rich-Text-Editor (RTE) benötigt, der über die Funktionalität eines einfachen Textfeldes hinausgeht.

*   **Technologie:** Die Wahl fiel auf **Tiptap**, einen modernen, "headless" Editor für das Web, der auf dem robusten ProseMirror-Framework aufbaut.
*   **Komponenten:**
    *   `RichTextEditor.tsx`: Eine wiederverwendbare React-Komponente, die den Tiptap-Editor kapselt. Sie nimmt den HTML-Inhalt entgegen und gibt Änderungen über eine `onChange`-Funktion zurück.
    *   `Toolbar.tsx`: Eine separate Toolbar-Komponente, die die Formatierungsschaltflächen enthält und den Editor-Status (z.B. "fett" ist aktiv) visuell darstellt.
*   **Funktionen des Editors:**
    *   **Grundformatierungen:** Fett, kursiv, unterstrichen, durchgestrichen.
    *   **Struktur:** Überschriften, Listen (nummeriert und unsortiert), Zitatblöcke.
    *   **Sonderfunktionen:**
        *   **Links:** Einfügen und Bearbeiten von Hyperlinks.
        *   **Bilder:** Einfügen von Bildern (z.B. für Logos oder Signaturen).
        *   **Digitale Unterschrift:** Eine spezielle Schaltfläche öffnet ein modales Fenster, in dem der Benutzer mit der Maus oder dem Finger eine Unterschrift zeichnen kann. Diese wird als Bild in das Dokument eingefügt. Hierfür wird die Bibliothek `react-signature-canvas` genutzt.
*   **Integration:** Die `RichTextEditor`-Komponente kann nun in der Ansicht für die Brieferstellung anstelle eines `<textarea>` verwendet werden, um den Briefinhalt zu bearbeiten.

## Nützliche KI-Features

Bei der Analyse der Dateistruktur und der bisher eingesehenen Komponenten konnten **keine expliziten KI-Funktionen** identifiziert werden. Die Anwendung scheint sich auf solide, prozessorientierte Verwaltungsfunktionen zu konzentrieren.

Allerdings bietet die Struktur der Anwendung zahlreiche Anknüpfungspunkte für zukünftige KI-Erweiterungen:

*   **Intelligente Angebotserstellung:** Eine KI könnte basierend auf der Projektbeschreibung im Kundenportal automatisch einen ersten Angebotsentwurf erstellen.
*   **Automatisierte Texterkennung:** Eine KI könnte gescannte Rechnungen oder Lieferscheine auslesen und die Daten automatisch in das System übertragen.
*   **Vorausschauende Planung:** Basierend auf vergangenen Projektdaten könnte eine KI vorhersagen, wie lange zukünftige Projekte dauern oder wie viel Material benötigt wird.
*   **Chatbot für Kundenanfragen:** Ein KI-gesteuerter Chatbot auf der Webseite könnte erste Kundenfragen beantworten und Anfragen vorqualifizieren.
