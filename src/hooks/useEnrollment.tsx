import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EnrollmentData {
  postal_address: string;
  phone: string;
  date_of_birth: string;
  accepted_legal_bases: boolean;
}

export const useEnrollment = () => {
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkEnrollment = async () => {
    if (!user) {
      setIsEnrolled(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reto_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIsEnrolled(true);
      } else {
        setIsEnrolled(false);
      }
    } catch {
      setIsEnrolled(false);
    } finally {
      setLoading(false);
    }
  };

  const enroll = async (data: EnrollmentData) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('reto_enrollments')
        .insert({
          user_id: user.id,
          postal_address: data.postal_address,
          phone: data.phone,
          date_of_birth: data.date_of_birth,
          accepted_legal_bases: data.accepted_legal_bases,
        });

      if (error) throw error;
      setIsEnrolled(true);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  useEffect(() => {
    checkEnrollment();
  }, [user]);

  return { isEnrolled, loading, enroll, refetch: checkEnrollment };
};
