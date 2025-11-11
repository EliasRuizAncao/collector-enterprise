import { BarChart3, FileText, Building, HardHat, Sparkles, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Sección de características clave del producto
const FeaturesSection = () => {
  const features = [
    {
      title: 'Edificación Residencial',
      description:
        'Condóminos y edificios de alta calidad, diseñados para potenciar la habitabilidad y eficiencia energética.',
      icon: Building,
    },
    {
      title: 'Infraestructura Comercial',
      description:
        'Centros empresariales y proyectos mixtos con ejecución precisa y cumplimiento normativo.',
      icon: BarChart3,
    },
    {
      title: 'Gestión de Seguridad',
      description:
        'Protocolos de prevención, control de accesos y supervisión permanente en terreno.',
      icon: HardHat,
    },
    {
      title: 'Planificación Colaborativa',
      description:
        'Coordinación con metodologías Lean y seguimiento semanal para asegurar hitos críticos.',
      icon: Users,
    },
    {
      title: 'Calidad Documentada',
      description:
        'Control de avances, entregables certificados y trazabilidad total para cada etapa.',
      icon: FileText,
    },
    {
      title: 'Innovación y Tecnología',
      description:
        'Integración con plataformas digitales, supervisión remota y reportes ejecutivos en línea.',
      icon: Sparkles,
    },
  ]

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-slate-50 py-20 text-slate-900"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15)_0,_transparent_60%)]" />
      <div className="container relative z-10 flex flex-col gap-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Especialidades
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Ejecución sobresaliente en cada proyecto
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            En Amaranto combinamos experiencia constructiva, equipos multidisciplinarios y
            tecnología para entregar obras seguras, eficientes y hechas a la medida de cada cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group h-full border-slate-200 bg-white/80 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection

