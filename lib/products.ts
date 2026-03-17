import { supabase } from './supabase';
import type { Product } from '../types';
import { MOCK_PRODUCTS } from '../mockData';

const PRODUCT_IMAGES_BUCKET = 'product-images';

function resolveProductImageUrl(image: string): string {
  const trimmed = (image || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  // For legacy/mock products we expect static public assets.
  if (/\.(png|jpe?g|webp|gif)$/i.test(trimmed)) return `/products/${trimmed}`;
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(trimmed);
  return data?.publicUrl || trimmed;
}

function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    price: Number(r.price) || 0,
    price_min: r.price_min == null ? undefined : Number(r.price_min),
    price_max: r.price_max == null ? undefined : Number(r.price_max),
    image: resolveProductImageUrl(String(r.image ?? '')),
    category: String(r.category ?? ''),
  };
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to load products');
  const rows = (data ?? []).map((r) => rowToProduct(r as Record<string, unknown>));
  if (rows.length === 0) {
    // Safe fallback so the catalog isn't empty if Supabase has no seed data yet.
    return MOCK_PRODUCTS.map((p) => ({ ...p, image: resolveProductImageUrl(p.image) }));
  }
  return rows;
}

export async function createProduct(input: Omit<Product, 'id'>): Promise<Product> {
  const payload = {
    name: input.name,
    description: input.description,
    price: input.price,
    price_min: input.price_min ?? null,
    price_max: input.price_max ?? null,
    image: input.image,
    category: input.category,
  };
  const { data, error } = await supabase.from('products').insert(payload).select('*').single();
  if (error) throw new Error(error.message || 'Failed to create product');
  return rowToProduct(data as Record<string, unknown>);
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, 'id'>>
): Promise<Product> {
  const payload: Record<string, unknown> = {};
  if ('name' in patch) payload.name = patch.name;
  if ('description' in patch) payload.description = patch.description;
  if ('price' in patch) payload.price = patch.price;
  if ('price_min' in patch) payload.price_min = patch.price_min ?? null;
  if ('price_max' in patch) payload.price_max = patch.price_max ?? null;
  if ('image' in patch) payload.image = patch.image;
  if ('category' in patch) payload.category = patch.category;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message || 'Failed to update product');
  return rowToProduct(data as Record<string, unknown>);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete product');
}

