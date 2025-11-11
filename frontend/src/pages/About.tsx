import { Eye, HardHat } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSeo } from '@/hooks/useSeo'

const projectPlaceholders = [
  {
    name: 'Condominio Valle Llaima',
    description: 'Residencial · Temuco, Región de La Araucanía',
  },
  {
    name: 'Centro Logístico Labranza',
    description: 'Industrial · Labranza, Región de La Araucanía',
  },
  {
    name: 'Conjunto Habitacional Boldo Sur',
    description: 'Residencial · Padre Las Casas, Región de La Araucanía',
  },
]

// Página "Nosotros" con historia, misión y visión de Amaranto
const About = () => {
  useSeo(
    'Acerca de Amaranto | Constructora chilena',
    'Conoce la historia, misión y visión de Amaranto Constructora: más de 10 años ejecutando proyectos residenciales y comerciales en Chile.',
  )

  return (
    <>
      <div className="flex flex-col gap-12 pb-16">
        {/* Hero reducido */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 py-16 text-white">
          <div className="container flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">
              Amaranto Constructora
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Acerca de Amaranto</h1>
            <p className="max-w-2xl text-slate-100">
              Somos una constructora mediana con más de una década transformando proyectos
              residenciales y comerciales en Chile. Apostamos por la digitalización como motor de
              eficiencia y calidad.
            </p>
          </div>
        </section>

        <div className="container flex flex-col gap-10">
          {/* Historia */}
          <Card className="border border-teal-100 bg-white/90 shadow-lg shadow-teal-900/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <span className="text-sm font-semibold">01</span>
                </div>
                <CardTitle className="text-2xl font-semibold text-slate-900">
                  Nuestra Historia
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-600">
              <p>
                Amaranto nació hace más de 10 años con el propósito de elevar el estándar en la
                construcción de espacios residenciales y comerciales en la región. Desde nuestros
                primeros proyectos, hemos crecido hasta gestionar simultáneamente tres a cinco obras
                con equipos multidisciplinarios de 50 a 150 trabajadores.
              </p>
              <p>
                Nuestra experiencia se centra en edificación residencial y comercial, combinando la
                ejecución en terreno con una mirada estratégica que incorpora tecnología, procesos
                eficientes y control de calidad riguroso.
              </p>
            </CardContent>
          </Card>

          {/* Misión y visión */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white shadow-md shadow-teal-900/10">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-900/20">
                  <HardHat className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Nuestra Misión
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Construir espacios que mejoren la calidad de vida de las personas, utilizando
                tecnología y procesos innovadores para optimizar cada etapa de nuestros proyectos.
                Podemos adaptarnos a cada obra manteniendo eficiencia y seguridad operativa.
              </CardContent>
            </Card>

            <Card className="border border-teal-100 bg-gradient-to-br from-cyan-50 via-white to-white shadow-md shadow-teal-900/10">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-900/20">
                  <Eye className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Nuestra Visión
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Liderar la transformación digital en la construcción en la Región de La Araucanía,
                integrando herramientas que garanticen operaciones eficientes, seguras y sustentables
                para nuestros clientes y colaboradores.
              </CardContent>
            </Card>
          </div>

          {/* Galería de proyectos (placeholder) */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">Proyectos Destacados</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projectPlaceholders.map((project) => (
                <Card
                  key={project.name}
                  className="overflow-hidden border border-slate-200 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="h-40 w-full bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100" />
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">{project.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                      Imagen referencial · En actualización
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default About

