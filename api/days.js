export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Нужна дата' });
  
    const input = new Date(date + 'T00:00:00');
    if (isNaN(input)) return res.status(400).json({ error: 'Неверный формат даты' });
  
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const inputUTC = new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
    const diffMs = todayStart - inputUTC;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    res.status(200).json({ days });
  }
  