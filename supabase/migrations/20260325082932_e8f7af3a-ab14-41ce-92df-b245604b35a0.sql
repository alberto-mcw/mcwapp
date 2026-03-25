CREATE OR REPLACE VIEW public.daily_trivias_public
WITH (security_invoker = true)
AS
SELECT id,
    scheduled_date,
    trivia_type,
    title,
    question,
    options,
    explanation,
    fun_fact,
    difficulty,
    energy_reward,
    status,
    created_at
FROM daily_trivias
WHERE scheduled_date <= CURRENT_DATE;