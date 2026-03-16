import { supabase } from './supabase';

export interface CustomerProduct {
  id: string;
  customer_id: string;
  catalog_product_code: string | null;
  label: string;
  purchase_date: string;
  warranty_start: string;
  warranty_end: string;
  serial_number: string | null;
  installation_site_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function listCustomerProductsForCustomer(customerId: string): Promise<CustomerProduct[]> {
  const { data, error } = await supabase
    .from('customer_products')
    .select('*')
    .eq('customer_id', customerId)
    .order('purchase_date', { ascending: false });

  if (error) throw error;
  return data as CustomerProduct[];
}

export async function listCustomerProductsForAdmin(customerId?: string): Promise<CustomerProduct[]> {
  let query = supabase.from('customer_products').select('*');
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  const { data, error } = await query.order('purchase_date', { ascending: false });
  if (error) throw error;
  return data as CustomerProduct[];
}

export async function createCustomerProduct(input: {
  customerId: string;
  catalogProductCode?: string | null;
  label: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  serialNumber?: string | null;
  installationSiteId?: string | null;
  notes?: string | null;
}): Promise<CustomerProduct> {
  const payload = {
    customer_id: input.customerId,
    catalog_product_code: input.catalogProductCode ?? null,
    label: input.label,
    purchase_date: input.purchaseDate,
    warranty_start: input.warrantyStart,
    warranty_end: input.warrantyEnd,
    serial_number: input.serialNumber ?? null,
    installation_site_id: input.installationSiteId ?? null,
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from('customer_products')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as CustomerProduct;
}

export async function updateCustomerProduct(
  id: string,
  patch: Partial<{
    catalogProductCode: string | null;
    label: string;
    purchaseDate: string;
    warrantyStart: string;
    warrantyEnd: string;
    serialNumber: string | null;
    installationSiteId: string | null;
    notes: string | null;
  }>
): Promise<CustomerProduct> {
  const payload: Record<string, unknown> = {};
  if ('catalogProductCode' in patch) payload.catalog_product_code = patch.catalogProductCode ?? null;
  if ('label' in patch) payload.label = patch.label;
  if ('purchaseDate' in patch) payload.purchase_date = patch.purchaseDate;
  if ('warrantyStart' in patch) payload.warranty_start = patch.warrantyStart;
  if ('warrantyEnd' in patch) payload.warranty_end = patch.warrantyEnd;
  if ('serialNumber' in patch) payload.serial_number = patch.serialNumber ?? null;
  if ('installationSiteId' in patch) payload.installation_site_id = patch.installationSiteId ?? null;
  if ('notes' in patch) payload.notes = patch.notes ?? null;

  const { data, error } = await supabase
    .from('customer_products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as CustomerProduct;
}

export async function deleteCustomerProduct(id: string): Promise<void> {
  const { error } = await supabase.from('customer_products').delete().eq('id', id);
  if (error) throw error;
}

