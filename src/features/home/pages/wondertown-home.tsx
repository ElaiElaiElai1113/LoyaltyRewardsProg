import {
  ArrowRight,
  BookOpen,
  Building2,
  CakeSlice,
  Coffee,
  Gift,
  Hotel,
  Scissors,
  Sparkles,
  Store,
} from 'lucide-react'
import { Link } from 'react-router'

import wondertownHero from '@/assets/wondertown/wondertown-hero.webp'
import wondertownHeroSmall from '@/assets/wondertown/wondertown-hero-768.webp'
import { useTenant } from '@/hooks/use-tenant'

import './wondertown-home.css'

const businesses = [
  {
    name: 'Moonbeam Café',
    type: 'Coffee & pastries',
    description: 'Cozy cups, cloud-soft pastries, and a little starlight with every visit.',
    icon: Coffee,
    className: 'wondertown-home__business-card--moonbeam',
  },
  {
    name: 'Dragonfly Books',
    type: 'Books & curiosities',
    description: 'Stories, stationery, and unexpected treasures for wonderfully curious people.',
    icon: BookOpen,
    className: 'wondertown-home__business-card--dragonfly',
  },
  {
    name: 'Stardust Salon',
    type: 'Hair & self-care',
    description: 'Fresh looks, bright moods, and feel-good rewards from the neighborhood stylists.',
    icon: Scissors,
    className: 'wondertown-home__business-card--stardust',
  },
  {
    name: 'Lantern Hotel',
    type: 'Stays & experiences',
    description: 'A storybook stay in the heart of town, complete with warm welcomes and local charm.',
    icon: Hotel,
    className: 'wondertown-home__business-card--lantern',
  },
  {
    name: 'Cloud Nine Bakery',
    type: 'Bread & sweets',
    description: 'Dreamy bakes made every morning for celebrations, picnics, and ordinary Tuesdays.',
    icon: CakeSlice,
    className: 'wondertown-home__business-card--cloud',
  },
]

const steps = [
  {
    number: '01',
    title: 'Meet the neighborhood',
    body: 'Create your member account and discover the fictional businesses around Wondertown.',
    icon: Store,
  },
  {
    number: '02',
    title: 'Collect a little magic',
    body: 'A business records your visit and your rewards appear in the same real platform flow.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Treat yourself',
    body: 'Spend rewards on products, gift cards, and playful offers from participating businesses.',
    icon: Gift,
  },
]

