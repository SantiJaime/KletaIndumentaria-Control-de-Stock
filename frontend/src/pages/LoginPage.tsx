import { Form, Formik } from 'formik'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandBadge } from '../components/BrandBadge'
import { TextField } from '../components/FormField'
import { useApp } from '../context/appContext'
import { useToast } from '../context/toastContext'
import { getApiErrorMessage } from '../lib/api'
import { zodValidate } from '../lib/zodFormik'
import { loginSchema, type LoginValues } from '../schemas/loginSchema'

const initialValues: LoginValues = { username: '', password: '' }

const loginInputClass = 'py-3 bg-kleta-bg/50 text-sm font-medium'
const loginLabelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-kleta-plum'

export function LoginPage() {
  const { user, isCheckingSession, login } = useApp()
  const showToast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/operaciones'

  if (user) return <Navigate to={from} replace />
  // Al recargar con sesión, evita mostrar el formulario un instante antes de redirigir.
  if (isCheckingSession) return null

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="relative w-full max-w-md animate-fade-in overflow-hidden rounded-3xl border border-kleta-pink/20 bg-white p-8 shadow-xl md:p-12">

        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4">
            <BrandBadge featured />
          </div>
          <h2 className="font-serif text-3xl font-bold text-kleta-plum">Kleta</h2>
          <p className="mt-1 text-xs font-medium tracking-widest text-kleta-light-plum uppercase">Panel de Control</p>
        </div>

        <Formik<LoginValues>
          initialValues={initialValues}
          validate={zodValidate(loginSchema)}
          onSubmit={async (values, { setStatus }) => {
            setStatus(undefined)
            try {
              await login(loginSchema.parse(values))
              showToast('¡Bienvenido a Kleta Indumentaria!')
              navigate(from, { replace: true })
            } catch (err) {
              setStatus(getApiErrorMessage(err))
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form noValidate className="space-y-5">
              <TextField
                name="username"
                type="text"
                label="Nombre de usuario"
                labelClassName={loginLabelClass}
                icon="fa-regular fa-user"
                placeholder="Ej: kleta_admin"
                autoComplete="username"
                inputClassName={loginInputClass}
              />
              <TextField
                name="password"
                type="password"
                label="Contraseña"
                labelClassName={loginLabelClass}
                icon="fa-solid fa-lock"
                placeholder="••••••••"
                autoComplete="current-password"
                inputClassName={loginInputClass}
              />

              {status && (
                <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <i className="fa-solid fa-circle-exclamation" />
                  {status}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-kleta-rose to-kleta-dark-pink px-6 py-3.5 font-semibold text-white shadow-lg shadow-kleta-rose/30 transition-all duration-200 hover:from-kleta-dark-pink hover:to-kleta-plum hover:shadow-xl disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}</span>
                  <i className="fa-solid fa-arrow-right text-xs" />
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
