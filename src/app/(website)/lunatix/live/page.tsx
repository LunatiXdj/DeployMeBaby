
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LunatixLivePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Button asChild>
          <Link href="https://www.bly.to/lunatixlive" target="_blank" rel="noopener noreferrer">
            Live Sets, Downloads
          </Link>
        </Button>
        <Button asChild>
          <Link href="/lunatix/booking">
            Booking
          </Link>
        </Button>
      </div>

      <div style={{ height: 'calc(100vh - 250px)' }}>
        <iframe
          src="https://www.tiktok.com/@lunatix_dj/"
          className="w-full h-full border-0"
          allow="encrypted-media;"
          allowFullScreen
          title="LunatiX DJ on TikTok"
        ></iframe>
      </div>
    </div>
  );
}
