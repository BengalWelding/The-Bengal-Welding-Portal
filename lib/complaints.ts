/**
 * Complaints API – create and list customer complaints.
 */

import { supabase } from './supabase';

export type ComplaintAttachment = {
  path: string;
  publicUrl: string;
  mime: string;
  name: string;
  size: number;
};

export interface ComplaintRow {
  id: string;
  user_id: string;
  customer_name: string;
  site_name: string | null;
  site_address: string | null;
  contact_email: string;
  contact_phone: string | null;
  subject: string | null;
  complaint_type: string | null;
  description: string;
  date_of_incident: string | null;
  preferred_contact: string | null;
  status: string;
  admin_notes: string | null;
  attachments?: ComplaintAttachment[];
  created_at: string;
  updated_at: string;
}

const COMPLAINT_MEDIA_BUCKET = 'complaint-media';

function safeExtFromMime(mime: string) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  return map[mime] || '';
}

async function uploadComplaintAttachment(file: File, userId: string): Promise<ComplaintAttachment> {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ext = safeExtFromMime(file.type) || (file.name.includes('.') ? file.name.split('.').pop() || '' : '');
  const baseName = ext ? `${id}.${ext}` : id;
  const path = `${userId}/${baseName}`;

  const { error: uploadError } = await supabase.storage
    .from(COMPLAINT_MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    const anyErr = uploadError as any;
    const message = String(anyErr?.message || uploadError.message || '');
    const statusCode = anyErr?.statusCode;
    if (statusCode === 404 || /bucket not found/i.test(message)) {
      throw new Error(
        `Complaint upload storage is not set up yet (bucket "${COMPLAINT_MEDIA_BUCKET}" not found). ` +
          `Apply the Supabase migration "20260317196000_complaints_media.sql" (or create the bucket in Supabase Storage) and try again.`
      );
    }
    throw new Error(uploadError.message || 'Failed to upload attachment');
  }

  const { data } = supabase.storage.from(COMPLAINT_MEDIA_BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl || '';
  if (!publicUrl) throw new Error('Failed to generate attachment URL');

  return {
    path,
    publicUrl,
    mime: file.type || 'application/octet-stream',
    name: file.name || baseName,
    size: file.size || 0,
  };
}

export async function createComplaint(data: {
  customerName: string;
  siteName?: string;
  siteAddress?: string;
  contactEmail: string;
  contactPhone?: string;
  subject?: string;
  complaintType?: string;
  description: string;
  dateOfIncident?: string;
  preferredContact?: string;
  attachment?: File | null;
}): Promise<ComplaintRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let attachments: ComplaintAttachment[] = [];
  if (data.attachment) {
    const file = data.attachment;
    if (!file.type?.startsWith('image/') && !file.type?.startsWith('video/')) {
      throw new Error('Attachment must be an image or video file.');
    }
    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxBytes) throw new Error('Attachment is too large (max 25MB).');
    attachments = [await uploadComplaintAttachment(file, user.id)];
  }

  const row = {
    user_id: user.id,
    customer_name: data.customerName,
    site_name: data.siteName || null,
    site_address: data.siteAddress || null,
    contact_email: data.contactEmail,
    contact_phone: data.contactPhone || null,
    subject: data.subject || null,
    complaint_type: data.complaintType || null,
    description: data.description,
    date_of_incident: data.dateOfIncident || null,
    preferred_contact: data.preferredContact || null,
    status: 'open',
    attachments,
  };

  const { data: inserted, error } = await supabase
    .from('complaints')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to submit complaint');
  return inserted as ComplaintRow;
}

export async function listComplaintsForCustomer(userId: string): Promise<ComplaintRow[]> {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch complaints');
  return (data || []) as ComplaintRow[];
}

export async function listAllComplaints(): Promise<ComplaintRow[]> {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch complaints');
  return (data || []) as ComplaintRow[];
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  adminNotes?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (adminNotes != null) updates.admin_notes = adminNotes;

  const { error } = await supabase
    .from('complaints')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update complaint');
}
