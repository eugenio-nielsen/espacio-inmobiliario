import Logo from "@/components/Logo";

const NAV_ITEMS = [
  {
    href: "/propiedades",
    label: "Propiedades",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Informe de Valor",
    soon: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Herramientas",
    soon: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Guías",
    soon: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-8">
          {/* Logo */}
          <a href="/" className="shrink-0">
            <Logo className="h-10 w-auto" />
          </a>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-navy rounded-lg hover:bg-navy/5 transition-colors relative"
              >
                <span className="text-gray-400 group-hover:text-navy transition-colors">
                  {item.icon}
                </span>
                {item.label}
                {item.soon && (
                  <span className="ml-1 text-[10px] font-semibold text-gold-light bg-gold-pale px-1.5 py-0.5 rounded-full leading-none">
                    Pronto
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <a
              href="/auth/login"
              className="hidden sm:block text-sm font-medium text-gray-700 hover:text-navy px-3 py-2 transition-colors"
            >
              Ingresar
            </a>
            <a
              href="/auth/registro"
              className="nav-register-btn text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors"
            >
              Registrarse
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
