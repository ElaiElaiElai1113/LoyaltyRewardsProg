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
  'Go to sign in': 'Ir a iniciar sesión',
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
