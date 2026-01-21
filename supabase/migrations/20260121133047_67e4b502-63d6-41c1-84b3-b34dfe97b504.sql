
-- Create function to handle weekly challenge approval
CREATE OR REPLACE FUNCTION public.award_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge challenges%ROWTYPE;
  v_energy_earned integer;
  v_existing_completion uuid;
BEGIN
  -- Only trigger on status change to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get challenge info
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = NEW.challenge_id;
    
    -- Only process weekly challenges
    IF v_challenge.challenge_type = 'weekly' THEN
      
      -- Check if completion already exists
      SELECT id INTO v_existing_completion
      FROM challenge_completions
      WHERE user_id = NEW.user_id AND challenge_id = NEW.challenge_id;
      
      -- If no existing completion, create one
      IF v_existing_completion IS NULL THEN
        -- Calculate points: 100 on-time, 50 late
        IF NEW.created_at::date <= v_challenge.ends_at THEN
          v_energy_earned := 100;
        ELSE
          v_energy_earned := 50;
        END IF;
        
        -- Insert challenge completion
        INSERT INTO challenge_completions (user_id, challenge_id, energy_earned, completed_at)
        VALUES (NEW.user_id, NEW.challenge_id, v_energy_earned, now());
        
        -- Update user's total energy
        UPDATE profiles
        SET total_energy = total_energy + v_energy_earned,
            updated_at = now()
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on challenge_submissions
DROP TRIGGER IF EXISTS on_challenge_submission_approved ON challenge_submissions;
CREATE TRIGGER on_challenge_submission_approved
  AFTER INSERT OR UPDATE OF status ON challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION award_challenge_completion();

-- Also create function to revoke points if submission is unapproved
CREATE OR REPLACE FUNCTION public.revoke_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion challenge_completions%ROWTYPE;
BEGIN
  -- Only trigger when status changes FROM 'approved' to something else
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    
    -- Find and delete the completion record
    SELECT * INTO v_completion
    FROM challenge_completions
    WHERE user_id = OLD.user_id AND challenge_id = OLD.challenge_id;
    
    IF FOUND THEN
      -- Subtract energy from user
      UPDATE profiles
      SET total_energy = total_energy - v_completion.energy_earned,
          updated_at = now()
      WHERE user_id = OLD.user_id;
      
      -- Delete the completion record
      DELETE FROM challenge_completions
      WHERE id = v_completion.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for unapproval
DROP TRIGGER IF EXISTS on_challenge_submission_unapproved ON challenge_submissions;
CREATE TRIGGER on_challenge_submission_unapproved
  AFTER UPDATE OF status ON challenge_submissions
  FOR EACH ROW
  WHEN (OLD.status = 'approved' AND NEW.status != 'approved')
  EXECUTE FUNCTION revoke_challenge_completion();
