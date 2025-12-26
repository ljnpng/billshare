const EXCHANGE_API_KEY = 'cfb509526c7db8ec6499e020';
const EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const FALLBACK_RATE = 7.2; // Fallback USD to CNY rate

interface ExchangeRateResponse {
  result: string;
  conversion_rates: {
    CNY: number;
  };
  time_last_update_unix: number;
  base_code: string;
}

export async function getUsdToCnyRate(): Promise<number> {
  try {
    const response = await fetch(EXCHANGE_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ExchangeRateResponse = await response.json();
    
    if (data.result === 'success' && data.conversion_rates?.CNY) {
      return data.conversion_rates.CNY;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return FALLBACK_RATE;
  }
}

export async function getCachedExchangeRate(): Promise<number> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return await getUsdToCnyRate();
  }

  const cached = localStorage.getItem('usd_cny_rate');
  const timestamp = localStorage.getItem('usd_cny_timestamp');
  
  if (cached && timestamp && Date.now() - parseInt(timestamp) < CACHE_DURATION) {
    return parseFloat(cached);
  }
  
  const rate = await getUsdToCnyRate();
  localStorage.setItem('usd_cny_rate', rate.toString());
  localStorage.setItem('usd_cny_timestamp', Date.now().toString());
  
  return rate;
}

export function formatCurrencyPair(usdAmount: number, exchangeRate: number): string {
  const cnyAmount = (usdAmount * exchangeRate).toFixed(2);
  return `$${usdAmount.toFixed(2)} USD ≈ ¥${cnyAmount} CNY`;
}

export function convertUsdToCny(usdAmount: number, exchangeRate: number): number {
  return Number((usdAmount * exchangeRate).toFixed(2));
}