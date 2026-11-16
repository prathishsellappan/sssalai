import { supabase, isDemoMode } from '@/lib/supabase';
import { Material, ContentStatus } from '@/types/database';

export const materialService = {
  async getMaterials(options?: {
    classId?: string;
    subjectId?: string;
    status?: ContentStatus;
    teacherId?: string;
    search?: string;
  }): Promise<Material[]> {
    let query = supabase
      .from('materials')
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
    if (options?.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Material[];
  },

  async getMaterialById(id: string): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .select('*, classes (id, name), subjects (id, name), profiles (display_name, email)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Material;
  },

  async uploadMaterial(params: {
    title: string;
    description?: string;
    classId: string;
    subjectId: string;
    file: File;
    status: ContentStatus;
    teacherId: string;
  }): Promise<Material> {
    const { title, description, classId, subjectId, file, status, teacherId } = params;

    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File exceeds maximum allowed size of 20 MB');
    }

    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF, DOCX, and PPTX files are allowed.');
    }

    const materialId = crypto.randomUUID();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${teacherId}/${materialId}/${sanitizedFileName}`;

    const { error: storageError } = await supabase.storage
      .from('study-materials')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    try {
      const { data, error: dbError } = await supabase
        .from('materials')
        .insert({
          id: materialId,
          title: title.trim(),
          description: description?.trim() || null,
          class_id: classId,
          subject_id: subjectId,
          file_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          created_by: teacherId,
          status,
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from('study-materials').remove([storagePath]);
        throw dbError;
      }

      return data as Material;
    } catch (err) {
      await supabase.storage.from('study-materials').remove([storagePath]).catch(() => {});
      throw err;
    }
  },

  async updateMaterial(id: string, updates: Partial<{ title: string; description: string; status: ContentStatus }>): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Material;
  },

  async deleteMaterial(materialId: string): Promise<void> {
    if (isDemoMode) {
      await supabase.from('materials').delete().eq('id', materialId);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ materialId }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete material');
    }
  },

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('study-materials')
      .createSignedUrl(filePath, 600);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Could not generate signed download URL');

    return data.signedUrl;
  },
};
