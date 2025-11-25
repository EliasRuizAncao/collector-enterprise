import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { toast } from '@/shared/components/ui/use-toast'
import { Textarea } from '@/shared/components/ui/textarea'
import { useSeo } from '@/shared/hooks/useSeo'

const contactSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Email inválido'),
  company: z.string().min(2, 'Ingresa el nombre de tu empresa'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Mensaje muy corto (mínimo 10 caracteres)'),
})

type ContactFormData = z.infer<typeof contactSchema>

// Página de contacto con formulario y datos de la empresa
const Contact = () => {
  useSeo(
    'Contacto | Amaranto Constructora',
    'Contáctanos para conversar sobre tu próximo proyecto residencial o comercial con Amaranto Constructora.',
  )

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
    },
  })

  const onSubmit = (data: ContactFormData) => {
    console.log('Contacto:', data)
    toast({
      title: 'Mensaje enviado',
      description: 'Gracias por escribirnos. Te responderemos a la brevedad.',
    })
    form.reset()
  }

  return (
    <>
      <div className="container flex flex-col gap-12 py-16">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Contáctanos
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Completa el formulario y coordinemos una reunión para conocer el alcance, presupuesto y
            plazos de tu proyecto.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Formulario de contacto */}
        <section className="rounded-3xl border border-teal-100 bg-white/95 p-8 shadow-xl shadow-teal-900/10">
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
                          <Input placeholder="Tu nombre completo" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu.email@empresa.cl" {...field} />
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
                          <Input placeholder="Nombre de tu empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+56 9 1234 5678" {...field} />
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
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuéntanos sobre tus necesidades o el proyecto que deseas potenciar."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Enviar Mensaje
                </Button>
              </form>
            </Form>
          </section>

          {/* Información de contacto */}
        <aside className="flex flex-col gap-6 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-6 text-slate-700 shadow-lg shadow-teal-900/10">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Información de Contacto</h2>
              <p className="mt-2 text-sm text-slate-600">
                Estamos disponibles para responder tus consultas y coordinar presentaciones
                personalizadas en la Región de La Araucanía.
              </p>
            </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm">
                <p className="font-medium text-slate-900">Email</p>
                <p>contacto@amaranto.cl</p>
              </div>
            <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm">
                <p className="font-medium text-slate-900">Teléfono</p>
                <p>+56 45 234 5678</p>
              </div>
            <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm">
                <p className="font-medium text-slate-900">Dirección</p>
                <p>Av. Alemania 0845, Temuco, Región de La Araucanía</p>
              </div>
            <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm">
                <p className="font-medium text-slate-900">Horario</p>
                <p>Lunes a Viernes · 9:00 - 18:00 hrs</p>
              </div>
            </div>

          <div className="rounded-xl border border-teal-100 bg-white p-4 shadow-sm shadow-teal-900/10">
              <p className="text-sm text-slate-600">
                ¿Prefieres agendar directamente? Escríbenos y coordinaremos una reunión virtual en menos de 24 horas hábiles.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

export default Contact

