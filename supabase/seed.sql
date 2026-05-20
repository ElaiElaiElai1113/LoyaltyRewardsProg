-- ============================================================
-- Seed Data - Matches current mock store
-- Run with: supabase db reset (includes seed) or manually
-- ============================================================

-- ─── Businesses ──────────────────────────────────────────────

insert into public.businesses (id, name, slug, description, earn_rate, tax_rate, currency, active) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Velvet Brew', 'velvet-brew', 'A neighborhood beverage shop known for handcrafted drinks, seasonal pastries, and retail favorites.', 10, 0.0875, 'USD', true),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Coffee', 'mystic-coffee', 'A mystical coffee experience with ethically sourced beans, herbal infusions, and enchanted blends.', 8, 0.0925, 'USD', true);

-- ─── Demo Users (create via Supabase Auth, then profiles are auto-created) ──
-- After running seed, create these users in Supabase Auth:
--
-- 1. Customer Demo
--    Email: ava@example.com  Password: demo1234
--    app_metadata: { "role": "customer" }
--
-- 2. Platform Admin
--    Email: admin@medellinrewards.com  Password: demo1234
--    app_metadata: { "role": "platform-admin" }
--
-- 3. Velvet Brew Owner
--    Email: owner@velvetbrew.co  Password: demo1234
--    app_metadata: { "role": "business-owner", "business_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
--
-- 4. Mystic Coffee Owner
--    Email: owner@mysticcoffee.co  Password: demo1234
--    app_metadata: { "role": "business-owner", "business_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" }

-- ─── Rewards ─────────────────────────────────────────────────

-- E2E Auth Users
-- Password for all E2E users: demo1234

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'customer@medellin.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb, '{"full_name":"E2E Verified Customer","verification_id_number":"E2E-CUSTOMER-001","verification_document_path":"pending/11111111-1111-1111-1111-111111111111.png","verification_document_filename":"verified-customer.png"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'unverified@medellin.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb, '{"full_name":"E2E Unverified Customer","verification_id_number":"E2E-CUSTOMER-002","verification_document_path":"pending/22222222-2222-2222-2222-222222222222.png","verification_document_filename":"unverified-customer.png"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'staff@velvetbrew.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"business-staff","business_id":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}'::jsonb, '{"full_name":"E2E Velvet Staff"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'owner@velvetbrew.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"business-owner","business_id":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}'::jsonb, '{"full_name":"E2E Velvet Owner"}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'admin@medellin.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"platform-admin"}'::jsonb, '{"full_name":"E2E Platform Admin"}'::jsonb, now(), now(), '', '', '', '');

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'customer@medellin.test', '{"sub":"11111111-1111-1111-1111-111111111111","email":"customer@medellin.test"}'::jsonb, 'email', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'unverified@medellin.test', '{"sub":"22222222-2222-2222-2222-222222222222","email":"unverified@medellin.test"}'::jsonb, 'email', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'staff@velvetbrew.test', '{"sub":"33333333-3333-3333-3333-333333333333","email":"staff@velvetbrew.test"}'::jsonb, 'email', now(), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'owner@velvetbrew.test', '{"sub":"44444444-4444-4444-4444-444444444444","email":"owner@velvetbrew.test"}'::jsonb, 'email', now(), now(), now()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'admin@medellin.test', '{"sub":"55555555-5555-5555-5555-555555555555","email":"admin@medellin.test"}'::jsonb, 'email', now(), now(), now());

update public.profiles
set verification_status = 'verified'
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles
set verification_status = 'submitted'
where id = '22222222-2222-2222-2222-222222222222';

