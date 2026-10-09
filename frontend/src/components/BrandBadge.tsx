interface BrandBadgeProps {
  /** Versión grande y destacada (logo central del login). Si no, es el logo de las barras laterales. */
  featured?: boolean
}

export function BrandBadge({ featured = false }: BrandBadgeProps) {
  return (
    <div
      // `isolate` crea un contexto de apilamiento propio: sin él, algunos navegadores no recortan en
      // círculo a la imagen mientras tiene `transform` (el zoom del hover).
      className={`group isolate shrink-0 overflow-hidden rounded-full bg-white ${
        featured ? 'h-28 w-28 border-2 border-kleta-rose/40 shadow-md' : 'h-12 w-12 border border-kleta-pink/40 shadow-sm md:h-28 md:w-28'
      }`}
    >
      {/* El padding mantiene todo el dibujo (flores y texto) dentro del círculo. `clip-path` recorta la
          imagen en el mismo círculo que el contenedor (sobre el borde, sin importar el padding), así sus
          esquinas blancas no se ven aunque el navegador no aplique el recorte del contenedor. */}
      <img
        src={featured ? '/Kleta-logo.webp' : '/Kleta-logo-2-sm.webp'}
        alt="Kleta Indumentaria"
        className="h-full w-full object-contain p-[9%] transition-transform [clip-path:circle(50%)] group-hover:scale-105"
      />
    </div>
  )
}
