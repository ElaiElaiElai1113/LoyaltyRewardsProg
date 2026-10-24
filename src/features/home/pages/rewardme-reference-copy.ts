// Functional Spanish translations of the supplied English PDF. They are scoped
// to the restored RewardMe homepage; the supplied English remains authoritative.
const spanish: Record<string, string> = {
  'How It Works': 'Cómo funciona',
  'For Business': 'Para negocios',
  'Rewards': 'Recompensas',
  'Join Free': 'Únete gratis',
  'Free to Join': 'Gratis para unirse',
  'Get rewarded for spending where you already love.': 'Recibe recompensas por gastar en los lugares que ya te encantan.',
  'Earn real rewards every time you visit your favorite local cafés, boutiques, and studios. No cost to join, no catch — just points that turn into things you actually want.': 'Gana recompensas reales cada vez que visites tus cafés, boutiques y estudios locales favoritos. Sin costo para unirte, sin trampas: solo puntos que se convierten en cosas que de verdad quieres.',
  'Good evening,': 'Buenas noches,',
  'YOUR BALANCE': 'TU SALDO',
  'Worth ~$23.40 in rewards': 'Equivale a ~$23.40 en recompensas',
  '4-week streak': 'Racha de 4 semanas',
  'Visit once more this week to keep it': 'Visítanos una vez más esta semana para mantenerla',
  'Nearby Rewards': 'Recompensas cercanas',
  '150 pts — Free coffee': '150 pts — Café gratis',
  '300 pts — 15% off': '300 pts — 15% de descuento',
  '500 pts — Free appetizer': '500 pts — Aperitivo gratis',
  'Three steps. Zero cost.': 'Tres pasos. Cero costo.',
  'Sign up in under a minute. No subscription, no card fees — RewardMe never costs you anything to use.': 'Regístrate en menos de un minuto. Sin suscripción ni cargos por tarjeta: usar RewardMe nunca te cuesta nada.',
  'Spend like normal': 'Compra como siempre',
  "Show your RewardMe code at checkout at any participating local business. That's the whole step.": 'Muestra tu código de RewardMe al pagar en cualquier negocio local participante. Eso es todo.',
  'Redeem rewards': 'Canjea recompensas',
  'Points stack up automatically. Redeem for free items, discounts, or perks at any business in the network.': 'Los puntos se acumulan automáticamente. Canjéalos por artículos gratis, descuentos o beneficios en cualquier negocio de la red.',
  'Why Members Stay': 'Por qué los miembros se quedan',
  'Built to feel like a win, every visit.': 'Diseñado para que cada visita se sienta como una victoria.',
  'Streak bonuses': 'Bonos por rachas',
  'Keep your visit streak alive and unlock bonus points the longer it runs.': 'Mantén tu racha de visitas y desbloquea puntos adicionales cuanto más dure.',
  'Real local rewards': 'Recompensas locales reales',
  'Free coffee, discounts, appetizers — rewards from the independent businesses you already visit.': 'Café gratis, descuentos, aperitivos: recompensas de los negocios independientes que ya visitas.',
  'Growing network': 'Una red en crecimiento',
  "New cafés, boutiques, and studios join every month, so there's always somewhere new to earn.": 'Cada mes se suman nuevos cafés, boutiques y estudios, así que siempre hay un lugar nuevo donde ganar recompensas.',
  'Free to join. Easy to love.': 'Gratis para unirse. Fácil de amar.',
  'Start earning rewards at the local spots you already visit.': 'Empieza a ganar recompensas en los lugares locales que ya visitas.',
  'Join RewardMe Free': 'Únete gratis a RewardMe',
  'Rewards for spending where you already love.': 'Recompensas por gastar en los lugares que ya te encantan.',
  '© RewardMe. Free for members, always.': '© RewardMe. Gratis para los miembros, siempre.',
}

export function translateRewardMeReference(text: string, language: string, fallback: (text: string) => string) {
  return language === 'es' && spanish[text] ? spanish[text] : fallback(text)
}
