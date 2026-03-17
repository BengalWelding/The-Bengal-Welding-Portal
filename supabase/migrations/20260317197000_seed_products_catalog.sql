-- Seed the product catalog so the customer Equipment section isn't empty.
-- Idempotent: only inserts when the products table is empty.

insert into public.products (name, description, price, price_min, price_max, image, category)
select *
from (
  values
    (
      'Cooker',
      'Heavy duty commercial 6-burner range with high-output performance and stainless steel finish.',
      750::numeric,
      750::numeric,
      2400::numeric,
      '/products/cooker.png',
      'Cooking Equipment'
    ),
    (
      'Extraction Hood',
      'Bespoke stainless steel extraction canopy with baffle filters and integrated lighting.',
      300::numeric,
      300::numeric,
      1300::numeric,
      '/products/extraction-hood.png',
      'Ventilation'
    ),
    (
      'Grease Cleaning Service Plan',
      'Professional deep cleaning for commercial extraction systems to ensure fire safety compliance.',
      60::numeric,
      60::numeric,
      80::numeric,
      '/products/grease-cleaning-service-plan.png',
      'Services'
    ),
    (
      'Hot Cupboard',
      'Stainless steel heated cupboard with sliding doors, perfect for plate warming and food holding.',
      850::numeric,
      850::numeric,
      1300::numeric,
      '/products/hot-cupboard.png',
      'Food Holding'
    ),
    (
      'Stockpot',
      'Single burner high-power stockpot stove designed for heavy industrial use.',
      375::numeric,
      375::numeric,
      null::numeric,
      '/products/stockpot.png',
      'Cooking Equipment'
    ),
    (
      'Table and Gantry',
      'Custom prep table with integrated overhead gantry system and heating lamps.',
      400::numeric,
      400::numeric,
      1000::numeric,
      '/products/table-and-gantry.png',
      'Food Prep'
    ),
    (
      'Tandoori Oven',
      'Shaan series professional Tandoori oven with high-grade insulation and precision heat control.',
      1000::numeric,
      1000::numeric,
      1100::numeric,
      '/products/tandoori-oven.png',
      'Cooking Equipment'
    )
) as seed(name, description, price, price_min, price_max, image, category)
where not exists (select 1 from public.products);

