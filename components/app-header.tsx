import Link from "next/link";
import { WheatOffIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const links = [
  { href: "/history", label: "기록" },
  { href: "/settings", label: "알레르기 설정" },
];

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-heading text-2xl flex items-center gap-2 font-extrabold tracking-tight text-primary">
          <WheatOffIcon className="size-6" />
          Allergy Mate
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
