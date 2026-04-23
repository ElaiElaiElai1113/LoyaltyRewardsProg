/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Language = 'en' | 'es'

type TranslationValues = Record<string, string | number>

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (text: string, values?: TranslationValues) => string
}

const languageLabels: Record<Language, string> = {
  en: 'English',
  es: 'Español',
}

const spanishTranslations: Record<string, string> = {
  Language: 'Idioma',
  Loading: 'Cargando',
  'Preparing your workspace.': 'Preparando tu espacio.',
  English: 'Inglés',
  Español: 'Español',
  Menu: 'Menú',
  Vault: 'Bóveda',
  Promotions: 'Promociones',
  Dashboard: 'Panel',
  Shop: 'Tienda',
  History: 'Historial',
  Profile: 'Perfil',
  Player: 'Jugador',
  'Rank: Legendary': 'Rango: Legendario',
  'LVL 99 Elite': 'Nivel 99 Élite',
  Platform: 'Plataforma',
  Company: 'Empresa',
  Account: 'Cuenta',
  'About Us': 'Sobre nosotros',
  Contact: 'Contacto',
  'Store Locator': 'Buscar tiendas',
  Settings: 'Configuración',
  'Sign out': 'Cerrar sesión',
  Operations: 'Operaciones',
  'Admin Portal': 'Portal admin',
  'Game Ops': 'Operaciones del juego',
  'Operations Lead': 'Líder de operaciones',
  'Mission Control': 'Centro de control',
  Products: 'Productos',
  Rewards: 'Recompensas',
  Customers: 'Clientes',
  Commander: 'Comandante',
  'Account Settings': 'Configuración de cuenta',
  'Loading workspace': 'Cargando espacio de trabajo',
  'Fetching your business portal data.': 'Obteniendo los datos de tu portal de negocio.',
  'Access Denied': 'Acceso denegado',
  'This area is for business owners only.': 'Esta área es solo para dueños de negocio.',
  'Return Home': 'Volver al inicio',
  'Business Setup Required': 'Configuración de negocio requerida',
  'This account does not have a business assigned yet.':
    'Esta cuenta aún no tiene un negocio asignado.',
  'Order History': 'Historial de pedidos',
  'Earn XP, complete quests, and unlock rewards across partner realms.':
    'Gana XP, completa misiones y desbloquea recompensas en negocios aliados.',
  'Copyright 2024 Synergize Business Group. All rights reserved.':
    'Copyright 2024 Synergize Business Group. Todos los derechos reservados.',
  'Sign In': 'Iniciar sesión',
  Register: 'Registrarse',
  'Rewards Game': 'Juego de recompensas',
  'Synergize Rewards.': 'Synergize Rewards.',
  'Play every': 'Juega en cada',
  visit: 'visita',
  'Earn XP on every purchase, unlock reward drops, and climb levels across partner businesses.':
    'Gana XP en cada compra, desbloquea recompensas y sube de nivel en negocios aliados.',
  'Start Quest': 'Comenzar misión',
  'Open Vault': 'Abrir bóveda',
  'Level Up': 'Sube de nivel',
  'Watch your XP, streaks, and progress build after each visit.':
    'Mira cómo crecen tu XP, rachas y progreso después de cada visita.',
  Unlock: 'Desbloquea',
  'Spend XP on perks, reward credits, and partner rewards.':
    'Usa XP en beneficios, créditos de recompensa y recompensas de aliados.',
  Compete: 'Compite',
  'Keep momentum with quests, referrals, and limited-time bonuses.':
    'Mantén el ritmo con misiones, referidos y bonos por tiempo limitado.',
  'Welcome Back': 'Bienvenido de nuevo',
  'Sign in to check your balance and redeem rewards.':
    'Inicia sesión para revisar tu saldo y canjear recompensas.',
  'Reset Password': 'Restablecer contraseña',
  "Enter your email and we'll send you a reset link.":
    'Ingresa tu correo y te enviaremos un enlace para restablecerla.',
  'Email Address': 'Correo electrónico',
  'Send reset link': 'Enviar enlace',
  'Back to sign in': 'Volver a iniciar sesión',
  Password: 'Contraseña',
  'Forgot password?': '¿Olvidaste tu contraseña?',
  'Staff Role': 'Rol del personal',
  'Select a staff role': 'Selecciona un rol del personal',
  'Business Owner': 'Dueño del negocio',
  'Platform Admin': 'Administrador de plataforma',
  'Signing in...': 'Iniciando sesión...',
  'Customer login <-': 'Ingreso de cliente <-',
  'Staff login ->': 'Ingreso de personal ->',
  'Create Account': 'Crear cuenta',
  'Join the rewards program and start earning.':
    'Únete al programa de recompensas y empieza a ganar.',
  'Welcome aboard!': '¡Bienvenido!',
  'Check your email to verify your account, then sign in to start earning rewards.':
    'Revisa tu correo para verificar tu cuenta, luego inicia sesión para empezar a ganar recompensas.',
  'Go to sign in ->': 'Ir a iniciar sesión ->',
  'Create your free rewards account and start earning XP today.':
    'Crea tu cuenta gratuita de recompensas y empieza a ganar XP hoy.',
  'Full Name': 'Nombre completo',
  'Your name': 'Tu nombre',
  'Creating account...': 'Creando cuenta...',
  'Check your email for a password reset link.':
    'Revisa tu correo para ver el enlace de restablecimiento.',
  'Unable to send reset link.': 'No se pudo enviar el enlace.',
  'Unable to sign in.': 'No se pudo iniciar sesión.',
  'Enter a valid email address and password to sign in.':
    'Ingresa un correo válido y una contraseña para iniciar sesión.',
  'Unable to create the account.': 'No se pudo crear la cuenta.',
  'Partner Realms': 'Negocios aliados',
  'Shop Realms': 'Tiendas aliadas',
  'Browse partner businesses, complete purchases, and earn XP automatically.':
    'Explora negocios aliados, completa compras y gana XP automáticamente.',
  'Item Type:': 'Tipo:',
  All: 'Todo',
  Drinks: 'Bebidas',
  Bites: 'Bocadillos',
  Gear: 'Artículos',
  Tools: 'Herramientas',
  Drink: 'Bebida',
  Pastry: 'Pastelería',
  Merch: 'Mercancía',
  Experience: 'Experiencia',
  Coffee: 'Café',
  Equipment: 'Equipo',
  'No products found matching your filters.': 'No se encontraron productos con esos filtros.',
  Realm: 'Aliado',
  'Realm:': 'Aliado:',
  'All Realms': 'Todos los aliados',
  'Bonus Drop': 'Bono especial',
  'Cash Price': 'Precio',
  'in stock': 'disponibles',
  'Adding...': 'Agregando...',
  'Add to Cart': 'Agregar al carrito',
  'Reward Vault': 'Bóveda de recompensas',
  'Loot Vault': 'Bóveda de premios',
  'Spend XP on unlocked perks, rare drops, and partner rewards.':
    'Usa XP en beneficios desbloqueados, premios especiales y recompensas de aliados.',
  'Your XP': 'Tu XP',
  'Available XP': 'XP disponible',
  'Redeem reward': 'Canjear recompensa',
  'Confirm the reward details, choose a pickup window, and submit.':
    'Confirma los detalles, elige un horario de recogida y envía.',
  Legendary: 'Legendario',
  Epic: 'Épico',
  Rare: 'Raro',
  Common: 'Común',
  'Sold Out': 'Agotado',
  Claim: 'Canjear',
  'Almost There': 'Casi listo',
  Locked: 'Bloqueado',
  'Unlock Meter': 'Progreso',
  'XP Cost': 'Costo en XP',
  'XP to unlock': 'XP para desbloquear',
  left: 'restantes',
  'Active Quests': 'Misiones activas',
  'Bonus quests that make every visit count.': 'Misiones extra para que cada visita cuente.',
  'Check out the latest missions and earn bonus XP on your purchases.':
    'Revisa las misiones más recientes y gana XP extra en tus compras.',
  'Active Quest Board': 'Tablero de misiones activas',
  'Earn more XP with every visit.': 'Gana más XP con cada visita.',
  'Browse current promotions and take advantage of bonus XP and special deals.':
    'Explora promociones actuales y aprovecha XP extra y ofertas especiales.',
  Expires: 'Vence',
  'Player Dashboard': 'Panel del jugador',
  Level: 'Nivel',
  'Welcome back,': 'Bienvenido,',
  Member: 'Miembro',
  'Complete visits, stack XP, unlock rewards, and keep your streak alive.':
    'Completa visitas, acumula XP, desbloquea recompensas y mantén tu racha.',
  'Next Level': 'Siguiente nivel',
  'until Level': 'hasta el nivel',
  'Open Reward Vault': 'Abrir bóveda',
  'XP Balance': 'Saldo de XP',
  'Reward Quest Progress': 'Progreso de recompensa',
  Just: 'Solo',
  'away from your next reward.': 'para tu próxima recompensa.',
  'Reward Credits': 'Créditos de recompensa',
  'Instant perks ready': 'Beneficios listos',
  'Generating...': 'Generando...',
  'Use Reward Credit': 'Usar crédito de recompensa',
  Unlocked: 'Desbloqueadas',
  'Rewards in your vault': 'Recompensas en tu bóveda',
  'Party Invite': 'Invitación',
  'Share this QR to give a friend and yourself a reward credit.':
    'Comparte este QR para darte a ti y a un amigo un crédito de recompensa.',
  'Copy referral link': 'Copiar enlace de referido',
  'Referral link copied.': 'Enlace de referido copiado.',
  'Redeem Reward Credit': 'Canjear crédito de recompensa',
  'Show this code to staff': 'Muestra este código al personal',
  'This code expires 15 minutes after it is generated.':
    'Este código vence 15 minutos después de generarse.',
  Referral: 'Referido',
  approved: 'aprobado',
  rejected: 'rechazado',
  pending: 'pendiente',
  'Your party invite was approved. Your Reward Credit has been added to your balance.':
    'Tu invitación fue aprobada. Tu crédito de recompensa se agregó a tu saldo.',
  'This referral was not approved. Ask staff if you think this needs another look.':
    'Este referido no fue aprobado. Consulta al personal si crees que debe revisarse.',
  'Your party invite is pending staff approval. Your Reward Credit will appear after approval.':
    'Tu invitación está pendiente de aprobación. Tu crédito de recompensa aparecerá después de aprobarse.',
  'Daily Streak': 'Racha diaria',
  'Visit, scan, or order to keep momentum and earn faster.':
    'Visita, escanea o pide para mantener el ritmo y ganar más rápido.',
  'Side Quest': 'Misión secundaria',
  'Try a new partner business to discover more reward options.':
    'Prueba un nuevo negocio aliado para descubrir más recompensas.',
  'Boss Reward': 'Recompensa mayor',
  'Reach the next tier and unlock higher-value perks.':
    'Alcanza el siguiente nivel y desbloquea beneficios de mayor valor.',
  Featured: 'Destacadas',
  'Featured Rewards': 'Recompensas destacadas',
  'Full Catalog': 'Catálogo completo',
  'Limited Time': 'Tiempo limitado',
  Activity: 'Actividad',
  'Recent Activity': 'Actividad reciente',
  'Shopping Cart': 'Carrito',
  'Your Cart': 'Tu carrito',
  'Your cart is empty.': 'Tu carrito está vacío.',
  'Browse Products': 'Ver productos',
  'Order Summary': 'Resumen del pedido',
  Subtotal: 'Subtotal',
  Tax: 'Impuesto',
  Total: 'Total',
  'earned from this order': 'ganados con este pedido',
  'Proceed to Checkout': 'Ir a pagar',
  Checkout: 'Pagar',
  'Payment Method': 'Método de pago',
  'Card Type': 'Tipo de tarjeta',
  'Card Number': 'Número de tarjeta',
  Expiry: 'Vencimiento',
  CVC: 'CVC',
  'Order failed.': 'El pedido falló.',
  'Placing Order...': 'Realizando pedido...',
  Pay: 'Pagar',
  'will be earned': 'se ganarán',
  each: 'cada uno',
  Date: 'Fecha',
  'Signature Velvet Latte': 'Latte Velvet especial',
  'Redeem any handcrafted latte with your choice of milk and syrup.':
    'Canjea cualquier latte artesanal con la leche y el jarabe que prefieras.',
  'Cold Brew Flight': 'Degustación de cold brew',
  'Sample three seasonal cold brew profiles in one curated tasting.':
    'Prueba tres perfiles de cold brew de temporada en una degustación curada.',
  'Butter Croissant Pairing': 'Maridaje de croissant de mantequilla',
  'Fresh-baked croissant paired with any small brewed coffee.':
    'Croissant recién horneado acompañado de cualquier café pequeño.',
  'Velvet Brew Tote': 'Bolsa Velvet Brew',
  'Canvas tote with embossed logo and internal bottle sleeve.':
    'Bolsa de lona con logo en relieve y compartimento interno para botella.',
  'Mystic Matcha Latte': 'Latte de matcha Mystic',
  'Ceremonial-grade matcha whisked with your choice of milk.':
    'Matcha de grado ceremonial batido con la leche que prefieras.',
  'Almond Croissant': 'Croissant de almendra',
  'Flaky croissant filled with almond cream and topped with sliced almonds.':
    'Croissant hojaldrado relleno de crema de almendra y cubierto con almendras laminadas.',
  'Afternoon Tea Set': 'Set de té de la tarde',
  'Pot of premium herbal tea served with a selection of three mini pastries.':
    'Tetera de infusión premium servida con tres mini pasteles.',
  'Oat Milk Latte': 'Latte con leche de avena',
  'Our signature oat milk latte with house-made vanilla syrup.':
    'Nuestro latte de avena especial con jarabe de vainilla hecho en casa.',
  'Cold Brew Concentrate 32oz': 'Concentrado de cold brew 32 oz',
  'Take home our 24-hour cold brew concentrate. Dilute to taste.':
    'Lleva a casa nuestro concentrado de cold brew de 24 horas. Diluye al gusto.',
  'Pistachio Cardamom Bun': 'Pan de pistacho y cardamomo',
  'Flaky laminated pastry with pistachio frangipane and cardamom glaze.':
    'Masa laminada hojaldrada con frangipane de pistacho y glaseado de cardamomo.',
  'Single Origin: Ethiopia Yirgacheffe': 'Origen único: Etiopía Yirgacheffe',
  '12oz bag of light-roasted whole beans with floral and citrus notes.':
    'Bolsa de 12 oz de granos enteros de tueste ligero con notas florales y cítricas.',
  'Velvet Brew Ceramic Tumbler': 'Vaso cerámico Velvet Brew',
  '16oz double-walled ceramic tumbler in matte black with silicone lid.':
    'Vaso cerámico de doble pared de 16 oz en negro mate con tapa de silicona.',
  'Pour-Over Starter Kit': 'Kit inicial para pour-over',
  'Ceramic dripper, 100 filters, and a 12oz sample roast.':
    'Gotero cerámico, 100 filtros y una muestra de café tostado de 12 oz.',
  'Chai Spice Latte': 'Latte chai especiado',
  'House-blended chai with cinnamon, cardamom, ginger, and steamed milk.':
    'Chai de la casa con canela, cardamomo, jengibre y leche vaporizada.',
  'Mystic Breakfast Sandwich': 'Sándwich de desayuno Mystic',
  'Scrambled eggs, gruyere, arugula, and truffle aioli on brioche.':
    'Huevos revueltos, gruyere, rúcula y alioli de trufa en brioche.',
  'Lavender Honey Scone': 'Scone de lavanda y miel',
  'Buttery scone with dried lavender and a honey glaze drizzle.':
    'Scone mantequilloso con lavanda seca y glaseado de miel.',
  'Premium Tea Sampler': 'Muestrario de tés premium',
  'Set of 4 loose-leaf herbal teas: Chamomile, Peppermint, Hibiscus, and Lavender.':
    'Set de 4 infusiones de hoja suelta: manzanilla, menta, hibisco y lavanda.',
  'Mystic Coffee Mug': 'Taza de café Mystic',
  'Handmade ceramic mug with a mystical mountain motif. 12oz capacity.':
    'Taza cerámica hecha a mano con motivo de montaña mística. Capacidad de 12 oz.',
  'Double points after 3 PM': 'Puntos dobles después de las 3 PM',
  'Stop by after 3 PM and earn twice the points on any handcrafted drink.':
    'Visítanos después de las 3 PM y gana el doble de puntos en cualquier bebida artesanal.',
  'Weekday perk': 'Beneficio entre semana',
  'Drop by after work': 'Pasa después del trabajo',
  'All members': 'Todos los miembros',
  'Spring pairing menu': 'Menú de maridaje de primavera',
  'Unlock a bonus 120 points when you pair a pistachio bun with any iced espresso.':
    'Desbloquea 120 puntos extra al combinar un pan de pistacho con cualquier espresso frío.',
  Seasonal: 'Temporada',
  'Try the pairing': 'Prueba el maridaje',
  'Bring-a-friend Saturdays': 'Sábados de traer a un amigo',
  'Invite a friend to scan your code in-store and both of you receive a surprise bonus.':
    'Invita a un amigo a escanear tu código en tienda y ambos reciben un bono sorpresa.',
  'Share your code': 'Comparte tu código',
  'Tea Tuesday Bonus': 'Bono de martes de té',
  'Order any tea on Tuesdays and earn triple points all day.':
    'Pide cualquier té los martes y gana puntos triples todo el día.',
  Weekly: 'Semanal',
  'View teas': 'Ver tés',
  'Brunch Bundle': 'Combo de brunch',
  'Get a free pastry when you order any breakfast sandwich before 11 AM.':
    'Recibe un pastel gratis al pedir cualquier sándwich de desayuno antes de las 11 AM.',
  Weekend: 'Fin de semana',
  'See menu': 'Ver menú',
  'Morning purchase': 'Compra de la mañana',
  'Oat milk latte and cardamom bun at Valencia St.':
    'Latte de avena y pan de cardamomo en Valencia St.',
  'Promo bonus': 'Bono de promoción',
  'Double points from the afternoon handcrafted drink campaign.':
    'Puntos dobles de la campaña de bebidas artesanales de la tarde.',
  'Reward redeemed': 'Recompensa canjeada',
  'Free butter croissant pairing picked up in-store.':
    'Maridaje gratis de croissant de mantequilla recogido en tienda.',
  'Staff training visit': 'Visita de capacitación del personal',
  'Cortado and tasting notes session.': 'Cortado y sesión de notas de cata.',
  'Reward Credit used': 'Crédito de recompensa usado',
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  return window.localStorage.getItem('coffee-loyalty-language') === 'es' ? 'es' : 'en'
}

function applyValues(text: string, values?: TranslationValues) {
  if (!values) return text
  return Object.entries(values).reduce(
    (nextText, [key, value]) => nextText.replaceAll(`{${key}}`, String(value)),
    text,
  )
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem('coffee-loyalty-language', language)
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (text, values) => {
        const translated = language === 'es' ? spanishTranslations[text] ?? text : text
        return applyValues(translated, values)
      },
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}

export { languageLabels, type Language }
