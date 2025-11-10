// api/rates.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

type Rate = { buy: number; sale: number };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let data: any[] = [];
    let source = '';

    // --- 1️⃣ Пробуем PrivatBank ---
    try {
      const r = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
      if (r.ok) {
        data = await r.json();
        source = 'PrivatBank';
      }
    } catch {}

    // --- 2️⃣ Если не удалось — пробуем Monobank ---
    if (!data.length) {
      try {
        const r2 = await fetch('https://api.monobank.ua/bank/currency');
        if (r2.ok) {
          const arr = await r2.json();
          const usd = arr.find((x: any) => x.currencyCodeA === 840 && x.currencyCodeB === 980);
          const eur = arr.find((x: any) => x.currencyCodeA === 978 && x.currencyCodeB === 980);
          if (usd && eur) {
            data = [
              { ccy: 'USD', buy: usd.rateBuy ?? usd.rateCross, sale: usd.rateSell ?? usd.rateCross },
              { ccy: 'EUR', buy: eur.rateBuy ?? eur.rateCross, sale: eur.rateSell ?? eur.rateCross },
            ];
            source = 'Monobank';
          }
        }
      } catch {}
    }

    // --- 3️⃣ Если и это не сработало — fallback на НБУ ---
    if (!data.length) {
      try {
        const r3 = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
        if (r3.ok) {
          const arr = await r3.json();
          const usd = arr.find((x: any) => x.cc === 'USD');
          const eur = arr.find((x: any) => x.cc === 'EUR');
          if (usd && eur) {
            data = [
              { ccy: 'USD', buy: usd.rate, sale: usd.rate },
              { ccy: 'EUR', buy: eur.rate, sale: eur.rate },
            ];
            source = 'NBU';
          }
        }
      } catch {}
    }

    // --- Формируем ответ ---
    if (!data.length) throw new Error('All sources failed');

    const rates: Record<string, Rate> = {};
    for (const el of data) {
      if (el.ccy === 'USD') rates.USD = { buy: +el.buy, sale: +el.sale };
      if (el.ccy === 'EUR') rates.EUR = { buy: +el.buy, sale: +el.sale };
    }

    res.status(200).json({
      source,
      fetchedAt: new Date().toISOString(),
      rates,
    });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to fetch rates', details: String(err) });
  }
}