export function WondertownHomePage() {
  const { program } = useTenant()

  return (
    <main className="wondertown-home" id="top">
      <header className="wondertown-home__header">
        <div className="wondertown-home__container wondertown-home__header-inner">
          <a className="wondertown-home__brand" href="#top" aria-label={`${program.name} home`}>
            <img src="/wondertown-rewards-logo.svg" alt="" aria-hidden="true" />
            <span>
              <strong>Wondertown</strong>
              <small>Rewards</small>
            </span>
          </a>

          <nav className="wondertown-home__nav" aria-label="Primary navigation">
            <a href="#businesses">Explore the city</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/business">For businesses</Link>
          </nav>

          <div className="wondertown-home__header-actions">
            <Link className="wondertown-home__text-link" to="/signin">Member sign in</Link>
            <Link className="wondertown-home__button wondertown-home__button--small" to="/join">
              Enter Wondertown
            </Link>
          </div>
        </div>
      </header>

      <section className="wondertown-home__hero" aria-labelledby="wondertown-hero-title">
        <img
          className="wondertown-home__hero-art"
          src={wondertownHero}
          srcSet={`${wondertownHeroSmall} 768w, ${wondertownHero} 1440w`}
          sizes="100vw"
          alt="A colorful illustrated town square filled with friendly local businesses"
          fetchPriority="high"
        />
        <div className="wondertown-home__hero-shade" />
        <div className="wondertown-home__container wondertown-home__hero-content">
          <div className="wondertown-home__demo-label">
            <Sparkles size={16} aria-hidden="true" />
            A fictional city built for testing
          </div>
          <h1 id="wondertown-hero-title">
            Every little thing<br />
            feels <em>rewarding.</em>
          </h1>
          <p>
            Shop around Wondertown, collect Sparks, and turn everyday visits into delightful treats.
            The city is imaginary. The rewards experience is completely testable.
          </p>
          <div className="wondertown-home__hero-actions">
            <Link className="wondertown-home__button" to="/signin">
              Test as a member <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="wondertown-home__button wondertown-home__button--glass" to="/business/login">
              Test as a business
            </Link>
          </div>
          <ul className="wondertown-home__hero-notes" aria-label="Demo highlights">
            <li>Working logins</li>
            <li>Real points flows</li>
            <li>Safe demo data</li>
          </ul>
        </div>
      </section>

      <section className="wondertown-home__intro" aria-labelledby="wondertown-intro-title">
        <div className="wondertown-home__container wondertown-home__intro-grid">
          <div>
            <p className="wondertown-home__eyebrow">WELCOME, NEIGHBOR</p>
            <h2 id="wondertown-intro-title">One tiny city.<br />A whole rewards platform.</h2>
          </div>
          <div className="wondertown-home__intro-copy">
            <p>
              Wondertown is a friendly sandbox for trying every part of the platform—from joining as a
              member to serving customers behind a business counter.
            </p>
            <Link to="/guide">Take the platform tour <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="wondertown-home__businesses" id="businesses" aria-labelledby="wondertown-businesses-title">
        <div className="wondertown-home__container">
          <div className="wondertown-home__section-heading">
            <div>
              <p className="wondertown-home__eyebrow">AROUND TOWN</p>
              <h2 id="wondertown-businesses-title">Meet the locals</h2>
            </div>
            <p>Five whimsical businesses make the marketplace feel lived in while keeping every record clearly fictional.</p>
          </div>

          <div className="wondertown-home__business-grid">
            {businesses.map((business) => {
              const Icon = business.icon
              return (
                <article className={`wondertown-home__business-card ${business.className}`} key={business.name}>
                  <div className="wondertown-home__business-icon"><Icon size={30} aria-hidden="true" /></div>
                  <p>{business.type}</p>
                  <h3>{business.name}</h3>
                  <span>{business.description}</span>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="wondertown-home__steps" id="how-it-works" aria-labelledby="wondertown-steps-title">
        <div className="wondertown-home__container">
          <p className="wondertown-home__eyebrow">HOW THE MAGIC WORKS</p>
          <div className="wondertown-home__steps-heading">
            <h2 id="wondertown-steps-title">Three stops. Full-circle testing.</h2>
            <p>Use the permanent demo accounts to walk through the exact same member and business processes as every live tenant.</p>
          </div>
          <div className="wondertown-home__steps-grid">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <article key={step.number}>
                  <div className="wondertown-home__step-top">
                    <span>{step.number}</span>
                    <Icon size={25} aria-hidden="true" />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="wondertown-home__cta" aria-labelledby="wondertown-cta-title">
        <div className="wondertown-home__container wondertown-home__cta-card">
          <div className="wondertown-home__cta-orbit" aria-hidden="true" />
          <div>
            <p className="wondertown-home__eyebrow">YOUR TEST DRIVE STARTS HERE</p>
            <h2 id="wondertown-cta-title">Ready to try the whole town?</h2>
            <p>Sign in with a demo role, award a few Sparks, redeem an offer, and decide what the real programs should become.</p>
          </div>
          <div className="wondertown-home__cta-actions">
            <Link className="wondertown-home__button" to="/signin">Member portal</Link>
            <Link className="wondertown-home__button wondertown-home__button--outline" to="/business/login">Business portal</Link>
          </div>
        </div>
      </section>

      <footer className="wondertown-home__footer">
        <div className="wondertown-home__container wondertown-home__footer-inner">
          <a className="wondertown-home__brand" href="#top" aria-label="Back to the top">
            <img src="/wondertown-rewards-logo.svg" alt="" aria-hidden="true" />
            <span><strong>Wondertown</strong><small>Rewards</small></span>
          </a>
          <p><Building2 size={16} aria-hidden="true" /> A fictional city powered by real Rewards Platform workflows.</p>
          <nav aria-label="Footer navigation">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/business">Businesses</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
