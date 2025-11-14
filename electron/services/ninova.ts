import puppeteer, { Browser, Page } from 'puppeteer'
import { Course, CourseFile, Announcement } from '../../src/types'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class NinovaService {
  private browser: Browser | null = null
  private page: Page | null = null
  private isLoggedIn = false
  private navigationQueue: Promise<any> = Promise.resolve()
  private pagePool: Page[] = []
  private maxPages = 20 // Hızlı internet için daha fazla paralel işlem
  private lastUsername: string = ''
  private lastPassword: string = ''
  private sessionCheckEnabled = true

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true, // Arka planda çalıştır
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      })
    }
  }

  // Yeni bir page oluştur veya havuzdan al
  private async getPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser başlatılmamış')
    }

    // Eğer havuzda page varsa, onu kullan
    if (this.pagePool.length > 0) {
      const page = this.pagePool.pop()!
      return page
    }

    // Yeni page oluştur
    const page = await this.browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0'
    )
    await page.setJavaScriptEnabled(true)
    
    // Cookie'leri ana page'den kopyala
    if (this.page) {
      const cookies = await this.page.cookies()
      await page.setCookie(...cookies)
    }
    
    return page
  }

  // Page'i havuza geri koy
  private async releasePage(page: Page): Promise<void> {
    if (this.pagePool.length < this.maxPages) {
      this.pagePool.push(page)
    } else {
      await page.close().catch(() => {})
    }
  }

  // Navigasyonları sıraya koy
  private queueNavigation<T>(fn: () => Promise<T>): Promise<T> {
    const previousQueue = this.navigationQueue
    
    let resolve: (value: T) => void
    let reject: (error: any) => void
    
    const currentPromise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    
    this.navigationQueue = previousQueue
      .then(() => fn())
      .then(resolve!)
      .catch(reject!)
    
    return currentPromise
  }

  // Session kontrolü - logout elementi var mı kontrol et
  private async checkSession(): Promise<boolean> {
    if (!this.page || !this.sessionCheckEnabled) {
      return this.isLoggedIn
    }

    try {
      // Logout elementi var mı kontrol et
      const logoutElement = await this.page.$('#ctl00_Header1_tdLogout').catch(() => null)
      const altLogout = await this.page.$('a[href*="Logout"]').catch(() => null)
      
      const sessionValid = logoutElement !== null || altLogout !== null
      
      if (!sessionValid && this.isLoggedIn) {
        console.warn('⚠️ Session expired! İsLoggedIn flag false yapılıyor.')
        this.isLoggedIn = false
      }
      
      return sessionValid
    } catch (error) {
      console.warn('Session kontrolü yapılamadı:', error)
      return this.isLoggedIn
    }
  }

  // Otomatik re-login
  private async reLoginIfNeeded(): Promise<boolean> {
    if (!this.lastUsername || !this.lastPassword) {
      console.error('❌ Re-login için kaydedilmiş credential yok!')
      return false
    }

    console.log('🔄 Session expired, otomatik tekrar giriş yapılıyor...')
    
    // Session check'i geçici olarak kapat (sonsuz döngüyü önlemek için)
    this.sessionCheckEnabled = false
    
    try {
      // Eski page'i kapat
      if (this.page) {
        await this.page.close().catch(() => {})
        this.page = null
      }
      
      // Page pool'u temizle
      for (const p of this.pagePool) {
        await p.close().catch(() => {})
      }
      this.pagePool = []
      
      // Tekrar giriş yap
      const success = await this.login(this.lastUsername, this.lastPassword)
      
      if (success) {
        console.log('✅ Otomatik re-login başarılı!')
      } else {
        console.error('❌ Otomatik re-login başarısız!')
      }
      
      return success
    } finally {
      // Session check'i tekrar aç
      this.sessionCheckEnabled = true
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    // Kullanıcı bilgilerini sakla (re-login için)
    this.lastUsername = username
    this.lastPassword = password
    
    // ASP.NET form alanlarının tam isimlerini kullan
    const usernameFieldName = 'ctl00$ContentPlaceHolder1$tbUserName'
    const passwordFieldName = 'ctl00$ContentPlaceHolder1$tbPassword'
    
    try {
      await this.initialize()

      if (!this.browser) {
        throw new Error('Browser başlatılamadı')
      }

      // Eski page'i varsa temizle (önceki başarısız login veya logout sonrası)
      if (this.page) {
        console.log('🧹 Eski page temizleniyor...')
        try {
          await this.page.close()
        } catch (error) {
          console.warn('Eski page kapatılamadı:', error)
        }
        this.page = null
      }

      // Yeni page oluştur
      this.page = await this.browser.newPage()
      
      // User agent ayarla (bot tespitini engelle)
      await this.page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0'
      )

      // JavaScript ve çerezleri etkinleştir
      await this.page.setJavaScriptEnabled(true)
      
      console.log('🔐 İTÜ Ninova giriş sayfasına gidiliyor...')
      
      // Direkt İTÜ Ninova Kampus1 sayfasına git
      await this.page.goto('https://ninova.itu.edu.tr/Kampus1', {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      })

      console.log('📍 Mevcut URL:', this.page.url())

      // Sayfanın yüklenmesini bekle - optimize edildi
      await delay(200)

      // Kullanıcı adı alanını kontrol et
      const usernameInput = await this.page.$(`input[name="${usernameFieldName}"]`)
      
      if (!usernameInput) {
        console.error('❌ Kullanıcı adı alanı bulunamadı!')
        const html = await this.page.content()
        console.log('Sayfa içeriği (ilk 1000 karakter):', html.substring(0, 1000))
        return false
      }

      console.log('✅ Kullanıcı adı alanı bulundu')

      // Şifre alanını kontrol et
      const passwordInput = await this.page.$(`input[name="${passwordFieldName}"]`)
      
      if (!passwordInput) {
        console.error('❌ Şifre alanı bulunamadı!')
        return false
      }

      console.log('✅ Şifre alanı bulundu')

      // Form action URL'ini al
      const formAction = await this.page.$eval('form', (form: HTMLFormElement) => form.action)
      console.log('📋 Form action URL:', formAction)

      // Formu doldur
      console.log('📝 Form dolduruluyor...')
      await this.page.type(`input[name="${usernameFieldName}"]`, username, { delay: 50 })
      await this.page.type(`input[name="${passwordFieldName}"]`, password, { delay: 50 })

      // Formu gönder ve yönlendirmeyi bekle
      console.log('🚀 Form gönderiliyor...')
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }),
        this.page.click('input[type="submit"]'),
      ])

      // Giriş sonrası URL'i kontrol et
      const finalUrl = this.page.url()
      console.log('📍 Giriş sonrası URL:', finalUrl)

      // Sayfanın tamamen yüklenmesini bekle - optimize edildi
      await delay(150)

      // Başarılı giriş kontrolü - logout elementi var mı?
      console.log('🔍 Logout elementi aranıyor...')
      const logoutElement = await this.page.$('#ctl00_Header1_tdLogout').catch(() => null)
      
      console.log('🔍 Logout element bulundu mu?', logoutElement !== null)
      
      // Alternatif kontroller
      if (!logoutElement) {
        // Başka logout selector'larını dene
        const altLogout1 = await this.page.$('a[href*="Logout"]').catch(() => null)
        const altLogout2 = await this.page.$('a.oturumAc').catch(() => null)
        const altLogout3 = await this.page.$('td[id*="tdLogout"]').catch(() => null)
        
        console.log('🔍 Alternatif logout kontrolleri:', {
          altLogout1: altLogout1 !== null,
          altLogout2: altLogout2 !== null,
          altLogout3: altLogout3 !== null
        })
        
        this.isLoggedIn = altLogout1 !== null || altLogout2 !== null || altLogout3 !== null
      } else {
        this.isLoggedIn = true
      }

      if (this.isLoggedIn) {
        console.log('✅ Giriş başarılı!')
      } else {
        console.log('❌ Giriş başarısız! Kullanıcı adı veya şifre yanlış olabilir.')
        
        // Sayfanın HTML'ini kontrol et
        const pageTitle = await this.page.title()
        console.log('📄 Sayfa başlığı:', pageTitle)
        
        // Hata mesajını kontrol et
        const errorMessage = await this.page.$eval(
          '#ctl00_ContentPlaceHolder1_rfvUserName, #ctl00_ContentPlaceHolder1_rfvPassword, .error, .alert',
          (el) => el.textContent
        ).catch(() => null)
        
        if (errorMessage) {
          console.log('❌ Hata mesajı:', errorMessage)
        }
        
        // Sayfada kullanıcı adı input'u var mı? (hala login sayfasındaysa)
        const stillOnLoginPage = await this.page.$(`input[name="${usernameFieldName}"]`).catch(() => null)
        if (stillOnLoginPage) {
          console.log('⚠️ Hala login sayfasında, giriş yapılamadı!')
        }
      }

      return this.isLoggedIn
    } catch (error) {
      console.error('❌ Ninova login hatası:', error)
      
      // Hata durumunda page'i temizle
      if (this.page) {
        try {
          await this.page.close()
        } catch (closeError) {
          console.warn('Page kapatılamadı:', closeError)
        }
        this.page = null
      }
      
      this.isLoggedIn = false
      return false
    }
  }

  async getCourses(): Promise<Course[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    try {
      console.log('📚 Dersler yükleniyor...')
      
      // Kampus1 sayfasına git - Retry mekanizması
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        try {
          await this.page.goto('https://ninova.itu.edu.tr/Kampus1', {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          })
          
          await delay(200)
          
          // Session kontrolü yap
          const sessionValid = await this.checkSession()
          
          if (!sessionValid) {
            console.warn('⚠️ Session geçersiz, otomatik re-login deneniyor...')
            const reLoginSuccess = await this.reLoginIfNeeded()
            
            if (!reLoginSuccess) {
              throw new Error('Session expired ve re-login başarısız. Lütfen tekrar giriş yapın.')
            }
            
            // Re-login başarılı, sayfayı tekrar yükle
            continue
          }
          
          break
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            throw error
          }
          console.warn(`⚠️ Kampus1 yükleme denemesi ${retryCount}/${maxRetries}`)
          await delay(300)
        }
      }

      // Dersleri parse et - tooltip'lerden tam bilgiyi çek
      const courses = await this.page.evaluate(() => {
        const coursesData: Course[] = []
        
        // Her bir ders element'ini bul
        const courseItems = document.querySelectorAll('.menuErisimAgaci > ul > li')
        
        console.log(`Bulunan ders sayısı: ${courseItems.length}`)
        
        courseItems.forEach((item) => {
          // Ders kodu span'ını bul
          const codeSpan = item.querySelector('span[id^="eae"]') as HTMLElement
          if (!codeSpan) return
          
          const courseCode = codeSpan.querySelector('strong')?.textContent?.trim() || ''
          
          // Tooltip script'inden ders adını çek
          const scripts = item.querySelectorAll('script')
          let courseName = ''
          
          scripts.forEach((script) => {
            const scriptText = script.textContent || ''
            // "var body = '<span style="font-weight:bold;">DERS ADI</span>'" formatını ara
            const match = scriptText.match(/var body = '<span style="font-weight:bold;">([^<]+)<\/span>'/i)
            if (match && match[1]) {
              courseName = match[1]
            }
          })
          
          // CRN linkini bul
          const crnLink = item.querySelector('ul li a') as HTMLAnchorElement
          const crnSpan = item.querySelector('ul li span[id^="eas"]')
          const crnText = crnSpan?.textContent?.trim() || ''
          const href = crnLink?.getAttribute('href') || ''
          
          if (courseCode && href) {
            coursesData.push({
              id: href,
              code: courseCode,
              name: courseName || courseCode,
              term: `${crnText}`,
            })
          }
        })

        return coursesData
      })

      console.log(`✅ ${courses.length} ders bulundu`)
      
      return courses
    } catch (error) {
      console.error('❌ Ders listesi çekme hatası:', error)
      return []
    }
  }

  // 🌳 FULL TREE TRAVERSAL - Parent'tan en derin child'a kadar tüm yapıyı tara
  private async fetchFullTree(
    items: CourseFile[], 
    courseId: string, 
    category: string,
    depth: number = 0,
    maxDepth: number = 10
  ): Promise<CourseFile[]> {
    if (depth >= maxDepth) {
      console.warn(`⚠️ Maksimum derinlik (${maxDepth}) aşıldı`)
      return []
    }

    const allItems: CourseFile[] = []
    
    for (const item of items) {
      // Her öğeyi ekle (klasör veya dosya)
      allItems.push(item)
      
      if (item.isFolder) {
        try {
          console.log(`${'  '.repeat(depth)}📂 ${item.name} (derinlik: ${depth})`)
          
          // Klasör içeriğini çek
          const page = await this.getPage()
          try {
            await page.goto(item.url, {
              waitUntil: 'domcontentloaded',
              timeout: 15000,
            })
            
            await delay(150)
            
            // URL'den courseId extract et
            const extractedCourseId = this.extractCourseIdFromUrl(page.url())
            const finalCourseId = extractedCourseId || courseId
            
            // ✅ DÜZELTİLDİ: Klasör içeriğini parse ederken sadece klasör adını geç
            // item.path zaten tam yol içeriyor, onu tekrar eklemememiz gerekiyor
            // Bunun yerine, parseCourseFilesFromPageWithPage içinde tam yolu oluşturacağız
            const folderContents = await this.parseCourseFilesFromPageWithPage(
              page, 
              finalCourseId, 
              category, 
              item.path || item.name  // Bu path parent'ın tam yolu
            )
            
            console.log(`${'  '.repeat(depth)}  ✓ ${folderContents.length} öğe bulundu`)
            
            // Recursive olarak alt klasörleri de tara
            const subItems = await this.fetchFullTree(
              folderContents, 
              finalCourseId, 
              category, 
              depth + 1,
              maxDepth
            )
            
            allItems.push(...subItems)
          } finally {
            await this.releasePage(page)
          }
        } catch (error) {
          console.error(`${'  '.repeat(depth)}❌ Klasör hatası (${item.name}):`, error)
        }
      } else {
        console.log(`${'  '.repeat(depth)}📄 ${item.name}`)
      }
    }
    
    return allItems
  }

  async getCourseFiles(courseId: string): Promise<CourseFile[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    // Session kontrolü yap
    const sessionValid = await this.checkSession()
    if (!sessionValid) {
      console.warn('⚠️ Session geçersiz, otomatik re-login deneniyor...')
      const reLoginSuccess = await this.reLoginIfNeeded()
      
      if (!reLoginSuccess) {
        throw new Error('Session expired ve re-login başarısız. Lütfen tekrar giriş yapın.')
      }
    }

    // Queue KULLANMADAN direkt paralel çalışabilir - dedicated page kullanıyoruz
    let dedicatedPage: Page | null = null
    
    try {
      console.log(`📁 ${courseId} dersi için dosyalar yükleniyor...`)
      
      // Bu ders için özel bir page oluştur
      dedicatedPage = await this.getPage()
      
      const allFiles: CourseFile[] = []
      
      console.log(`🔗 Ders URL'si: ${courseId}`)
      
      // Tüm tab'ları paralel olarak çek - daha hızlı!
      const [mainFiles, sinifFiles, dersFiles] = await Promise.all([
        // Ana sayfa
        (async () => {
          try {
            await dedicatedPage!.goto(`https://ninova.itu.edu.tr${courseId}`, {
              waitUntil: 'domcontentloaded',
              timeout: 15000,
            })
            
            await delay(150)
            
            const files = await this.parseCourseFilesFromPageWithPage(dedicatedPage!, courseId, 'Ana Sayfa')
            console.log(`✅ ${files.length} dosya bulundu (ana sayfa)`)
            return files
          } catch (error) {
            console.log('⚠️ Ana sayfa yüklenemedi:', error)
            return []
          }
        })(),
        
        // Sınıf Dosyaları - FULL TREE TRAVERSAL 🌳
        (async () => {
          try {
            const page = await this.getPage()
            try {
              await page.goto(`https://ninova.itu.edu.tr${courseId}/SinifDosyalari`, {
                waitUntil: 'domcontentloaded',
                timeout: 15000,
              })
              
              await delay(150)
              
              const rootItems = await this.parseCourseFilesFromPageWithPage(page, courseId, 'Sınıf Dosyaları', '')
              const rootFolders = rootItems.filter(f => f.isFolder).length
              const rootFiles = rootItems.filter(f => !f.isFolder).length
              console.log(`🌳 Sınıf Dosyaları ANA SEVİYE: ${rootFiles} dosya + ${rootFolders} klasör = ${rootItems.length} öğe`)
              
              // 🌳 FULL TREE TRAVERSAL - Tüm klasör yapısını tara
              console.log(`🌳 Tree traversal başlıyor...`)
              const allItems = await this.fetchFullTree(rootItems, courseId, 'Sınıf Dosyaları')
              
              const totalFiles = allItems.filter(f => !f.isFolder).length
              const totalFolders = allItems.filter(f => f.isFolder).length
              console.log(`✅ Sınıf Dosyaları FULL TREE: ${totalFiles} dosya + ${totalFolders} klasör = ${allItems.length} TOPLAM öğe`)
              console.log(`   (Artış: ${allItems.length - rootItems.length} öğe eklendi)`)
              
              return allItems
            } finally {
              await this.releasePage(page)
            }
          } catch (error) {
            console.log('⚠️ Sınıf dosyaları bulunamadı:', error)
            return []
          }
        })(),
        
        // Ders Dosyaları - FULL TREE TRAVERSAL 🌳
        (async () => {
          try {
            const page = await this.getPage()
            try {
              await page.goto(`https://ninova.itu.edu.tr${courseId}/DersDosyalari`, {
                waitUntil: 'domcontentloaded',
                timeout: 15000,
              })
              
              await delay(150)
              
              const rootItems = await this.parseCourseFilesFromPageWithPage(page, courseId, 'Ders Dosyaları', '')
              const rootFolders = rootItems.filter(f => f.isFolder).length
              const rootFiles = rootItems.filter(f => !f.isFolder).length
              console.log(`🌳 Ders Dosyaları ANA SEVİYE: ${rootFiles} dosya + ${rootFolders} klasör = ${rootItems.length} öğe`)
              
              // 🌳 FULL TREE TRAVERSAL - Tüm klasör yapısını tara
              console.log(`🌳 Tree traversal başlıyor...`)
              const allItems = await this.fetchFullTree(rootItems, courseId, 'Ders Dosyaları')
              
              const totalFiles = allItems.filter(f => !f.isFolder).length
              const totalFolders = allItems.filter(f => f.isFolder).length
              console.log(`✅ Ders Dosyaları FULL TREE: ${totalFiles} dosya + ${totalFolders} klasör = ${allItems.length} TOPLAM öğe`)
              console.log(`   (Artış: ${allItems.length - rootItems.length} öğe eklendi)`)
              
              return allItems
            } finally {
              await this.releasePage(page)
            }
          } catch (error) {
            console.log('⚠️ Ders dosyaları bulunamadı:', error)
            return []
          }
        })(),
      ])
      
      // Tüm öğeleri (dosyalar + klasörler) birleştir
      allFiles.push(...mainFiles, ...sinifFiles, ...dersFiles)
      
      const totalFolders = allFiles.filter(f => f.isFolder).length
      const totalOnlyFiles = allFiles.filter(f => !f.isFolder).length
      console.log(`✅ TOPLAM ${allFiles.length} öğe bulundu (${totalOnlyFiles} dosya + ${totalFolders} klasör)`)
      return allFiles
    } catch (error) {
      console.error('❌ Dosya listesi çekme hatası:', error)
      return []
    } finally {
      // Page'i havuza geri koy
      if (dedicatedPage) {
        await this.releasePage(dedicatedPage)
      }
    }
  }

  // 🔧 URL'den courseId extract et (klasör URL'lerinden)
  private extractCourseIdFromUrl(url: string): string | null {
    try {
      // Format: /Sinif/33350.110886/... veya /Ders/33350.110886/...
      const match = url.match(/\/(Sinif|Ders)\/([^\/\?]+)/i)
      if (match && match[2]) {
        // ✅ DÜZELTİLDİ: match[1] kullanılarak doğru kategori (Sinif veya Ders) döndürülüyor
        // Bu sayede paralel işlemlerde her page kendi URL'inden doğru courseId'yi alacak
        return `/${match[1]}/${match[2]}`
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Page parametresi alan yardımcı fonksiyon - URL'den courseId extract et
  private async parseCourseFilesFromPageWithPage(page: Page, courseId: string, category: string, path: string = ''): Promise<CourseFile[]> {
    try {
      // 🔧 Mevcut sayfa URL'inden courseId extract et (en güvenilir)
      const currentUrl = page.url()
      const extractedCourseId = this.extractCourseIdFromUrl(currentUrl)
      const finalCourseId = extractedCourseId || courseId
      
      if (extractedCourseId && extractedCourseId !== courseId) {
        console.log(`📍 [Paralel ${category}] URL'den courseId extract edildi: ${extractedCourseId} (param: ${courseId})`)
      }
      
      console.log(`🔍 [Paralel ${category}] Parse: courseId=${finalCourseId}, URL=${currentUrl}`)
      
      // Sayfanın yüklenmesini bekle
      await page.waitForSelector('body', { timeout: 10000 }).catch(() => {
        console.warn('⚠️ Body elementi bulunamadı')
      })
      
      // .dosyaSistemi table.data içindeki dosyaları ve klasörleri parse et
      const items = await page.evaluate((cId, cat, currentPath) => {
        const filesData: any[] = []
        
        try {
          // Dosya tablosunu bul - Farklı selektorları deneyelim
          let fileTable: Element | null = null
          
          // Sırayla farklı selektorları dene
          const selectors = [
            '.dosyaSistemi table.data',
            'table.data',
            '.dosyaSistemi table',
            'table[class*="data"]',
            '.fileList table',
            'table.fileTable',
          ]
          
          for (const selector of selectors) {
            fileTable = document.querySelector(selector)
            if (fileTable) {
              console.log(`✅ Tablo bulundu: ${selector}`)
              break
            }
          }
          
          if (!fileTable) {
            console.warn('❌ Dosya tablosu bulunamadı! Sayfa yapısı:', document.body.className)
            // Sayfadaki table elementlerini kontrol et
            const tables = document.querySelectorAll('table')
            console.log(`Sayfada ${tables.length} adet table bulundu`)
            
            // Eğer table varsa ilk table'ı dene
            if (tables.length > 0) {
              console.log('⚠️ İlk table deneniyor...')
              fileTable = tables[0]
            } else {
              return filesData
            }
          }
          
          const rows = fileTable.querySelectorAll('tr')
          console.log(`📊 ${rows.length} satır bulundu (fallback courseId: ${cId})`)
          
          // İlk satır header, onu atla
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const cells = row.querySelectorAll('td')
            
            if (cells.length < 2) continue
            
            const fileCell = cells[0]
            const sizeCell = cells[1]
            
            const link = fileCell.querySelector('a')
            const img = fileCell.querySelector('img')
            
            if (!link) continue
            
            const fileName = link.textContent?.trim() || ''
            const fileUrl = link.getAttribute('href') || ''
            const sizeText = sizeCell.textContent?.trim() || '0 KB'
            
            // Klasör mü kontrol et - ÖNCELİK SIRASI ÖNEMLİ
            const imgSrc = img?.getAttribute('src') || ''
            const imgAlt = img?.getAttribute('alt') || ''
            const imgTitle = img?.getAttribute('title') || ''
            
            // 1. URL kontrolü (en güvenilir)
            const urlIndicatesFolder = fileUrl.includes('Klasor') || 
                                     fileUrl.includes('Folder') ||
                                     fileUrl.includes('/Klasor/') ||
                                     fileUrl.includes('/Folder/')
            
            // 2. Icon/Image kontrolü
            const iconIndicatesFolder = imgSrc.includes('folder') || 
                                      imgSrc.includes('Folder') ||
                                      imgSrc.includes('klasor') ||
                                      imgSrc.includes('Klasor') ||
                                      imgAlt.toLowerCase().includes('folder') ||
                                      imgAlt.toLowerCase().includes('klasör') ||
                                      imgTitle.toLowerCase().includes('folder') ||
                                      imgTitle.toLowerCase().includes('klasör')
            
            // 3. Boyut kontrolü (son çare - bazen klasörler boyut gösterebilir)
            const sizeIndicatesFolder = sizeText === '-' || 
                                      sizeText === '' ||
                                      sizeText.toLowerCase().includes('klasör') ||
                                      sizeText.toLowerCase().includes('folder')
            
            const isFolder = urlIndicatesFolder || iconIndicatesFolder || sizeIndicatesFolder
            
            const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName
            
            // Unique ID oluştur
            const uniqueId = `${cId}-${cat}-${i}-${Date.now()}`
            
            // Tam URL oluştur
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `https://ninova.itu.edu.tr${fileUrl}`
            
            // 🔧 Dosya oluştur - courseId, path ve courseName'i koru
            filesData.push({
              id: uniqueId,
              courseId: cId,  // URL'den extract edilmiş courseId
              courseName: cat,  // Sınıf/Ders Dosyaları
              name: fileName,
              url: fullUrl,
              size: isFolder ? 0 : parseSizeToBytes(sizeText),
              uploadDate: new Date().toLocaleDateString(),
              isDownloaded: false,
              isFolder: isFolder,
              path: fullPath,  // Tam klasör yolu: "Week 1/Week 2/file.pdf"
            })
          }
          
          if (filesData.length > 0) {
            console.log(`📋 Parse edildi: ${filesData.length} öğe (courseId=${cId}, category=${cat})`)
            // İlk 3 dosyanın detaylı bilgisini göster
            filesData.slice(0, 3).forEach(f => {
              console.log(`  📄 ${f.name}:`)
              console.log(`     ✓ courseId: ${f.courseId}`)
              console.log(`     ✓ courseName: ${f.courseName}`)
              console.log(`     ✓ path: ${f.path}`)
            })
          } else {
            console.log(`⚠️ Parse edilen dosya yok (courseId=${cId}, category=${cat})`)
          }
        } catch (error) {
          console.error('Parse hatası:', error)
        }
        
        function parseSizeToBytes(sizeStr: string): number {
          const match = sizeStr.match(/([\d.,]+)\s*(KB|MB|GB|B)/i)
          if (!match) return 0
          
          const value = parseFloat(match[1].replace(',', '.'))
          const unit = match[2].toUpperCase()
          
          switch (unit) {
            case 'GB': return value * 1024 * 1024 * 1024
            case 'MB': return value * 1024 * 1024
            case 'KB': return value * 1024
            case 'B': return value
            default: return value
          }
        }
        
        return filesData
      }, finalCourseId, category, path)
      
      console.log(`✅ ${items.length} öğe parse edildi (courseId=${finalCourseId})`)
      
      return items
    } catch (error) {
      console.error('❌ Parse fonksiyonu hatası:', error)
      return []
    }
  }

  private async parseCourseFilesFromPage(courseId: string, category: string, path: string = ''): Promise<CourseFile[]> {
    if (!this.page) return []
    return this.parseCourseFilesFromPageWithPage(this.page, courseId, category, path)
  }

  async getFolderContents(folderUrl: string, courseId: string, category: string, folderPath: string): Promise<CourseFile[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    // Session kontrolü yap
    const sessionValid = await this.checkSession()
    if (!sessionValid) {
      console.warn('⚠️ Session geçersiz, otomatik re-login deneniyor...')
      const reLoginSuccess = await this.reLoginIfNeeded()
      
      if (!reLoginSuccess) {
        throw new Error('Session expired ve re-login başarısız. Lütfen tekrar giriş yapın.')
      }
    }

    console.log(`📂 Klasör: ${folderUrl}`)

    try {
      // Retry mekanizması
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        try {
          await this.page.goto(folderUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 20000,
          })
          
          await delay(300)
          
          // 🔧 KRİTİK: Klasör URL'inden courseId extract et
          const extractedCourseId = this.extractCourseIdFromUrl(this.page.url())
          const finalCourseId = extractedCourseId || courseId
          
          if (extractedCourseId && extractedCourseId !== courseId) {
            console.log(`📍 Klasör URL'den courseId: ${extractedCourseId} (param: ${courseId})`)
          }
          
          const files = await this.parseCourseFilesFromPage(finalCourseId, category, folderPath)
          
          console.log(`✅ ${files.length} öğe bulundu (courseId=${finalCourseId})`)
          
          return files
          
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            throw error
          }
          console.warn(`⚠️ Klasör yükleme denemesi ${retryCount}/${maxRetries} başarısız, tekrar deneniyor...`)
          await delay(300 * retryCount)
        }
      }
      
      return []
    } catch (error) {
      console.error('❌ Klasör içeriği çekme hatası:', error)
      return []
    }
  }

  async getAllFilesRecursive(courseId: string, category: string): Promise<{ folders: number, totalFiles: number }> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    // Queue kullanarak sıralı işlem yap
    return this.queueNavigation(async () => {
      try {
        // URL'yi düzgün oluştur
        let categoryUrl: string
        const categoryName = category === 'sinif' ? 'Sınıf Dosyaları' : 'Ders Dosyaları'
        
        // Eğer courseId zaten /SinifDosyalari veya /DersDosyalari ile bitiyorsa, direkt kullan
        if (courseId.includes('/SinifDosyalari') || courseId.includes('/DersDosyalari')) {
          categoryUrl = `https://ninova.itu.edu.tr${courseId}`
        } else {
          // Yoksa ekle
          categoryUrl = category === 'sinif' 
            ? `https://ninova.itu.edu.tr${courseId}/SinifDosyalari`
            : `https://ninova.itu.edu.tr${courseId}/DersDosyalari`
        }
        
        console.log(`📊 ${categoryName} için istatistikler hesaplanıyor...`)
        console.log(`🔗 URL: ${categoryUrl}`)
        
        // Retry mekanizması ile sayfa yükleme
        let rootFiles: CourseFile[] = []
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            // Daha esnek yükleme stratejisi - domcontentloaded daha hızlı
            await this.page!.goto(categoryUrl, {
              waitUntil: 'domcontentloaded',
              timeout: 20000,
            })
            
            // Sayfanın tamamen yüklenmesi için kısa bir bekleme
            await delay(400)
            
            // Sayfanın gerçekten yüklendiğini kontrol et
            const pageLoaded = await this.page!.evaluate(() => {
              return document.readyState === 'complete' || document.readyState === 'interactive'
            })
            
            if (!pageLoaded) {
              throw new Error('Sayfa düzgün yüklenemedi')
            }
            
            rootFiles = await this.parseCourseFilesFromPage(courseId, categoryName)
            
            console.log(`📁 Ana dizinde ${rootFiles.length} öğe bulundu (${categoryName})`)
            break // Başarılı olduysa döngüden çık
            
          } catch (error) {
            retryCount++
            console.warn(`⚠️ Sayfa yükleme denemesi ${retryCount}/${maxRetries} başarısız:`, error)
            
            if (retryCount < maxRetries) {
              console.log(`🔄 ${400 * retryCount}ms sonra tekrar denenecek...`)
              await delay(400 * retryCount)
              
              // Session kontrolü yap
              try {
                const isStillLoggedIn = await this.checkLoginStatus()
                if (!isStillLoggedIn) {
                  console.error('❌ Oturum süresi dolmuş olabilir')
                  return { folders: 0, totalFiles: 0 }
                }
              } catch (e) {
                console.warn('⚠️ Login durumu kontrol edilemedi:', e)
              }
            } else {
              console.error('❌ Maksimum deneme sayısına ulaşıldı')
              throw error
            }
          }
        }
        
        // Basitçe ana dizindeki klasör ve dosyaları say
        let totalFolders = 0
        let totalFiles = 0
        
        for (const file of rootFiles) {
          if (file.isFolder) {
            totalFolders++
          } else {
            totalFiles++
          }
        }
        
        // Alt klasörleri de recursive say
        const processedFolders = new Set<string>()
        
        const countRecursive = async (files: CourseFile[]): Promise<void> => {
          for (const file of files) {
            if (file.isFolder && !processedFolders.has(file.url)) {
              processedFolders.add(file.url)
              
              try {
                const folderContents = await this.getFolderContents(
                  file.url,
                  file.courseId,
                  file.courseName,
                  file.path || file.name
                )
                
                console.log(`  📂 ${file.name}: ${folderContents.length} öğe`)
                
                for (const subFile of folderContents) {
                  if (subFile.isFolder) {
                    totalFolders++
                  } else {
                    totalFiles++
                  }
                }
                
                // Recursive olarak alt klasörleri de say
                await countRecursive(folderContents)
              } catch (error) {
                console.error(`  ⚠️ ${file.name} yüklenemedi:`, error)
              }
            }
          }
        }
        
        await countRecursive(rootFiles)
        
        console.log(`✅ ${categoryName} TOPLAM: ${totalFolders} klasör, ${totalFiles} öğe`)
        
        return { folders: totalFolders, totalFiles }
      } catch (error) {
        console.error('❌ İstatistik hesaplama hatası:', error)
        return { folders: 0, totalFiles: 0 }
      }
    })
  }

  // Login durumunu kontrol et
  private async checkLoginStatus(): Promise<boolean> {
    if (!this.page) return false
    
    try {
      const logoutElement = await this.page.$('#ctl00_Header1_tdLogout').catch(() => null)
      return logoutElement !== null
    } catch (error) {
      return false
    }
  }

  // 📢 TÜM DERSLERİN TÜM DUYURULARINI ÇEK (Her dersin duyuru sayfasından)
  async getAllAnnouncementsFromAllCourses(): Promise<Announcement[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    try {
      console.log(`📢 Tüm derslerin tüm duyuruları çekiliyor...`)
      
      // Önce dersleri al
      const courses = await this.getCourses()
      
      if (courses.length === 0) {
        console.log('⚠️ Ders bulunamadı')
        return []
      }
      
      console.log(`📚 ${courses.length} ders için duyurular çekilecek...`)
      
      const allAnnouncements: Announcement[] = []
      
      // Her ders için duyuruları paralel çek (3'lü gruplar halinde)
      const BATCH_SIZE = 3
      for (let i = 0; i < courses.length; i += BATCH_SIZE) {
        const batch = courses.slice(i, i + BATCH_SIZE)
        
        const batchResults = await Promise.all(
          batch.map(async (course) => {
            try {
              console.log(`📢 ${course.code} duyuruları çekiliyor...`)
              const courseAnnouncements = await this.getAnnouncements(course.id)
              
              // Ders bilgisini ekle
              const enrichedAnnouncements = courseAnnouncements.map(a => ({
                ...a,
                courseName: `${course.code} - ${course.name}`
              }))
              
              console.log(`✅ ${course.code}: ${enrichedAnnouncements.length} duyuru`)
              return enrichedAnnouncements
            } catch (error) {
              console.error(`❌ ${course.code} duyuru hatası:`, error)
              return []
            }
          })
        )
        
        // Batch sonuçlarını birleştir
        batchResults.forEach(results => {
          allAnnouncements.push(...results)
        })
      }
      
      console.log(`✅ TOPLAM ${allAnnouncements.length} duyuru (${courses.length} dersten)`)
      
      // Tarihe göre sırala (en yeni önce)
      allAnnouncements.sort((a, b) => {
        // Basit tarih karşılaştırması
        return b.date.localeCompare(a.date)
      })
      
      return allAnnouncements
    } catch (error) {
      console.error('❌ Tüm duyurular çekme hatası:', error)
      return []
    }
  }

  // 📢 Kampus sayfasından tüm duyuruları çek (Tüm Duyurular sayfası)
  async getAllAnnouncementsFromKampus(): Promise<Announcement[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    try {
      console.log(`📢 Kampus sayfasından tüm duyurular çekiliyor...`)
      
      // ✅ DÜZELTİLDİ: Tüm Duyurular sayfasına git - burada TÜM duyurular var!
      await this.page.goto('https://ninova.itu.edu.tr/Kampus?1/Duyurular', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      
      await delay(300)
      
      // Session kontrolü
      const sessionValid = await this.checkSession()
      if (!sessionValid) {
        console.warn('⚠️ Session geçersiz, otomatik re-login deneniyor...')
        const reLoginSuccess = await this.reLoginIfNeeded()
        
        if (!reLoginSuccess) {
          throw new Error('Session expired ve re-login başarısız. Lütfen tekrar giriş yapın.')
        }
        
        // Re-login sonrası sayfayı tekrar yükle
        await this.page.goto('https://ninova.itu.edu.tr/Kampus?1/Duyurular', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        })
        await delay(300)
      }
      
      // Duyuruları parse et - Tüm Duyurular sayfasındaki .duyuruGoruntule divlerinden
      const announcementsList = await this.page.evaluate(() => {
        const announcementsData: any[] = []
        
        try {
          // ✅ Tüm Duyurular sayfasındaki TÜM duyuruları bul - .duyuruGoruntule divleri
          const duyuruDivs = document.querySelectorAll('.duyuruGoruntule')
          
          if (duyuruDivs.length === 0) {
            console.log('⚠️ Tüm Duyurular sayfasında duyuru bulunamadı')
            return announcementsData
          }
          
          console.log(`📋 Tüm Duyurular sayfasında ${duyuruDivs.length} duyuru bulundu`)
          
          duyuruDivs.forEach((div, index) => {
            try {
              // 1. Başlık ve URL
              const titleLink = div.querySelector('h2 a')
              if (!titleLink) return
              
              const title = titleLink.textContent?.trim() || ''
              const url = titleLink.getAttribute('href') || ''
              
              // 2. İçerik div'inden ders bilgisi ve tarihi al
              const icerikDiv = div.querySelector('.icerik')
              if (!icerikDiv) return
              
              // Ders bilgisi - <strong> tag içinde
              const strongTag = icerikDiv.querySelector('strong')
              let courseName = strongTag?.textContent?.trim() || ''
              
              // 3. Tarih - .icerik içindeki en son .tarih span'dan
              const tarihSpans = icerikDiv.querySelectorAll('span.tarih')
              const dateText = tarihSpans[tarihSpans.length - 1]?.textContent?.trim() || ''
              
              // 4. Yazar - .duyuruGoruntule > div.tarih > span.tarih (icerik dışındaki)
              const allTarihDivs = div.querySelectorAll('div.tarih')
              let author = ''
              // İcerik içinde olmayan tarih div'ini bul
              for (const tarihDiv of Array.from(allTarihDivs)) {
                if (tarihDiv.parentElement === div) {
                  // Bu div doğrudan duyuruGoruntule'nin çocuğu
                  const authorSpan = tarihDiv.querySelector('span.tarih, span#ctl00_ContentPlaceHolder1_lbKullanici')
                  if (authorSpan) {
                    author = authorSpan.textContent?.trim() || ''
                    break
                  }
                }
              }
              
              // URL'den courseId ve duyuru ID'sini extract et
              const urlMatch = url.match(/\/(Sinif|Ders)\/([^\/]+)\/Duyuru\/(\d+)/)
              let extractedCourseId = ''
              if (urlMatch) {
                extractedCourseId = `/${urlMatch[1]}/${urlMatch[2]}`
              }
              
              // Unique ID oluştur - duyuru URL'sinden al
              const announcementIdMatch = url.match(/\/Duyuru\/(\d+)/)
              const announcementId = announcementIdMatch ? announcementIdMatch[1] : `${index}`
              const uniqueId = `kampus-announcement-${announcementId}`
              
              // Tam URL oluştur
              const fullUrl = url.startsWith('http') ? url : `https://ninova.itu.edu.tr${url}`
              
              announcementsData.push({
                id: uniqueId,
                courseId: extractedCourseId,
                courseName: courseName,
                title: title,
                content: '', // Detay sayfasından alınacak
                date: dateText,
                author: author,
                url: fullUrl,
                isRead: false
              })
            } catch (err) {
              console.error(`Duyuru ${index} parse hatası:`, err)
            }
          })
          
          console.log(`✅ ${announcementsData.length} duyuru parse edildi (Tüm Duyurular)`)
        } catch (error) {
          console.error('Duyuru parse hatası (Tüm Duyurular):', error)
        }
        
        return announcementsData
      })
      
      console.log(`📋 Tüm Duyurular sayfasından ${announcementsList.length} duyuru bulundu`)
      
      // TÜM duyuruların tam içeriğini çek
      console.log(`📋 ${announcementsList.length} duyurunun tam içeriği çekiliyor...`)
      
      // Her duyurunun detay sayfasından tam içeriği çek
      const announcements: Announcement[] = []
      for (let i = 0; i < announcementsList.length; i++) {
        const announcement = announcementsList[i]
        try {
          console.log(`📖 Duyuru ${i + 1}/${announcementsList.length} detayı çekiliyor: ${announcement.title}`)
          
          // Detay sayfasına git
          await this.page.goto(announcement.url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          })
          
          await delay(150)
          
          // Tam içeriği çek
          const fullContent = await this.page.evaluate(() => {
            // Duyuru içeriği genellikle .duyuruGoruntule içindeki .icerik div'inde
            const icerikDiv = document.querySelector('.duyuruGoruntule .icerik')
            if (icerikDiv) {
              const textContent = icerikDiv.textContent?.trim() || ''
              return textContent
            }
            
            // Alternatif: Tüm duyuruGoruntule içeriğini al
            const duyuruDiv = document.querySelector('.duyuruGoruntule')
            if (duyuruDiv) {
              // Gereksiz elementleri kopyalayıp temizle
              const clonedDiv = duyuruDiv.cloneNode(true) as HTMLElement
              
              // Başlığı çıkar
              const h2 = clonedDiv.querySelector('h2')
              if (h2) h2.remove()
              
              // Tarih bilgilerini çıkar
              const tarihDivs = clonedDiv.querySelectorAll('.tarih')
              tarihDivs.forEach(div => div.remove())
              
              const textContent = clonedDiv.textContent?.trim() || ''
              return textContent
            }
            
            return ''
          })
          
          // İçeriği güncelle
          announcement.content = fullContent || announcement.content
          announcements.push(announcement)
          
          console.log(`✅ Duyuru içeriği alındı (${fullContent.length} karakter)`)
          
        } catch (error) {
          console.error(`❌ Duyuru ${announcement.title} detayı çekilemedi:`, error)
          // Hata olsa bile duyuruyu ekle (içeriksiz olarak)
          announcements.push(announcement)
        }
      }
      
      console.log(`✅ Tüm Duyurular sayfasından ${announcements.length}/${announcementsList.length} duyurunun tam içeriği alındı`)
      return announcements
    } catch (error) {
      console.error('❌ Tüm Duyurular çekme hatası:', error)
      return []
    }
  }

  // 📢 Belirli bir dersin duyurularını çek (Ders sayfası)
  async getAnnouncements(courseId: string): Promise<Announcement[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    try {
      console.log(`📢 ${courseId} için duyurular çekiliyor...`)
      
      // ✅ DÜZELTİLDİ: Duyurular sayfası çoğul olmalı (/Duyurular)
      const announcementsUrl = `https://ninova.itu.edu.tr${courseId}/Duyurular`
      await this.page.goto(announcementsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      
      await delay(200)
      
      // Duyuruları parse et - Liste sayfasından (.duyuruGoruntule divlerinden)
      const announcementsList = await this.page.evaluate((cId) => {
        const announcementsData: any[] = []
        
        try {
          // ✅ Ninova'nın duyuru liste yapısı: .duyuruGoruntule divleri
          const duyuruDivs = document.querySelectorAll('.duyuruGoruntule')
          
          if (duyuruDivs.length === 0) {
            console.log('⚠️ Duyuru bulunamadı')
            return announcementsData
          }
          
          console.log(`📋 ${duyuruDivs.length} duyuru bulundu`)
          
          duyuruDivs.forEach((div, index) => {
            try {
              // 1. Başlık ve URL
              const titleLink = div.querySelector('h2 a')
              if (!titleLink) return
              
              const title = titleLink.textContent?.trim() || ''
              const url = titleLink.getAttribute('href') || ''
              
              // 2. Tarih - .icerik içindeki en son .tarih span'dan
              const icerikDiv = div.querySelector('.icerik')
              const tarihSpans = icerikDiv?.querySelectorAll('span.tarih') || []
              const dateText = tarihSpans[tarihSpans.length - 1]?.textContent?.trim() || ''
              
              // 3. Yazar - .duyuruGoruntule > div.tarih > span.tarih (icerik dışındaki)
              const allTarihDivs = div.querySelectorAll('div.tarih')
              let author = ''
              for (const tarihDiv of Array.from(allTarihDivs)) {
                if (tarihDiv.parentElement === div) {
                  const authorSpan = tarihDiv.querySelector('span.tarih, span#ctl00_ContentPlaceHolder1_lbKullanici')
                  if (authorSpan) {
                    author = authorSpan.textContent?.trim() || ''
                    break
                  }
                }
              }
              
              // Unique ID oluştur - URL'den çıkar
              const urlMatch = url.match(/\/Duyuru\/(\d+)/)
              const announcementId = urlMatch ? urlMatch[1] : `${index}`
              const uniqueId = `${cId}-announcement-${announcementId}`
              
              // Tam URL oluştur
              const fullUrl = url.startsWith('http') ? url : `https://ninova.itu.edu.tr${url}`
              
              announcementsData.push({
                id: uniqueId,
                courseId: cId,
                courseName: '', // Sonra doldurulacak
                title: title,
                content: '', // Detay sayfasından alınacak
                date: dateText,
                author: author,
                url: fullUrl,
                isRead: false
              })
            } catch (err) {
              console.error(`Duyuru ${index} parse hatası:`, err)
            }
          })
          
          console.log(`✅ ${announcementsData.length} duyuru parse edildi`)
        } catch (error) {
          console.error('Duyuru parse hatası:', error)
        }
        
        return announcementsData
      }, courseId)
      
      console.log(`📋 ${announcementsList.length} duyuru bulundu, tam içerik çekiliyor...`)
      
      // Her duyurunun detay sayfasından tam içeriği çek
      const announcements: Announcement[] = []
      for (let i = 0; i < announcementsList.length; i++) {
        const announcement = announcementsList[i]
        try {
          console.log(`📖 Duyuru ${i + 1}/${announcementsList.length} detayı çekiliyor: ${announcement.title}`)
          
          // Detay sayfasına git
          await this.page.goto(announcement.url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          })
          
          await delay(150)
          
          // Tam içeriği çek
          const fullContent = await this.page.evaluate(() => {
            // Duyuru içeriği genellikle .duyuruGoruntule içindeki .icerik div'inde
            // veya tüm içerik bir div içinde olabilir
            
            // Önce genişletilmiş içeriği dene
            const icerikDiv = document.querySelector('.duyuruGoruntule .icerik')
            if (icerikDiv) {
              // İçerikteki tüm paragrafları ve satırları birleştir
              const textContent = icerikDiv.textContent?.trim() || ''
              return textContent
            }
            
            // Alternatif: Tüm duyuruGoruntule içeriğini al (başlık hariç)
            const duyuruDiv = document.querySelector('.duyuruGoruntule')
            if (duyuruDiv) {
              // Başlığı çıkar
              const h2 = duyuruDiv.querySelector('h2')
              if (h2) h2.remove()
              
              // Tarih bilgilerini çıkar
              const tarihDivs = duyuruDiv.querySelectorAll('.tarih')
              tarihDivs.forEach(div => div.remove())
              
              const textContent = duyuruDiv.textContent?.trim() || ''
              return textContent
            }
            
            return ''
          })
          
          // İçeriği güncelle
          announcement.content = fullContent || announcement.content
          announcements.push(announcement)
          
          console.log(`✅ Duyuru içeriği alındı (${fullContent.length} karakter)`)
          
        } catch (error) {
          console.error(`❌ Duyuru ${announcement.title} detayı çekilemedi:`, error)
          // Hata olsa bile duyuruyu ekle (içeriksiz olarak)
          announcements.push(announcement)
        }
      }
      
      console.log(`✅ ${announcements.length} duyurunun tam içeriği alındı`)
      return announcements
    } catch (error) {
      console.error('❌ Duyuru çekme hatası:', error)
      return []
    }
  }

  async downloadFile(fileUrl: string, savePath: string): Promise<void> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Önce giriş yapmalısınız')
    }

    try {
      console.log('📥 İndirme başlatılıyor:', fileUrl)
      console.log('💾 Kaydedilecek yer:', savePath)
      
      const downloadDir = path.dirname(savePath)
      const fileName = path.basename(savePath)
      
      console.log('📂 İndirme klasörü:', downloadDir)
      console.log('📄 Dosya adı:', fileName)
      
      // Klasörü oluştur
      await fs.promises.mkdir(downloadDir, { recursive: true })
      console.log('✅ Klasör oluşturuldu/kontrol edildi')
      
      // Puppeteer cookies'lerini al (oturum bilgilerini kullanmak için)
      const cookies = await this.page.cookies()
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')
      
      console.log('🍪 Cookies alındı, toplam:', cookies.length)
      
      // Tam URL oluştur
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `https://ninova.itu.edu.tr${fileUrl}`
      
      console.log('🔗 Tam URL:', fullUrl)
      
      // İndirme işlemi
      await new Promise<void>((resolve, reject) => {
        const protocol = fullUrl.startsWith('https') ? https : http
        
        const options = {
          headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://ninova.itu.edu.tr/',
          }
        }
        
        console.log('🚀 HTTP request başlatılıyor...')
        
        const request = protocol.get(fullUrl, options, (response: any) => {
          console.log('📡 Response alındı, status:', response.statusCode)
          
          // Redirect durumunu yönet
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location
            console.log('↪️ Redirect:', redirectUrl)
            
            if (redirectUrl) {
              // Recursive olarak redirect'i takip et
              this.downloadFile(
                redirectUrl.startsWith('http') ? redirectUrl : `https://ninova.itu.edu.tr${redirectUrl}`,
                savePath
              ).then(resolve).catch(reject)
            } else {
              reject(new Error('Redirect location bulunamadı'))
            }
            return
          }
          
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP Error: ${response.statusCode}`))
            return
          }
          
          const totalSize = parseInt(response.headers['content-length'] || '0', 10)
          let downloadedSize = 0
          
          console.log('📦 Dosya boyutu:', totalSize, 'bytes')
          
          const fileStream = fs.createWriteStream(savePath)
          
          response.on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length
            const progress = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0
            
            if (downloadedSize % (1024 * 100) < chunk.length) { // Her 100KB'de bir log
              console.log(`⬇️ İndiriliyor: ${progress}% (${downloadedSize}/${totalSize})`)
            }
          })
          
          response.pipe(fileStream)
          
          fileStream.on('finish', async () => {
            fileStream.close()
            
            // Dosyanın gerçekten yazıldığını kontrol et
            try {
              const stats = await fs.promises.stat(savePath)
              console.log('✅ Dosya başarıyla yazıldı:', savePath)
              console.log('📊 Boyut:', stats.size, 'bytes')
              
              if (stats.size === 0) {
                reject(new Error('İndirilen dosya boş'))
              } else {
                resolve()
              }
            } catch (err) {
              reject(new Error('Dosya doğrulaması başarısız: ' + err))
            }
          })
          
          fileStream.on('error', async (err: any) => {
            console.error('❌ Dosya yazma hatası:', err)
            // Hatalı dosyayı sil
            try {
              await fs.promises.unlink(savePath)
            } catch {}
            reject(err)
          })
        })
        
        request.on('error', (err: any) => {
          console.error('❌ HTTP request hatası:', err)
          reject(err)
        })
        
        // Timeout ekle
        request.setTimeout(120000, () => {
          request.destroy()
          reject(new Error('İndirme zaman aşımına uğradı (120 saniye)'))
        })
        
        request.end()
      })
      
      console.log('🎉 İndirme başarılı!')
    } catch (error) {
      console.error('❌ Dosya indirme hatası:', error)
      throw error
    }
  }

  async logout() {
    console.log('🚪 Çıkış yapılıyor...')
    
    // State'i temizle
    this.isLoggedIn = false
    this.lastUsername = ''
    this.lastPassword = ''
    
    // Page'leri kapat
    await this.close()
    
    console.log('✅ Çıkış tamamlandı')
  }

  async close() {
    console.log('🧹 Browser kaynakları temizleniyor...')
    
    // Havuzdaki tüm page'leri kapat
    for (const page of this.pagePool) {
      await page.close().catch(() => {})
    }
    this.pagePool = []
    
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
      this.isLoggedIn = false
    }
    
    console.log('✅ Browser kaynakları temizlendi')
  }
}

export const ninovaService = new NinovaService()

