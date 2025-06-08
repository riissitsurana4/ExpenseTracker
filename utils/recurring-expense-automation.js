import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function calculateNextOccurrence(date, type) {
  const d = new Date(date);
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
    // Only create a new expense if next_occurrence is today or earlier
    if (!exp.next_occurrence || new Date(exp.next_occurrence) > new Date(today)) continue;

    await supabase.from('expenses').insert([{
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      subcategory: exp.subcategory,
      description: exp.description,
      created_at: exp.next_occurrence,
      user_id: exp.user_id,
      is_recurring: exp.is_recurring,
      recurring_type: exp.recurring_type,
      next_occurrence: null
    }]);

    // Update the original expense's next_occurrence
    const newNext = calculateNextOccurrence(exp.next_occurrence, exp.recurring_type);
    await supabase
      .from('expenses')
      .update({ next_occurrence: newNext })
      .eq('id', exp.id);
  }

  res.status(200).json({ message: 'Recurring expenses processed.' });
}
