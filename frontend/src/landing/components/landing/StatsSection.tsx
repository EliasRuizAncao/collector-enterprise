import { useEffect, useState } from 'react'
import { Building2, DollarSign, HardHat, Users2 } from 'lucide-react'

interface StatItem {
  label: string
  value: number
  suffix?: string
  icon: React.ElementType
}

const stats: StatItem[] = [
  {
    label: 'Años en el mercado',
    value: 10,
    suffix: '+',
    icon: Building2,
  },
  {
    label: 'Trabajadores gestionados',
    value: 150,
    icon: Users2,
  },
  {
    label: 'Obras simultáneas',
    value: 5,
    icon: HardHat,
  },
  {
    label: 'UF facturación anual promedio',
    value: 25000,
    icon: DollarSign,
  },
]

// Animación de conteo simple para resaltar métricas
const useCounter = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let start: number | null = null
    const step = (timestamp: number) => {
      if (!start) {
        start = timestamp
      }
      const progress = timestamp - start
      const percentage = Math.min(progress / duration, 1)
      const current = Math.floor(percentage * target)
      setValue(current)
      if (percentage < 1) {
        window.requestAnimationFrame(step)
      } else {
        setValue(target)
      }
    }

    window.requestAnimationFrame(step)

    return () => {
      setValue(0)
    }
  }, [target, duration])

  return value
}

// Sección de estadísticas que destaca la experiencia de Amaranto
const StatsSection = () => {
  return (
    <section className="bg-slate-100 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Experiencia comprobada en gestión de obras
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Amaranto Constructora consolida más de una década liderando proyectos de construcción
            con equipos multidisciplinarios y resultados consistentes.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => {
            const animatedValue = useCounter(stat.value)
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/0 to-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    {animatedValue.toLocaleString('es-CL')}
                    {stat.suffix}
                  </p>
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default StatsSection

