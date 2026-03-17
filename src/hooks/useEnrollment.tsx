import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EnrollmentData {
  street: string;
  street_number: string;
  address_city: string;
  postal_code: string;
  phone_prefix: string;
  phone: string;
  date_of_birth: string;
  accepted_legal_bases: boolean;
}

export interface EnrollmentRecord {
  id: string;
  street: string | null;
  street_number: string | null;
  address_city: string | null;
  postal_code: string | null;
  phone_prefix: string | null;
  phone: string;
  date_of_birth: string;
  accepted_legal_bases: boolean;
  postal_address: string | null;
}

export const useEnrollment = () => {
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const checkEnrollment = async () => {
    if (!user) {
      setIsEnrolled(false);
      setEnrollment(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reto_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIsEnrolled(true);
        setEnrollment(data as unknown as EnrollmentRecord);
      } else {
        setIsEnrolled(false);
        setEnrollment(null);
      }
    } catch {
      setIsEnrolled(false);
      setEnrollment(null);
    } finally {
      setLoading(false);
    }
  };

  const enroll = async (data: EnrollmentData) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const fullAddress = `${data.street} ${data.street_number}, ${data.postal_code} ${data.address_city}`;
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('reto_enrollments')
        .insert({
          user_id: user.id,
          street: data.street,
          street_number: data.street_number,
          address_city: data.address_city,
          postal_code: data.postal_code,
          phone_prefix: data.phone_prefix,
          phone: data.phone,
          date_of_birth: data.date_of_birth,
          accepted_legal_bases: data.accepted_legal_bases,
          postal_address: fullAddress,
          accepted_bases_at: now,
        } as any);

      if (error) throw error;
      setIsEnrolled(true);
      await checkEnrollment();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateEnrollment = async (data: Partial<EnrollmentData>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const updateData: any = { ...data };
      if (data.street && data.street_number && data.postal_code && data.address_city) {
        updateData.postal_address = `${data.street} ${data.street_number}, ${data.postal_code} ${data.address_city}`;
      }
      const { error } = await supabase
        .from('reto_enrollments')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
      await checkEnrollment();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  useEffect(() => {
    checkEnrollment();
  }, [user]);

  return { isEnrolled, enrollment, loading, enroll, updateEnrollment, refetch: checkEnrollment };
};
