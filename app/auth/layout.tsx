import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Logo className="h-16 w-auto mx-auto" />
            </Link>
          </div>
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}
