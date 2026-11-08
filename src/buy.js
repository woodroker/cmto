import { CONFIG } from './config.js';
export const buyLink = p =>
  `https://wa.me/${CONFIG.wa}?text=${encodeURIComponent(`Halo CMTO, saya tertarik dengan ${p.name}. Apakah tersedia?`)}`;
