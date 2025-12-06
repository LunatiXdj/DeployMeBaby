import { LoginForm } from '@/client/components/features/login-form';
import { WebsiteLayout } from '@/client/components/website/layout';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <WebsiteLayout showLoginButton={false}>
      <div className="w-full lg:grid lg:grid-cols-2 flex-1">
        <div className="flex items-center justify-center py-12 bg-black">
          <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center text-white">
              <h1 className="text-3xl font-bold">Cockpit-Anmeldung</h1>
              <p className="text-balance text-gray-300">
                Geben Sie Ihre Anmeldedaten ein, um auf Ihr Konto zuzugreifen
              </p>
            </div>
            <LoginForm />
            <div className="mt-4 text-center text-sm text-gray-300">
              Noch kein Kunde?{' '}
              <Link href="/" className="underline text-primary">
                Zurück zur Webseite
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden bg-black lg:flex lg:items-center lg:justify-center p-12">
          <Image
            src="/logo.png"
            alt="Firmenlogo"
            width="400"
            height="150"
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
    </WebsiteLayout>
  );
}