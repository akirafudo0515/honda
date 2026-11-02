/**
 * Map a store to 北 / 中 / 南 / 東 / 全部.
 * One clear region from the address (and address lines in the description).
 * Several regions, or no place named, becomes 全部.
 */
const RULES = [
  ['east', [/花蓮/, /台東/, /臺東/, /都蘭/]],
  ['south', [/高雄/, /台南/, /臺南/, /屏東/, /嘉義/, /恆春/, /墾丁/]],
  ['central', [/台中/, /臺中/, /大台中/, /苗栗/, /彰化/, /彰縣/, /南投/, /雲林/]],
  ['north', [/基隆/, /台北/, /臺北/, /新北/, /桃園/, /新竹/, /宜蘭/, /松山區/]],
];

function regionsIn(text) {
  const found = [];
  const src = String(text || '');
  for (const [region, patterns] of RULES) {
    if (patterns.some((p) => p.test(src))) found.push(region);
  }
  return found;
}

function addressLines(text) {
  return String(text || '')
    .split(/\n/)
    .filter((line) => /[市縣]/.test(line))
    .join('\n');
}

function classifyRegion(store) {
  const address = String((store && store.address) || '');
  const name = String((store && store.name) || '');
  if (/全台|全省|全臺灣|各據點|各分店/.test(address + name)) return 'all';

  const fromAddress = regionsIn(address);
  if (fromAddress.length > 1) return 'all';

  const extra = regionsIn(
    addressLines([store && store.description, store && store.services, store && store.notes].join('\n'))
  );

  if (fromAddress.length === 1) {
    const set = new Set(fromAddress.concat(extra));
    return set.size > 1 ? 'all' : fromAddress[0];
  }

  const onlyExtra = [...new Set(extra)];
  if (onlyExtra.length === 1) return onlyExtra[0];
  return 'all';
}

module.exports = { classifyRegion, regionsIn };
