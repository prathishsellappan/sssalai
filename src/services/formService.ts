import { supabase } from '@/lib/supabase';
import { FormLink, ContentStatus } from '@/types/database';

export const formService = {
  isValidGoogleFormsUrl(url: string): boolean {
    const pattern = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/i;
    return pattern.test(url.trim());
  },

  async getFormLinks(options?: {
    classId?: string;
    subjectId?: string;
    status?: ContentStatus;
    teacherId?: string;
  }): Promise<FormLink[]> {
    let query = supabase
      .from('form_links')
      .select('*, classes (id, name), subjects (id, name), profiles (display_name, email)')
      .order('created_at', { ascending: false });

    if (options?.classId) {
      query = query.eq('class_id', options.classId);
    }
    if (options?.subjectId) {
      query = query.eq('subject_id', options.subjectId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.teacherId) {
      query = query.eq('created_by', options.teacherId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as FormLink[];
  },

  async createFormLink(params: {
    title: string;
    description?: string;
    classId: string;
    subjectId: string;
    formUrl: string;
    status: ContentStatus;
    teacherId: string;
  }): Promise<FormLink> {
    const { title, description, classId, subjectId, formUrl, status, teacherId } = params;

    if (!this.isValidGoogleFormsUrl(formUrl)) {
      throw new Error('Invalid URL. Only Google Forms links (docs.google.com/forms or forms.gle) are allowed.');
    }

    const { data, error } = await supabase
      .from('form_links')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        class_id: classId,
        subject_id: subjectId,
        form_url: formUrl.trim(),
        created_by: teacherId,
        status,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FormLink;
  },

  async updateFormLink(id: string, updates: Partial<{ title: string; description: string; form_url: string; status: ContentStatus }>): Promise<FormLink> {
    if (updates.form_url && !this.isValidGoogleFormsUrl(updates.form_url)) {
      throw new Error('Invalid URL. Only Google Forms links (docs.google.com/forms or forms.gle) are allowed.');
    }

    const { data, error } = await supabase
      .from('form_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FormLink;
  },

  async deleteFormLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('form_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
