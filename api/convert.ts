// api/convert.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

type Rate = { buy: number; sale: number };
type RatesResp = {
  source: string;
  fetchedAt: string;
  rates: {
    USD?: Rate;
    EUR?: Rate;
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const usd = parseFloat(String(req.query.usd ?? '0'));
  const eur = parseFloat(String(req.query.eur ?? '0'));
  const uah = parseFloat(String(req.query.uah ?? '0'));

  try {
    const resp = await fetch(`${BASE_URL}/api/rates`);
    if (!resp.ok) throw new Error('Rates fetch failed ' + resp.status);
    const data: RatesResp = await resp.json();

    const rates = data.rates;
    const usdBuy = rates.USD?.buy ?? NaN;
    const eurSale = rates.EUR?.sale ?? NaN;

    let eur_from_usd = 0;
    let eur_from_uah = 0;

    if (Number.isFinite(usdBuy) && Number.isFinite(eurSale)) {
      const uah_from_usd = usd * usdBuy;
      eur_from_usd = uah_from_usd / eurSale;
      eur_from_uah = uah / eurSale;
    }

    const total = eur + eur_from_usd + eur_from_uah;

    res.status(200).json({
      source: data.source,
      fetchedAt: data.fetchedAt,
      usedRates: {
        USD_buy: usdBuy,
        EUR_sale: eurSale,
      },
      input: { usd, eur, uah },
      result: {
        eur_total: total,
        breakdown: {
          eur_self: eur,
          eur_from_usd,
          eur_from_uah,
        },
      },
    });
  } catch (err) {
    res.status(502).json({ error: 'Conversion failed', details: String(err) });
  }
}
