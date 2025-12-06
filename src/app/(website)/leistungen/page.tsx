
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WebsiteLayout } from "@/components/website/layout"
import { Wind, Home, Building2, Wrench, Package, Droplets } from "lucide-react"

export const revalidate = 3600; // Revalidate every hour

const servicesList = [
  {
    icon: <Wind className="h-10 w-10 text-primary" />,
    title: "Kälte und Klima",
    description: "Installation und Wartung von Kälte- und Klimaanlagen für Gewerbe und Privat zur Sicherstellung optimaler Temperaturen.",
  },
  {
    icon: <Home className="h-10 w-10 text-primary" />,
    title: "Hausmeister-Service",
    description: "Umfassende Betreuung Ihrer Immobilie, von der Reinigung über die Gartenpflege bis hin zur Überwachung der Haustechnik.",
  },
  {
    icon: <Building2 className="h-10 w-10 text-primary" />,
    title: "Objektbetreuung",
    description: "Wir kümmern uns um die Instandhaltung und Pflege Ihrer Objekte, um deren Wert langfristig zu erhalten.",
  },
  {
    icon: <Wrench className="h-10 w-10 text-primary" />,
    title: "Kleinstreparaturen",
    description: "Schnelle und zuverlässige Erledigung von kleineren Reparaturarbeiten im und am Haus.",
  },
  {
    icon: <Package className="h-10 w-10 text-primary" />,
    title: "Montageservice",
    description: "Professionelle Montage von Möbeln, Bauelementen und anderen Einrichtungen nach Ihren Wünschen.",
  },
  {
    icon: <Droplets className="h-10 w-10 text-primary" />,
    title: "Sanitär",
    description: "Fachgerechte Installation, Reparatur und Wartung von sanitären Anlagen für Bad und Küche.",
  },
]

export default function LeistungenPage() {
  return (
    <WebsiteLayout>
      <div className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Unsere Leistungen im Überblick</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Wir bieten ein umfassendes Spektrum an Dienstleistungen im Bereich der Obejektbetreuung. Entdecken Sie, wie wir auch Ihnen den Rücken freihalten können.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {servicesList.map((service, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center gap-4">
                  {service.icon}
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </WebsiteLayout>
  )
}