insert into public.rewards (business_id, title, description, category, points_cost, inventory, featured, highlight) values
  -- Velvet Brew
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Signature Velvet Latte', 'Redeem any handcrafted latte with your choice of milk and syrup.', 'Drink', 250, 99, true, 'Most redeemed this week'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cold Brew Flight', 'Sample three seasonal cold brew profiles in one curated tasting.', 'Experience', 480, 24, true, 'Weekend-only tasting'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Butter Croissant Pairing', 'Fresh-baked croissant paired with any small brewed coffee.', 'Pastry', 180, 44, false, 'Morning favorite'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Velvet Brew Tote', 'Canvas tote with embossed logo and internal bottle sleeve.', 'Merch', 700, 12, false, 'Limited spring merch'),
  -- Mystic Coffee
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Matcha Latte', 'Ceremonial-grade matcha whisked with your choice of milk.', 'Drink', 200, 60, true, 'Fan favorite'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Almond Croissant', 'Flaky croissant filled with almond cream and topped with sliced almonds.', 'Pastry', 160, 30, false, 'Fresh daily'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Afternoon Tea Set', 'Pot of premium herbal tea served with a selection of three mini pastries.', 'Experience', 400, 15, true, 'Weekend special');

-- ─── Products ────────────────────────────────────────────────

insert into public.products (business_id, title, description, category, price, inventory, featured, highlight) values
  -- Velvet Brew
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Oat Milk Latte', 'Our signature oat milk latte with house-made vanilla syrup.', 'Coffee', 5.50, 200, true, 'Best seller'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cold Brew Concentrate 32oz', 'Take home our 24-hour cold brew concentrate. Dilute to taste.', 'Coffee', 14.00, 50, true, 'Take-home'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pistachio Cardamom Bun', 'Flaky laminated pastry with pistachio frangipane and cardamom glaze.', 'Pastry', 4.75, 30, false, 'Seasonal'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Single Origin: Ethiopia Yirgacheffe', '12oz bag of light-roasted whole beans with floral and citrus notes.', 'Coffee', 18.00, 40, false, 'Direct trade'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Velvet Brew Ceramic Tumbler', '16oz double-walled ceramic tumbler in matte black with silicone lid.', 'Merch', 28.00, 25, true, 'New arrival'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pour-Over Starter Kit', 'Ceramic dripper, 100 filters, and a 12oz sample roast.', 'Equipment', 42.00, 15, false, 'Brew at home'),
  -- Mystic Coffee
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Chai Spice Latte', 'House-blended chai with cinnamon, cardamom, ginger, and steamed milk.', 'Coffee', 5.00, 150, true, 'House blend'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Breakfast Sandwich', 'Scrambled eggs, gruyere, arugula, and truffle aioli on brioche.', 'Pastry', 9.50, 40, true, 'Morning staple'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lavender Honey Scone', 'Buttery scone with dried lavender and a honey glaze drizzle.', 'Pastry', 4.25, 35, false, 'Popular'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Premium Tea Sampler', 'Set of 4 loose-leaf herbal teas: Chamomile, Peppermint, Hibiscus, and Lavender.', 'Coffee', 22.00, 20, false, 'Gift idea'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Coffee Mug', 'Handmade ceramic mug with a mystical mountain motif. 12oz capacity.', 'Merch', 24.00, 18, true, 'Limited edition');

-- ─── Promotions ──────────────────────────────────────────────

insert into public.promotions (business_id, title, description, badge, cta, expires_at, audience) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Double points after 3 PM', 'Stop by after 3 PM and earn twice the points on any handcrafted drink.', 'Weekday perk', 'Drop by after work', '2026-04-24T23:59:59.000Z', 'All members'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Spring pairing menu', 'Unlock a bonus 120 points when you pair a pistachio bun with any iced espresso.', 'Seasonal', 'Try the pairing', '2026-04-17T23:59:59.000Z', 'All members'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bring-a-friend Saturdays', 'Invite a friend to scan your code in-store and both of you receive a surprise bonus.', 'Referral', 'Share your code', '2026-05-01T23:59:59.000Z', 'All members'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Tea Tuesday Bonus', 'Order any tea on Tuesdays and earn triple points all day.', 'Weekly', 'View teas', '2026-05-15T23:59:59.000Z', 'All members'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Brunch Bundle', 'Get a free pastry when you order any breakfast sandwich before 11 AM.', 'Weekend', 'See menu', '2026-04-30T23:59:59.000Z', 'All members');
