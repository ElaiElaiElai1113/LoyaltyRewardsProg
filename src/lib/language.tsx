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
  'Multi-business rewards platform': 'Plataforma de recompensas para múltiples negocios',
  'Earn across': 'Gana en toda',
  'the network': 'la red',
  'Earn points with participating businesses, redeem rewards across the network, and keep every purchase connected to one account.':
    'Gana puntos en negocios participantes, canjea recompensas en la red y mantén cada compra conectada a una sola cuenta.',
  'Explore Businesses': 'Explorar negocios',
  'View Rewards': 'Ver recompensas',
  'Earn Points': 'Gana puntos',
  'Collect points automatically when you buy from partner businesses.':
    'Acumula puntos automáticamente al comprar en negocios aliados.',
  'Redeem Rewards': 'Canjea recompensas',
  'Use your points for perks, reward credits, and partner offers.':
    'Usa tus puntos en beneficios, créditos de recompensa y ofertas de aliados.',
  'Grow Value': 'Aumenta el valor',
  'Get more from repeat purchases, referrals, and limited-time promotions.':
    'Obtén más valor de compras recurrentes, referidos y promociones por tiempo limitado.',
  'Create your member account and start earning points after your membership is active.':
    'Crea tu cuenta de miembro y empieza a ganar puntos cuando tu membresia este activa.',
  'Network Member': 'Miembro de la red',
  'Rewards account': 'Cuenta de recompensas',
  'Earn points, redeem rewards, and stay connected across partner businesses.':
    'Gana puntos, canjea recompensas y mantente conectado con negocios aliados.',
  'Business Overview': 'Resumen del negocio',
  'Platform Operations': 'Operaciones de plataforma',
  'Member Dashboard': 'Panel de miembro',
  'Track your points, available rewards, and activity across partner businesses.':
    'Consulta tus puntos, recompensas disponibles y actividad en negocios aliados.',
  Tier: 'Nivel',
  'Next Tier': 'Siguiente nivel',
  'points until Tier': 'puntos para el nivel',
  'Points Balance': 'Saldo de puntos',
  points: 'puntos',
  'Reward Progress': 'Progreso de recompensa',
  'points away from your next reward.': 'puntos para tu próxima recompensa.',
  'Rewards you qualify for': 'Recompensas disponibles',
  'Referral Invite': 'Invitación de referido',
  'Your referral invite was approved. Your Reward Credit has been added to your balance.':
    'Tu invitación de referido fue aprobada. El crédito de recompensa se agregó a tu saldo.',
  'Your referral invite is pending staff approval. Your Reward Credit will appear after approval.':
    'Tu invitación de referido está pendiente de aprobación. El crédito aparecerá después de aprobarse.',
  'Repeat Activity': 'Actividad recurrente',
  'Visit, scan, or order to keep your rewards activity growing.':
    'Visita, escanea o pide para seguir aumentando tu actividad de recompensas.',
  'Partner Offers': 'Ofertas de aliados',
  'Next Tier Benefit': 'Beneficio del siguiente nivel',
  'Reach the next tier and qualify for higher-value perks.':
    'Alcanza el siguiente nivel y califica para beneficios de mayor valor.',
  'Rewards Catalog': 'Catálogo de recompensas',
  'Rewards Marketplace': 'Mercado de recompensas',
  'Use points for perks, reward credits, and offers from participating businesses.':
    'Usa puntos en beneficios, créditos de recompensa y ofertas de negocios participantes.',
  'Your Points': 'Tus puntos',
  'Available Points': 'Puntos disponibles',
  'Qualification Progress': 'Progreso de calificación',
  'Points Cost': 'Costo en puntos',
  'points needed': 'puntos necesarios',
  'Need More Points': 'Faltan puntos',
  'Points After': 'Puntos después',
  'Not Enough Points': 'Puntos insuficientes',
  'Active Campaigns': 'Campañas activas',
  'Promotions that turn visits into repeat business.':
    'Promociones que convierten visitas en clientes recurrentes.',
  'Browse current offers and earn bonus points on eligible purchases.':
    'Explora ofertas actuales y gana puntos extra en compras elegibles.',
  'Earn more points with participating businesses.':
    'Gana más puntos con negocios participantes.',
  'Browse current promotions and take advantage of bonus points and special deals.':
    'Explora promociones actuales y aprovecha puntos extra y ofertas especiales.',
  'Business:': 'Negocio:',
  'All Businesses': 'Todos los negocios',
  'Partner Businesses': 'Negocios aliados',
  'Shop Businesses': 'Comprar en negocios',
  'Browse partner businesses, complete purchases, and earn points automatically.':
    'Explora negocios aliados, completa compras y gana puntos automáticamente.',
  'View your past purchases and points earned.':
    'Revisa tus compras anteriores y los puntos ganados.',
  'points earned': 'puntos ganados',
  'Activity History': 'Historial de actividad',
  'Total Points': 'Puntos totales',
  'Points Earned': 'Puntos ganados',
  'Recent points earned': 'Puntos recientes ganados',
  'Member status': 'Estado de miembro',
  'Join the rewards network to earn points, track reward credits, and redeem rewards.':
    'Únete a la red de recompensas para ganar puntos, consultar créditos y canjear recompensas.',
  'Rewards Invitation': 'Invitación de recompensas',
  'Your referral invite qualified for a reward credit.':
    'Tu invitación de referido calificó para un crédito de recompensa.',
  'Join the rewards network.': 'Únete a la red de recompensas.',
  'Create your rewards account to earn points, track reward credits, and redeem rewards.':
    'Crea tu cuenta para ganar puntos, consultar créditos y canjear recompensas.',
  'Your rewards account starts here.': 'Tu cuenta de recompensas empieza aquí.',
  'Sign up once and keep every visit connected to your points balance.':
    'Regístrate una vez y mantén cada visita conectada a tu saldo de puntos.',
  'Create Rewards Account': 'Crear cuenta de recompensas',
  'Track members, campaigns, reward credits, and fulfillment from one operations dashboard.':
    'Administra miembros, campañas, créditos de recompensa y entregas desde un solo panel.',
  'Points Issued': 'Puntos otorgados',
  'Total points awarded to customers': 'Total de puntos otorgados a clientes',
  'Points Redeemed': 'Puntos canjeados',
  'Total points spent on rewards': 'Total de puntos usados en recompensas',
  'Manage Rewards': 'Gestionar recompensas',
  Campaigns: 'Campañas',
  'Create and manage promotions that engage customers and drive repeat purchases.':
    'Crea y administra promociones que atraen clientes e impulsan compras recurrentes.',
  'Create Campaign': 'Crear campaña',
  'Edit Campaign': 'Editar campaña',
  'New Campaign': 'Nueva campaña',
  'Update Campaign': 'Actualizar campaña',
  'No campaigns yet': 'Aún no hay campañas',
  'Create your first campaign to drive repeat engagement.':
    'Crea tu primera campaña para impulsar la participación recurrente.',
  'Create First Campaign': 'Crear primera campaña',
  'Manage your business information and rewards settings.':
    'Administra la información de tu negocio y la configuración de recompensas.',
  'Rewards Program': 'Programa de recompensas',
  'Points Rate (points per $1)': 'Tasa de puntos (puntos por $1)',
  'Customers earn this many points for every dollar spent.':
    'Los clientes ganan esta cantidad de puntos por cada dólar gastado.',
  'Award Points': 'Otorgar puntos',
  'Look up a customer, review their balance, and award points for in-store purchases.':
    'Busca un cliente, revisa su saldo y otorga puntos por compras en tienda.',
  'Choose a customer to preview their current balance before awarding points.':
    'Elige un cliente para ver su saldo actual antes de otorgar puntos.',
  'Points to Award': 'Puntos a otorgar',
  'Add Reward': 'Agregar recompensa',
  'Create and manage rewards customers can redeem with points.':
    'Crea y administra recompensas que los clientes pueden canjear con puntos.',
  'No rewards yet': 'Aún no hay recompensas',
  'Create your first redeemable reward for members.':
    'Crea tu primera recompensa canjeable para miembros.',
  'Create First Reward': 'Crear primera recompensa',
  'Adjust Points': 'Ajustar puntos',
  'Select a member to view the profile and update points.':
    'Selecciona un miembro para ver el perfil y actualizar puntos.',
  'Failed to adjust points.': 'No se pudieron ajustar los puntos.',
  'Points Adjustment': 'Ajuste de puntos',
  'Use a positive number to add points and a negative number to deduct them.':
    'Usa un número positivo para agregar puntos y uno negativo para descontarlos.',
  'Update Points': 'Actualizar puntos',
  'Business Revenue': 'Ingresos del negocio',
  'Browse Rewards': 'Explorar recompensas',
  'Review the details and confirm. Your points will be deducted and your reward will be ready for pick-up.':
    'Revisa los detalles y confirma. Se descontarán tus puntos y tu recompensa estará lista para recoger.',
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
  'Sign In': 'Iniciar sesión',
  Register: 'Registrarse',
  'Rewards Game': 'Juego de recompensas',
  'Medellin Rewards.': 'Medellin Rewards.',
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
  'Your account request is saved. Check your email if confirmation is required, then sign in. Reward actions may stay locked until admin approval.':
    'Tu solicitud de cuenta se guardó. Revisa tu correo si se requiere confirmación, luego inicia sesión. Las acciones de recompensas pueden permanecer bloqueadas hasta la aprobación del administrador.',
  'Join now': 'Unete ahora',
  'Subscribe to join': 'Suscribete para unirte',
  'Membership required': 'Membresia requerida',
  'Membership required. Earn when you shop locally.': 'Membresia requerida. Gana cuando compras localmente.',
  'Earn rewards': 'Gana recompensas',
  'every time': 'cada vez',
  'you shop locally': 'que compras localmente',
  'Join Rewards Club': 'Únete al Club de Recompensas',
  'For Businesses': 'Para negocios',
  'For businesses': 'Para negocios',
  'Browse rewards': 'Ver recompensas',
  'Earn 20% to 100% back': 'Gana de 20% a 100% de vuelta',
  'Redeem through Medellin Rewards': 'Canjea con Medellin Rewards',
  'Rewards are offer-based, not cash payouts. Your verified member account keeps reward value connected to you.':
    'Las recompensas se basan en ofertas, no en pagos en efectivo. Tu cuenta verificada mantiene el valor de recompensas conectado contigo.',
  'Rewards are offer-based, not cash payouts. Businesses choose offers they can afford.':
    'Las recompensas se basan en ofertas, no en pagos en efectivo. Los negocios eligen ofertas que pueden sostener.',
  'Subscribe as a member, shop at participating businesses, and collect rewards you can redeem through Medellin Rewards. Everyday shopping can build toward bigger perks, including travel-style rewards over time.':
    'Suscribete como miembro, compra en negocios participantes y acumula recompensas que puedes canjear con Medellin Rewards. Tus compras diarias pueden ayudarte a conseguir beneficios mas grandes, incluso recompensas tipo viaje con el tiempo.',
  'Create your member account, activate your subscription, and keep your rewards connected in one place.':
    'Crea tu cuenta de miembro, activa tu suscripcion y manten tus recompensas conectadas en un solo lugar.',
  'Create your member account and keep your rewards connected in one place.':
    'Crea tu cuenta de miembro y mantén tus recompensas conectadas en un solo lugar.',
  'Shop at participating businesses': 'Compra en negocios participantes',
  'Spend with local businesses in the Medellin Rewards network and earn rewards as you go.':
    'Compra en negocios locales de la red Medellin Rewards y gana recompensas mientras avanzas.',
  'Redeem your rewards': 'Canjea tus recompensas',
  'Use your rewards for member perks and offers, with bigger travel-style rewards possible over time.':
    'Usa tus recompensas para beneficios y ofertas de miembro, con recompensas tipo viaje más grandes posibles con el tiempo.',
  'Member subscription': 'Suscripcion de miembro',
  'Start a member subscription and keep your rewards connected.':
    'Activa una suscripcion de miembro y manten tus recompensas conectadas.',
  'Earn at participating businesses': 'Gana en negocios participantes',
  'Shop locally and collect rewards on eligible purchases.':
    'Compra localmente y acumula recompensas en compras elegibles.',
  'Claim member offers through a simple rewards flow.':
    'Reclama ofertas de miembro con un flujo de recompensas simple.',
  'Verified member account': 'Cuenta de miembro verificada',
  'One account per person helps protect your reward value.':
    'Una cuenta por persona ayuda a proteger el valor de tus recompensas.',
  'Businesses control their offers': 'Los negocios controlan sus ofertas',
  'Owners choose rewards that make sense for their margins.':
    'Los dueños eligen recompensas que tienen sentido para sus márgenes.',
  'Example rewards': 'Ejemplos de recompensas',
  'Available rewards': 'Recompensas disponibles',
  'Real rewards members can browse now.': 'Recompensas reales que los miembros pueden explorar ahora.',
  'Browse current member rewards before joining. Your account must be verified before reward actions unlock.':
    'Explora recompensas actuales antes de unirte. Tu cuenta debe estar verificada antes de desbloquear acciones de recompensas.',
  'Rewards are being added.': 'Se estan agregando recompensas.',
  'Check back soon for live member rewards from Medellin Rewards.':
    'Vuelve pronto para ver recompensas reales para miembros de Medellin Rewards.',
  'points to redeem': 'puntos para canjear',
  'Example rewards members could unlock.': 'Ejemplos de recompensas que los miembros podrían desbloquear.',
  'These examples show how the value can feel to a member. Live offers depend on the rewards available in Medellin Rewards.':
    'Estos ejemplos muestran cómo se puede sentir el valor para un miembro. Las ofertas reales dependen de las recompensas disponibles en Medellin Rewards.',
  'These examples show how the value can feel to a member. Live offers depend on participating businesses and the rewards they choose to launch.':
    'Estos ejemplos muestran cómo se puede sentir el valor para un miembro. Las ofertas reales dependen de los negocios participantes y de las recompensas que decidan lanzar.',
  'Example drink reward': 'Ejemplo de recompensa de bebida',
  'Coffee or drink perk': 'Beneficio de café o bebida',
  'A member shops locally, earns rewards, and redeems for a simple cafe-style perk.':
    'Un miembro compra localmente, gana recompensas y las canjea por un beneficio simple tipo cafetería.',
  'Example food reward': 'Ejemplo de recompensa de comida',
  'Pastry or meal offer': 'Oferta de pastel o comida',
  'Everyday purchases can build toward small offers members understand right away.':
    'Las compras diarias pueden acumularse para ofertas pequeñas que los miembros entienden de inmediato.',
  'Example bigger reward': 'Ejemplo de recompensa mayor',
  'Travel-style value': 'Valor tipo viaje',
  'Consistent local spending can build toward bigger rewards over time.':
    'Comprar localmente de forma constante puede acumular valor para recompensas más grandes con el tiempo.',
  'Shop locally -> earn rewards -> redeem value': 'Compra localmente -> gana recompensas -> canjea valor',
  'How it works': 'Cómo funciona',
  'Join, shop, and redeem without learning a complicated points system.':
    'Únete, compra y canjea sin aprender un sistema complicado de puntos.',
  'Create your account, verify once, and activate your membership before reward actions unlock.':
    'Crea tu cuenta, verificate una vez y activa tu membresia antes de desbloquear acciones de recompensas.',
  'Sign up once from the website, a business QR code, or a partner link.':
    'Regístrate una vez desde el sitio web, un código QR de un negocio o un enlace de aliado.',
  'Shop and earn': 'Compra y gana',
  'Spend at participating local businesses and collect rewards on eligible purchases.':
    'Compra en negocios locales participantes y acumula recompensas en compras elegibles.',
  'Redeem rewards': 'Canjea recompensas',
  'Use your rewards through Medellin Rewards when you are ready to claim an offer.':
    'Usa tus recompensas con Medellin Rewards cuando estés listo para reclamar una oferta.',
  'Turn first-time customers into repeat visits with rewards you control.':
    'Convierte clientes nuevos en visitas repetidas con recompensas que tú controlas.',
  'Businesses can launch QR signup links, encourage repeat visits, let staff validate redemptions, and use the calculator to understand the real cost before choosing an offer.':
    'Los negocios pueden lanzar enlaces QR de registro, incentivar visitas repetidas, permitir que el personal valide canjes y usar la calculadora para entender el costo real antes de elegir una oferta.',
  'Book Business Demo': 'Agendar demo para negocios',
  'See calculator': 'Ver calculadora',
  'QR signup links for checkout, tables, events, and partner desks':
    'Enlaces QR de registro para caja, mesas, eventos y puntos de aliados',
  'Reward offers that give customers a clear reason to come back':
    'Ofertas de recompensa que dan a los clientes una razón clara para volver',
  'Simple staff validation when members redeem in-store':
    'Validación simple por el personal cuando los miembros canjean en tienda',
  'Cost calculator that shows the real business impact before launch':
    'Calculadora de costos que muestra el impacto real antes del lanzamiento',
  'Reward example': 'Ejemplo de recompensa',
  'Members see clear value. Businesses stay in control of cost.':
    'Los miembros ven valor claro. Los negocios mantienen control del costo.',
  'Example: when a member earns $250 in reward value, a business with 25% hard cost may only feel $62.50 in real product cost.':
    'Ejemplo: cuando un miembro gana $250 en valor de recompensa, un negocio con 25% de costo directo puede sentir solo $62.50 en costo real de producto.',
  'Why it works': 'Por qué funciona',
  'Why join': 'Por qué unirse',
  'Clear rewards, simple redemption, one member account.':
    'Recompensas claras, canje simple y una sola cuenta de miembro.',
  'Medellin Rewards is built so members can understand the value, keep rewards organized, and redeem without a complicated points system.':
    'Medellin Rewards está diseñado para que los miembros entiendan el valor, mantengan sus recompensas organizadas y canjeen sin un sistema complicado de puntos.',
  'Clear value for members, controlled cost for businesses.':
    'Valor claro para miembros, costo controlado para negocios.',
  'Medellin Rewards is built to make rewards feel valuable without forcing businesses into cash-style payouts they cannot sustain.':
    'Medellin Rewards está diseñado para que las recompensas se sientan valiosas sin obligar a los negocios a pagos tipo efectivo que no puedan sostener.',
  'Rewards are not cash payouts': 'Las recompensas no son pagos en efectivo',
  'Rewards are member perks and offers you redeem through Medellin Rewards.':
    'Las recompensas son beneficios y ofertas para miembros que canjeas con Medellin Rewards.',
  'Members see useful value, while businesses can fulfill rewards through offers and experiences.':
    'Los miembros ven valor útil, mientras los negocios pueden cumplir recompensas mediante ofertas y experiencias.',
  'Your rewards stay connected': 'Tus recompensas se mantienen conectadas',
  'Your member account keeps eligible rewards together across participating locations.':
    'Tu cuenta de miembro mantiene juntas las recompensas elegibles en ubicaciones participantes.',
  'Businesses choose what they can afford': 'Los negocios eligen lo que pueden sostener',
  'Each offer can match the business model, margins, and real product cost.':
    'Cada oferta puede ajustarse al modelo del negocio, sus márgenes y el costo real del producto.',
  'Redemptions stay simple': 'Los canjes se mantienen simples',
  'Claim a reward when you are ready and follow the redemption steps in your account.':
    'Reclama una recompensa cuando estés listo y sigue los pasos de canje en tu cuenta.',
  'Staff validation keeps redemptions simple': 'La validación del personal simplifica los canjes',
  'Members claim rewards and staff confirm them through the redemption flow.':
    'Los miembros reclaman recompensas y el personal las confirma mediante el flujo de canje.',
  'ID verification protects reward value': 'La verificación de ID protege el valor de las recompensas',
  'One verified member account per person helps protect the program for everyone.':
    'Una cuenta verificada por persona ayuda a proteger el programa para todos.',
  'ID verified': 'ID verificado',
  'Reward actions are unlocked for this member account.':
    'Las acciones de recompensas estan desbloqueadas para esta cuenta de miembro.',
  'Your ID is submitted': 'Tu ID fue enviado',
  'Reward actions stay locked until admin approval.':
    'Las acciones de recompensas permanecen bloqueadas hasta la aprobacion del administrador.',
  'ID verification needs another look': 'La verificacion de ID necesita otra revision',
  'Your submission was not approved. Update your ID details to request another review.':
    'Tu envio no fue aprobado. Actualiza los datos de tu ID para pedir otra revision.',
  'Resubmit in profile': 'Reenviar en perfil',
  'Finish ID verification': 'Termina la verificacion de ID',
  'Upload your ID in profile before earning points, redeeming rewards, issuing gift cards, or activating reward credits.':
    'Sube tu ID en el perfil antes de ganar puntos, canjear recompensas, emitir tarjetas de regalo o activar creditos de recompensa.',
  'Verify in profile': 'Verificar en perfil',
  'Verify ID': 'Verificar ID',
  'ID verification required': 'Se requiere verificacion de ID',
  Issue: 'Emitir',
  'Verify ID to place order': 'Verifica tu ID para hacer el pedido',
  'ID verification is required before placing demo orders that earn rewards.':
    'Se requiere verificacion de ID antes de hacer pedidos demo que generan recompensas.',
  'Verify ID to redeem': 'Verifica tu ID para canjear',
  'Verify ID to renew': 'Verifica tu ID para renovar',
  'Verify ID to subscribe': 'Verifica tu ID para suscribirte',
  'Demo mode - no real charge.': 'Modo demo - sin cargo real.',
  'Renew now - Demo': 'Renovar ahora - Demo',
  'Resubscribe - Demo': 'Resuscribirse - Demo',
  'Subscribe - Demo': 'Suscribirse - Demo',
  'Ready to join the rewards circle?': '¿Listo para unirte al círculo de recompensas?',
  'Create your member account, activate your subscription, browse available rewards, and keep your reward value connected in one place.':
    'Crea tu cuenta de miembro, activa tu suscripcion, explora recompensas disponibles y manten el valor de tus recompensas conectado en un solo lugar.',
  'Start as a member, explore participating businesses, or book a demo to launch rewards for your own business.':
    'Empieza como miembro, explora negocios participantes o agenda una demo para lanzar recompensas en tu propio negocio.',
  Terms: 'Terminos',
  Privacy: 'Privacidad',
  'Reward Terms': 'Terminos de recompensas',
  'Verification Policy': 'Politica de verificacion',
  Legal: 'Legal',
  'Customer trust': 'Confianza del cliente',
  'Terms of Use': 'Terminos de uso',
  'Plain-language placeholder terms for Medellin Rewards members. These should be reviewed by a qualified legal professional before launch.':
    'Terminos provisionales en lenguaje claro para miembros de Medellin Rewards. Deben ser revisados por un profesional legal calificado antes del lanzamiento.',
  'Member accounts': 'Cuentas de miembro',
  'Members are responsible for keeping account details accurate and secure. One member account should represent one real person.':
    'Los miembros son responsables de mantener sus datos de cuenta correctos y seguros. Una cuenta de miembro debe representar a una persona real.',
  'Rewards are offer-based': 'Las recompensas se basan en ofertas',
  'Rewards are not cash payouts. Available rewards, point costs, eligibility, and redemption steps may change as the program evolves.':
    'Las recompensas no son pagos en efectivo. Las recompensas disponibles, costos en puntos, elegibilidad y pasos de canje pueden cambiar mientras el programa evoluciona.',
  'Program access': 'Acceso al programa',
  'Reward actions may require sign-in, active account status, and completed ID verification before earning or redeeming value.':
    'Las acciones de recompensas pueden requerir inicio de sesion, cuenta activa y verificacion de ID completada antes de ganar o canjear valor.',
  'Membership subscription': 'Suscripcion de miembro',
  'Joining Medellin Rewards requires an active paid membership subscription. Reward actions may require sign-in, active subscription status, and completed ID verification before earning or redeeming value.':
    'Unirse a Medellin Rewards requiere una suscripcion de membresia pagada y activa. Las acciones de recompensas pueden requerir inicio de sesion, suscripcion activa y verificacion de ID completada antes de ganar o canjear valor.',
  'Privacy Policy': 'Politica de privacidad',
  'Plain-language placeholder privacy notes for Medellin Rewards. Replace with reviewed legal copy before launch.':
    'Notas provisionales de privacidad en lenguaje claro para Medellin Rewards. Reemplazalas con texto legal revisado antes del lanzamiento.',
  'Information we collect': 'Informacion que recopilamos',
  'The app may collect account details, contact details, activity, reward history, and ID verification submissions needed to operate the program.':
    'La app puede recopilar datos de cuenta, contacto, actividad, historial de recompensas y envios de verificacion de ID necesarios para operar el programa.',
  'How information is used': 'Como se usa la informacion',
  'Information is used to manage accounts, review verification, protect reward value, support redemptions, and improve the member experience.':
    'La informacion se usa para administrar cuentas, revisar verificaciones, proteger el valor de recompensas, apoyar canjes y mejorar la experiencia del miembro.',
  'Support contact': 'Contacto de soporte',
  'For privacy questions, members can contact support@medellinrewards.com.':
    'Para preguntas de privacidad, los miembros pueden contactar a support@medellinrewards.com.',
  'Plain-language placeholder reward terms explaining how Medellin Rewards value works for members.':
    'Terminos provisionales de recompensas en lenguaje claro que explican como funciona el valor de Medellin Rewards para miembros.',
  'No cash payout promise': 'Sin promesa de pago en efectivo',
  'Rewards represent offers, perks, credits, or experiences available through Medellin Rewards. They are not a promise of cash payment.':
    'Las recompensas representan ofertas, beneficios, creditos o experiencias disponibles con Medellin Rewards. No son una promesa de pago en efectivo.',
  'Reward availability': 'Disponibilidad de recompensas',
  'Rewards may have inventory, expiration, eligibility, location, point cost, or verification requirements before they can be claimed.':
    'Las recompensas pueden tener inventario, vencimiento, elegibilidad, ubicacion, costo en puntos o requisitos de verificacion antes de reclamarse.',
  'Redemption review': 'Revision de canje',
  'Some reward actions may be validated by staff or administrators to keep the program fair and prevent duplicate or invalid claims.':
    'Algunas acciones de recompensas pueden ser validadas por personal o administradores para mantener el programa justo y prevenir reclamos duplicados o invalidos.',
  'Plain-language placeholder notes about why member verification is required before reward actions unlock.':
    'Notas provisionales en lenguaje claro sobre por que se requiere verificacion de miembros antes de desbloquear acciones de recompensas.',
  'Why verification is required': 'Por que se requiere verificacion',
  'Verification helps support one member account per person and protects reward value for legitimate members.':
    'La verificacion ayuda a mantener una cuenta por persona y protege el valor de recompensas para miembros legitimos.',
  'How review works': 'Como funciona la revision',
  'Admins review submitted ID details. Reward actions may stay locked while a submission is pending or if more information is needed.':
    'Los administradores revisan los datos de ID enviados. Las acciones de recompensas pueden permanecer bloqueadas mientras una solicitud esta pendiente o si se necesita mas informacion.',
  'How ID information is used': 'Como se usa la informacion de ID',
  'ID information should be used only for member verification and account protection. Members can contact support@medellinrewards.com with questions.':
    'La informacion de ID debe usarse solo para verificacion de miembros y proteccion de cuenta. Los miembros pueden contactar a support@medellinrewards.com si tienen preguntas.',
  'Travel-style rewards': 'Recompensas tipo viaje',
  'can start with': 'pueden empezar con',
  'everyday spending': 'compras diarias',
  'Imagine using rewards toward travel-style perks over time by earning Rewards on things you already do. Medellin Rewards offers a minimum of 20% and up to 100% in Rewards every time you spend at businesses within our network.':
    'Imagina usar recompensas para beneficios tipo viaje con el tiempo al ganar Rewards en cosas que ya haces. Medellin Rewards ofrece un minimo de 20% y hasta 100% en recompensas cada vez que compras en negocios de nuestra red.',
  'Browse shops': 'Ver tiendas',
  'View rewards': 'Ver recompensas',
  'Become an ambassador': 'Conviértete en embajador',
  'Featured rewards circle': 'Círculo de recompensas destacado',
  'Earn from what you already do': 'Gana con lo que ya haces',
  'The video will explain the program in a simple way, then members can explore where their everyday spending turns into Rewards.':
    'El video explicará el programa de forma simple, luego los miembros pueden explorar dónde sus compras diarias se convierten en recompensas.',
  '20% to 100% back': '20% a 100% de vuelta',
  'Earn a minimum of 20% and up to 100% in Rewards when you spend within the network.':
    'Gana un mínimo de 20% y hasta 100% en recompensas cuando compras dentro de la red.',
  'Member bonus': 'Bono de miembro',
  'Keep rewards connected across visits, referrals, and participating local businesses.':
    'Mantén tus recompensas conectadas entre visitas, referidos y negocios locales participantes.',
  'More ways to earn': 'Más formas de ganar',
  'Members will earn from everyday spending now, with lower Rewards on big purchases planned for the future.':
    'Los miembros ganarán por compras diarias ahora, con recompensas menores en compras grandes previstas para el futuro.',
  'Step back into your rewards ritual.': 'Vuelve a tu ritual de recompensas.',
  'Join the circle and start collecting delights.': 'Únete al círculo y empieza a acumular beneficios.',
  'Create your account, verify once, and activate your membership to earn points, unlock perks, and move through the circle with ease.':
    'Crea tu cuenta, verificate una vez y activa tu membresia para ganar puntos, desbloquear beneficios y avanzar por el circulo con facilidad.',
  'Join the Rewards Club': 'Únete al Club de Recompensas',
  'Sign in': 'Iniciar sesión',
  'Rewards for the places you already enjoy.': 'Recompensas para los lugares que ya disfrutas.',
  'Create your account, verify once, and activate your member subscription to keep rewards connected across participating businesses.':
    'Crea tu cuenta, verificate una vez y activa tu suscripcion de miembro para mantener tus recompensas conectadas entre negocios participantes.',
  'Create account': 'Crear cuenta',
  'Collect points and credits when you shop with participating local businesses.':
    'Acumula puntos y créditos cuando compras en negocios locales participantes.',
  'Unlock perks': 'Desbloquea beneficios',
  'Find member offers, rewards, gift cards, and promotions in one place.':
    'Encuentra ofertas de miembro, recompensas, tarjetas de regalo y promociones en un solo lugar.',
  'Share invites': 'Comparte invitaciones',
  'Invite friends and track rewards as the network grows around you.':
    'Invita amigos y sigue tus recompensas mientras la red crece a tu alrededor.',
  'Welcome to the Rewards Club.': 'Bienvenido al Club de Recompensas.',
  'Go to sign in': 'Ir a iniciar sesión',
  'Upload a photo or PDF of your ID for account verification.':
    'Sube una foto o PDF de tu ID para verificar la cuenta.',
  'Create your member account': 'Crea tu cuenta de miembro',
  'Membership is subscription-based. Create your account first, then activate membership when your account is ready.':
    'La membresia funciona por suscripcion. Crea tu cuenta primero y luego activa la membresia cuando tu cuenta este lista.',
  'Why we verify members': 'Por qué verificamos a los miembros',
  'One account per person keeps rewards fair across the network.':
    'Una cuenta por persona mantiene las recompensas justas en toda la red.',
  'Verification protects reward value before members earn or redeem.':
    'La verificación protege el valor de las recompensas antes de que los miembros ganen o canjeen.',
  'Admins review submissions, and your ID is used only for verification.':
    'Los administradores revisan los envíos y tu ID se usa solo para verificación.',
  'Full name': 'Nombre completo',
  'Email address': 'Correo electrónico',
  'Verification ID number': 'Número de ID de verificación',
  'ID number': 'Número de ID',
  'Photo or PDF of ID': 'Foto o PDF del ID',
  'Used only to verify one member account per person before rewards can be earned or redeemed.':
    'Se usa solo para verificar una cuenta de miembro por persona antes de que se puedan ganar o canjear recompensas.',
  'After signup, your account may need admin approval before reward actions unlock.':
    'Después del registro, tu cuenta puede necesitar aprobación administrativa antes de desbloquear acciones de recompensas.',
  'Already a member?': '¿Ya eres miembro?',
  'Used by admins to verify one member account per person.':
    'Usado por administradores para verificar una cuenta de miembro por persona.',
  'Enter a valid email': 'Ingresa un correo válido',
  'Use at least 5 characters': 'Usa al menos 5 caracteres',
  'Enter your full name': 'Ingresa tu nombre completo',
  'Enter the ID number shown on your verification document':
    'Ingresa el número de ID que aparece en tu documento de verificación',
  'Keep the ID number under 80 characters':
    'Mantén el número de ID por debajo de 80 caracteres',
  'Enter your full name to create an account.': 'Ingresa tu nombre completo para crear una cuenta.',
  'Enter the ID number shown on your verification document.':
    'Ingresa el número de ID que aparece en tu documento de verificación.',
  'Go to sign in ->': 'Ir a iniciar sesión ->',
  'Create your member account and start earning XP after your membership is active.':
    'Crea tu cuenta de miembro y empieza a ganar XP cuando tu membresia este activa.',
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
  'Quest Invitation': 'Invitación de misión',
  'Your party invite unlocked a reward credit.':
    'Tu invitación desbloqueó un crédito de recompensa.',
  'Join the rewards quest.': 'Únete a la misión de recompensas.',
  'Create your rewards account and, after the invite is approved, both you and your friend get a reward credit.':
    'Crea tu cuenta de recompensas y, cuando se apruebe la invitación, tú y tu amigo recibirán un crédito de recompensa.',
  'Create your rewards account to earn XP, track reward credits, and unlock rewards.':
    'Crea tu cuenta de recompensas para ganar XP, llevar el control de créditos de recompensa y desbloquear recompensas.',
  'Two reward credits, one party invite.':
    'Dos créditos de recompensa, una invitación.',
  'Your first quest starts here.': 'Tu primera misión empieza aquí.',
  'Your reward credit appears after your signup is reviewed.':
    'Tu crédito de recompensa aparecerá cuando se revise tu registro.',
  'Sign up once and keep every visit connected to your XP balance.':
    'Regístrate una vez y mantén cada visita conectada a tu saldo de XP.',
  'Ready to claim the invitation?': '¿Listo para reclamar la invitación?',
  'Ready to start earning?': '¿Listo para empezar a ganar?',
  'Claim Reward Credit': 'Reclamar crédito de recompensa',
  'Create your account to claim the invite.':
    'Crea tu cuenta para reclamar la invitación.',
  'Create your rewards account.': 'Crea tu cuenta de recompensas.',
  'After staff approves the invite, both you and your friend receive a reward credit.':
    'Cuando el personal apruebe la invitación, tú y tu amigo recibirán un crédito de recompensa.',
  'Join the loyalty program to earn XP, track reward credits, and redeem rewards.':
    'Únete al programa de fidelidad para ganar XP, llevar el control de créditos de recompensa y canjear recompensas.',
  'Already have an account? Sign in': '¿Ya tienes una cuenta? Inicia sesión',
  'Your invite status is pending. Staff will review it before reward credits are added.':
    'Tu invitación está pendiente. El personal la revisará antes de agregar los créditos de recompensa.',
  'Use a new email address to claim this referral offer.':
    'Usa un correo nuevo para reclamar esta oferta de referido.',
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
  'Quest History': 'Historial de misiones',
  'Your Timeline': 'Tu cronología',
  'Every visit, bonus, and reward claim in one clear timeline.':
    'Cada visita, bono y canje de recompensa en una cronología clara.',
  'Loyalty Status': 'Estado de fidelidad',
  'Total XP': 'XP total',
  Visits: 'Visitas',
  'Total recorded visits': 'Total de visitas registradas',
  'XP Earned': 'XP ganado',
  'Recent XP earned': 'XP reciente ganado',
  Redemptions: 'Canjes',
  'Rewards redeemed': 'Recompensas canjeadas',
  Timeline: 'Cronología',
  'Most Recent First': 'Más reciente primero',
  'Your Orders': 'Tus pedidos',
  'View your past purchases and XP earned.':
    'Revisa tus compras anteriores y el XP ganado.',
  'No orders yet.': 'Aún no hay pedidos.',
  'Start Shopping': 'Empezar a comprar',
  'XP earned': 'XP ganado',
  Processing: 'Procesando',
  Posted: 'Publicado',
  'Order not found.': 'Pedido no encontrado.',
  'Continue Shopping': 'Seguir comprando',
  'Order Confirmed': 'Pedido confirmado',
  'Thank you!': '¡Gracias!',
  'Your order has been placed successfully.':
    'Tu pedido se realizó correctamente.',
  'Order Details': 'Detalles del pedido',
  'Processing - available within 24 hours':
    'Procesando - disponible dentro de 24 horas',
  'View Orders': 'Ver pedidos',
  'Redeem Reward': 'Canjear recompensa',
  'Confirm your next treat.': 'Confirma tu próximo premio.',
  'Review the details and confirm. Your XP will be deducted and your reward will be ready for pick-up.':
    'Revisa los detalles y confirma. Se descontará tu XP y tu recompensa estará lista para recoger.',
  'Return to Catalog': 'Volver al catálogo',
  Available: 'Disponibles',
  'XP After': 'XP después',
  'Pickup window': 'Horario de recogida',
  Notes: 'Notas',
  'Pickup notes, substitutions, or timing...':
    'Notas de recogida, sustituciones u horario...',
  'Processing...': 'Procesando...',
  'Redeem Now': 'Canjear ahora',
  'Not Enough XP': 'XP insuficiente',
  'Your Profile': 'Tu perfil',
  'Keep your details and preferences up to date.':
    'Mantén tus datos y preferencias actualizados.',
  'Status level': 'Nivel de estado',
  Active: 'Activo',
  'Member Status': 'Estado de miembro',
  'Quick Info': 'Información rápida',
  'Contact Details': 'Datos de contacto',
  Phone: 'Teléfono',
  'For order coordination': 'Para coordinar pedidos',
  Location: 'Ubicación',
  'Default shop location': 'Tienda predeterminada',
  Preferences: 'Preferencias',
  'Edit Profile': 'Editar perfil',
  'Phone Number': 'Número de teléfono',
  'Home Shop': 'Tienda principal',
  'Favorite Order': 'Pedido favorito',
  'Your favorite drink...': 'Tu bebida favorita...',
  'This helps staff prepare your order.':
    'Esto ayuda al personal a preparar tu pedido.',
  'Saving...': 'Guardando...',
  'Save Changes': 'Guardar cambios',
  'Signup Portal': 'Portal de registro',
  'Display this portal at checkout or on signage. New customers scan it, create an account, and appear below as pending invites before their reward credit is added.':
    'Muestra este portal en caja o en letreros. Los nuevos clientes lo escanean, crean una cuenta y aparecen abajo como invitaciones pendientes antes de agregar su crédito de recompensa.',
  'Signup QR link unavailable': 'Enlace QR de registro no disponible',
  'Signup QR link copied': 'Enlace QR de registro copiado',
  Copied: 'Copiado',
  'Copy Portal Link': 'Copiar enlace del portal',
  'signup portal': 'portal de registro',
  'Approve the invite below to grant the reward credit.':
    'Aprueba la invitación de abajo para otorgar el crédito de recompensa.',
  'Reward Credit Scanner': 'Escáner de crédito de recompensa',
  "Enter the customer's 6-digit reward credit code":
    'Ingresa el código de crédito de recompensa de 6 dígitos del cliente',
  'Redemption code': 'Código de canje',
  'Scanning...': 'Escaneando...',
  'Validate Reward Credit': 'Validar crédito de recompensa',
  'Pending Invites': 'Invitaciones pendientes',
  'Review new customer reward credit invites':
    'Revisa las invitaciones de crédito de recompensa de nuevos clientes',
  'View and manage your product catalog and inventory.':
    'Consulta y administra tu catálogo de productos e inventario.',
  'Add Product': 'Agregar producto',
  'Edit Product': 'Editar producto',
  'New Product': 'Nuevo producto',
  Title: 'Título',
  Description: 'Descripción',
  Category: 'Categoría',
  'Select a category': 'Selecciona una categoría',
  'Price ($)': 'Precio ($)',
  Highlight: 'Destacar',
  Cancel: 'Cancelar',
  'Update Product': 'Actualizar producto',
  'No products yet': 'Aún no hay productos',
  'Products added via the admin portal will appear here.':
    'Los productos agregados desde el portal admin aparecerán aquí.',
  'Are you sure you want to delete this product?':
    '¿Seguro que quieres eliminar este producto?',
  'Action failed.': 'La acción falló.',
  'Create and manage vault rewards your customers can unlock with XP.':
    'Crea y administra recompensas que tus clientes pueden desbloquear con XP.',
  'Add Vault Reward': 'Agregar recompensa',
  'Edit Reward': 'Editar recompensa',
  'New Reward': 'Nueva recompensa',
  Specialty: 'Especialidad',
  'Update Reward': 'Actualizar recompensa',
  'No vault rewards yet': 'Aún no hay recompensas',
  'Create your first unlockable reward for members.':
    'Crea tu primera recompensa desbloqueable para miembros.',
  'Create First Vault Reward': 'Crear primera recompensa',
  'Are you sure you want to delete this reward?':
    '¿Seguro que quieres eliminar esta recompensa?',
  Quests: 'Misiones',
  'Create and manage bonus quests to engage and reward your customers.':
    'Crea y administra misiones extra para atraer y recompensar a tus clientes.',
  'Create Quest': 'Crear misión',
  'Edit Quest': 'Editar misión',
  'New Quest': 'Nueva misión',
  'Badge Label': 'Etiqueta',
  'Call to Action': 'Llamado a la acción',
  Audience: 'Audiencia',
  'Update Quest': 'Actualizar misión',
  'No quests yet': 'Aún no hay misiones',
  'Create your first bonus quest to drive engagement.':
    'Crea tu primera misión extra para impulsar la participación.',
  'Create First Quest': 'Crear primera misión',
  Expired: 'Vencida',
  'Are you sure you want to delete this promotion?':
    '¿Seguro que quieres eliminar esta promoción?',
  'Look up a customer, review their balance, and award XP for in-store purchases.':
    'Busca un cliente, revisa su saldo y otorga XP por compras en tienda.',
  'active customers': 'clientes activos',
  'Quick Action': 'Acción rápida',
  'Award XP': 'Otorgar XP',
  'Failed to award points.': 'No se pudieron otorgar puntos.',
  Customer: 'Cliente',
  'Search by customer ID': 'Buscar por ID de cliente',
  'No customer selected': 'Ningún cliente seleccionado',
  'Choose a customer to preview their current balance before awarding XP.':
    'Elige un cliente para ver su saldo actual antes de otorgar XP.',
  'XP to Award': 'XP a otorgar',
  Reason: 'Motivo',
  'e.g., In-store purchase $12.50': 'p. ej., compra en tienda $12.50',
  'Awarding...': 'Otorgando...',
  'Customer Base': 'Base de clientes',
  'Your Customers': 'Tus clientes',
  'Loading customers...': 'Cargando clientes...',
  Select: 'Seleccionar',
  'No customers yet': 'Aún no hay clientes',
  "Customers will appear here once they've purchased from your business.":
    'Los clientes aparecerán aquí cuando compren en tu negocio.',
  'Loading...': 'Cargando...',
  'Manage your business information and quest reward settings.':
    'Administra la información de tu negocio y la configuración de recompensas.',
  'Business Information': 'Información del negocio',
  Details: 'Detalles',
  'Business Name': 'Nombre del negocio',
  'Not set': 'Sin definir',
  'Quest Program': 'Programa de misiones',
  'XP Rate (XP per $1)': 'Tasa de XP (XP por $1)',
  'Customers earn this much XP for every dollar spent.':
    'Los clientes ganan esta cantidad de XP por cada dólar gastado.',
  'Tax Rate': 'Tasa de impuesto',
  'Enter as decimal (e.g., 0.0875 for 8.75%)':
    'Ingresa como decimal (p. ej., 0.0875 para 8.75%)',
  'Business Status': 'Estado del negocio',
  'Your business is currently active': 'Tu negocio está activo',
  'Your business is currently inactive': 'Tu negocio está inactivo',
  Inactive: 'Inactivo',
  'Failed to save settings. Please try again.':
    'No se pudo guardar la configuración. Inténtalo de nuevo.',
  'Settings saved!': 'Configuración guardada.',
  'Staff Authentication Required': 'Autenticación de personal requerida',
  'Admin access requires staff credentials.':
    'El acceso admin requiere credenciales de personal.',
  'Please use the staff demo credentials or sign in with a verified admin account to manage rewards, promotions, and member data.':
    'Usa las credenciales demo del personal o inicia sesión con una cuenta admin verificada para administrar recompensas, promociones y datos de miembros.',
  'Return to Home': 'Volver al inicio',
  'Operations Portal': 'Portal de operaciones',
  'Admin Dashboard': 'Panel admin',
  'Manage members, rewards, promotions, and monitor activity across the platform.':
    'Administra miembros, recompensas y promociones, y monitorea la actividad de la plataforma.',
  Partners: 'Aliados',
  Referrals: 'Referidos',
  'Member Profile': 'Perfil del miembro',
  'Adjust XP': 'Ajustar XP',
  Joined: 'Se unió',
  'Using...': 'Usando...',
  'Not provided': 'No proporcionado',
  'Member ID': 'ID de miembro',
  'Select a member to view the profile and update XP.':
    'Selecciona un miembro para ver el perfil y actualizar XP.',
  'Failed to adjust XP.': 'No se pudo ajustar XP.',
  'Please fix the highlighted member adjustment fields.':
    'Corrige los campos marcados del ajuste de miembro.',
  'Select from the customer list or paste a member id':
    'Selecciona de la lista de clientes o pega un ID de miembro',
  Selected: 'Seleccionado',
  'Current balance': 'Saldo actual',
  'XP Adjustment': 'Ajuste de XP',
  'Use a positive number to add XP and a negative number to deduct it.':
    'Usa un número positivo para agregar XP y uno negativo para descontarlo.',
  'e.g., Service recovery': 'p. ej., compensación de servicio',
  'Update XP': 'Actualizar XP',
  'Active Members': 'Miembros activos',
  'View Profile': 'Ver perfil',
  'Something went wrong': 'Algo salió mal',
  'An unexpected error occurred. Please reload the page to continue.':
    'Ocurrió un error inesperado. Recarga la página para continuar.',
  'Reload Page': 'Recargar página',
  'Command Center': 'Centro de mando',
  'Track members, quests, reward credits, and reward fulfillment from one arcade operations hub.':
    'Administra miembros, misiones, créditos de recompensa y cumplimiento de recompensas desde un solo panel.',
  'Members Recruited': 'Miembros reclutados',
  'Orders Completed': 'Pedidos completados',
  'Realm Revenue': 'Ingresos del negocio',
  'XP Issued': 'XP otorgado',
  'Total XP awarded to customers': 'Total de XP otorgado a clientes',
  'XP Redeemed': 'XP canjeado',
  'Total XP spent on rewards': 'Total de XP gastado en recompensas',
  'Command Shortcuts': 'Accesos rápidos',
  Manage: 'Gestionar',
  'Loading referrals...': 'Cargando referidos...',
  'No pending referrals.': 'No hay referidos pendientes.',
  Referrer: 'Referidor',
  'New Customer': 'Nuevo cliente',
  Approve: 'Aprobar',
  Reject: 'Rechazar',
  'Fulfillment Queue': 'Cola de cumplimiento',
  'Manage and fulfill pending reward claims':
    'Gestiona y cumple las solicitudes de recompensas pendientes.',
  'Manage Vault': 'Gestionar bóveda',
  'No redemptions yet.': 'Aún no hay canjes.',
  'Redeemed {date} at {time}': 'Canjeado el {date} a las {time}',
  Fulfill: 'Completar',
  'Download QR': 'Descargar QR',
  'QR code downloaded.': 'Código QR descargado.',
  'Unable to download QR code.': 'No se pudo descargar el código QR.',
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
