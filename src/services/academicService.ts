import React from 'react';
import { supabase } from '@/lib/supabase';
import { AcademicClass, Subject } from '@/types/database';

export const classService = {
  async getClasses(onlyActive = true): Promise<AcademicClass[]> {
    let query = supabase
      .from('classes')
      .select('*')
      .order('display_order', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AcademicClass[];
  },

  async createClass(name: string, displayOrder = 0): Promise<AcademicClass> {
    const { data, error } = await supabase
      .from('classes')
      .insert({ name: name.trim(), display_order: displayOrder, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data as AcademicClass;
  },

  async updateClass(id: string, updates: Partial<{ name: string; display_order: number; is_active: boolean }>) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AcademicClass;
  },

  async deactivateClass(id: string) {
    return this.updateClass(id, { is_active: false });
  },
};

export const subjectService = {
  async getSubjects(onlyActive = true): Promise<Subject[]> {
    let query = supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Subject[];
  },

  async getSubjectsForClass(classId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('class_subjects')
      .select('subjects (*)')
      .eq('class_id', classId);

    if (error) throw error;

    // Filter active subjects
    const subjects = (data || [])
      .map((item: any) => item.subjects)
      .filter((s: Subject) => s && s.is_active);

    return subjects as Subject[];
  },

  async createSubject(name: string): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name: name.trim(), is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data as Subject;
  },

  async updateSubject(id: string, updates: Partial<{ name: string; is_active: boolean }>) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Subject;
  },

  async mapSubjectToClass(classId: string, subjectId: string) {
    const { data, error } = await supabase
      .from('class_subjects')
      .insert({ class_id: classId, subject_id: subjectId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unmapSubjectFromClass(classId: string, subjectId: string) {
    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .match({ class_id: classId, subject_id: subjectId });

    if (error) throw error;
    return true;
  },

  async getClassSubjectMappings(): Promise<{ class_id: string; subject_id: string }[]> {
    const { data, error } = await supabase
      .from('class_subjects')
      .select('class_id, subject_id');

    if (error) throw error;
    return data || [];
  },
};
