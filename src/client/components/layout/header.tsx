
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/client/components/ui/sheet';
import { Button } from '@/client/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu';
import {
  PanelLeft,
  CircleUser,
  LogOut,
} from 'lucide-react';
import { NavContent } from './sidebar'; 
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/client/contexts/auth-context';

export function Header() {
  const { authUser, signOut } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Navigation umschalten</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-black/80 text-white p-0 flex flex-col backdrop-blur-sm">
          <NavContent onLinkClick={handleLinkClick} />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1" />
      
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <CircleUser className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>{authUser?.email}</DropdownMenuItem>
          <DropdownMenuItem disabled>Rolle: {authUser?.role}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className='text-destructive focus:text-destructive'>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Abmelden</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
