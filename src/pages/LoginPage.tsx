import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { showToast, ToastContainer } = useToast()

  // Not: checkSavedCredentials artık App.tsx'de çağrılıyor (hot reload için)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      showToast('Kullanıcı adı ve şifre gereklidir', 'error')
      return
    }

    setIsLoading(true)

    try {
      const success = await login(username, password, rememberMe)
      
      if (success) {
        showToast('Giriş başarılı!', 'success')
        setTimeout(() => navigate('/dashboard'), 500)
      } else {
        showToast('Kullanıcı adı veya şifre hatalı', 'error')
      }
    } catch (error) {
      showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer />
      
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl">
          {/* Logo ve Başlık */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-4xl">🐝</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              BeeLocal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ninova Dosya Senkronizasyonu
            </p>
          </div>

          {/* Login Formu */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Kullanıcı Adı"
              type="text"
              placeholder="İTÜ kullanıcı adınız"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
            />

            <div className="relative">
              <Input
                label="Şifre"
                type={showPassword ? "text" : "password"}
                placeholder="Şifreniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <Checkbox
              label="Beni hatırla"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3"
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          {/* Bilgi Notu */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Not:</strong> İTÜ Ninova giriş bilgilerinizi kullanın.
              Bilgileriniz güvenli şekilde şifrelenerek saklanır.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          BeeLocal v1.0.0 - Made with ❤️ for İTÜ Students
        </p>
      </div>
    </div>
  )
}


