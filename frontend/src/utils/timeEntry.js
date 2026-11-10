export function getCurrentTimeInput() {
  const now = new Date();
  const hours = now.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  return {
    time: `${hours % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${period}`,
  };
}

export function formatTime(value) {
  const time = value.trim();
  const twelveHourMatch = time.match(/^(\d{1,2}):([0-5]\d)\s*(a\.?m\.?|p\.?m\.?)$/i);
  let hours;
  let minutes;

  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1]);
    minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toLowerCase().startsWith('p') ? 'PM' : 'AM';
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === 'PM' ? 12 : 0);
  } else {
    const twentyFourHourMatch = time.match(/^((?:[01]\d)|2[0-3]):([0-5]\d)$/);
    if (!twentyFourHourMatch) return null;
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatAttendanceTime(value) {
  if (typeof value !== 'string' || !value.trim()) return '—';
  const time = value.trim();
  const standardTime = time.match(/(\d{1,2}:[0-5]\d\s*[ap]\.?m\.?)/i);
  if (standardTime) return formatTime(standardTime[1]) ?? '—';

  const compactTime = time.match(/\b(\d{3,4})\s*([ap]\.?m\.?)\b/i);
  if (compactTime) {
    const digits = compactTime[1];
    const hour = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
    const minute = digits.slice(-2);
    return formatTime(`${hour}:${minute} ${compactTime[2]}`) ?? '—';
  }

  const twentyFourHourTime = time.match(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/);
  if (twentyFourHourTime) return formatTime(twentyFourHourTime[0]) ?? '—';

  return '—';
}
