import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function calculateNextOccurrence(date, type) {
  const d = new Date(date);
  if (type === 'daily') d.setDate(d.getDate() + 1);
  if (type === 'weekly') d.setDate(d.getDate() + 7);
  if (type === 'monthly') d.setMonth(d.getMonth() + 1);
  if (type === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: recurringExpenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('is_recurring', true)
    .lte('next_occurrence', today);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  for (const exp of recurringExpenses) {
    if (!exp.next_occurrence || new Date(exp.next_occurrence) > new Date(today)) continue;

    let nextDate = exp.next_occurrence;
    while (new Date(nextDate) <= new Date(today)) {
      await supabase.from('expenses').insert([{
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        subcategory: exp.subcategory,
        description: exp.description,
        created_at: nextDate,
        user_id: exp.user_id,
        is_recurring: exp.is_recurring,
        recurring_type: exp.recurring_type,
        next_occurrence: null
      }]);
      nextDate = calculateNextOccurrence(nextDate, exp.recurring_type);
    }
    
    await supabase
      .from('expenses')
      .update({ next_occurrence: nextDate })
      .eq('id', exp.id);
  }

  res.status(200).json({ message: 'Recurring expenses processed.' });
}
