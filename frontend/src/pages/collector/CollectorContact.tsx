import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { useSeo } from '@/hooks/useSeo'

const contactSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Email inválido'),
  company: z.string().min(2, 'Ingresa el nombre de tu empresa'),
  role: z.string().min(2, 'Cuéntanos tu rol'),
  message: z.string().min(10, 'Mensaje muy corto (mínimo 10 caracteres)'),
})

type ContactFormData = z.infer<typeof contactSchema>

const CollectorContact = () => {
  useSeo(
    'Contacto | Collector Enterprise',
    'Agenda una prueba piloto de Collector Enterprise y descubre cómo la IA puede digitalizar tus obras.',
  )

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      role: '',
      message: '',
    },
  })

  const onSubmit = (data: ContactFormData) => {
    console.log('Collector Contact:', data)
    toast({
      title: 'Solicitud recibida',
      description: 'Nos pondremos en contacto contigo en menos de 24 horas hábiles.',
    })
    form.reset()
  }

  return (
    <div className="container flex flex-col gap-12 py-16">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Hablemos de tu piloto</h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Cuéntanos qué obras quieres digitalizar y configura con nosotros detección de EPP,
          formularios inteligentes y reportes visuales con IA.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email corporativo</FormLabel>
                      <FormControl>
                        <Input placeholder="tu.email@empresa.cl" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la constructora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Jefe de obra, Prevencionista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Qué quieres resolver?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Registra los dolores actuales, KPIs que quieres monitorear o alcances del piloto."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Enviar solicitud
              </Button>
            </form>
          </Form>
        </section>

        <aside className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Contacto directo</h2>
            <p className="mt-2 text-sm text-slate-600">
              Escríbenos y agenda una llamada con el equipo fundador. Revisaremos tu flujo actual y
              definiremos un piloto en menos de una semana.
            </p>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <p>hola@collectorenterprise.com</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Teléfono</p>
              <p>+56 9 4567 8901</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Horario</p>
              <p>Lunes a Viernes · 9:00 - 18:00 hrs (GMT-3)</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Demo express</p>
              <p>
                Obtén un walkthrough de 30 minutos y acceso a nuestro entorno sandbox para tu equipo.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              ¿Prefieres calendarizar tú? Envía un correo con tu disponibilidad y compartiremos un
              enlace para agendar directamente.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CollectorContact


