import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import locationPackage from 'nigeria-state-lga-data';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding locations.');

const { getStatesData } = locationPackage;
const stateName = (name) => name === 'FCT' ? 'Federal Capital Territory' : name;
const normalizeLga = (value) => String(value)
  .replace('Isiala-Ngwa', 'Isiala Ngwa')
  .replace('Isuikwato', 'Isuikwuato')
  .replace('Obi Nwa', 'Obi Ngwa')
  .replace('Umu-Neochi', 'Umunneochi')
  .trim();

const lgasByState = Object.fromEntries(getStatesData().map(({ name, lgas }) => {
  let values = lgas.map(normalizeLga);
  if (name === 'Abia') values = values.join('|').replace('Osisioma|Ngwa', 'Osisioma Ngwa').split('|');
  if (name === 'Jigawa') values = values.flatMap((value) => value === 'Kaugama Kazaure' ? ['Kaugama', 'Kazaure'] : value === 'Kiri Kasamma' ? 'Kiri Kasama' : value === 'Sule-Tankarkar' ? 'Sule Tankarkar' : value);
  if (name === 'Kano') values = values.filter((value) => value !== 'Ghari');
  if (name === 'Ondo') values = values.filter((value) => value !== 'Okeigbo').map((value) => value.replace('Akoko North East', 'Akoko North-East').replace('Akoko North West', 'Akoko North-West').replace('Akoko South Akure East', 'Akoko South-East').replace('Akoko South West', 'Akoko South-West').replace('Ese-Odo', 'Ese Odo').replace('Ile-Oluji', 'Ile Oluji'));
  if (name === 'Zamfara') values = values.flatMap((value) => value === 'Birnin Magaji' ? 'Birnin Magaji/Kiyaw' : value === 'Kaura' ? 'Kaura Namoda' : value === 'Namoda' ? [] : value);
  return [stateName(name), [...new Set(values)]];
}));

const states = Object.keys(lgasByState).map((name) => ({ name }));
const lgas = Object.entries(lgasByState).flatMap(([state_name, names]) => names.map((name) => ({ state_name, name })));
if (states.length !== 37 || lgas.length !== 774) throw new Error(`Expected 37 states and 774 LGAs, got ${states.length} and ${lgas.length}.`);

const supabase = createClient(supabaseUrl, serviceRoleKey);
const { error: stateError } = await supabase.from('nigerian_states').upsert(states, { onConflict: 'name' });
if (stateError) throw stateError;
const { error: lgaError } = await supabase.from('nigerian_lgas').upsert(lgas, { onConflict: 'state_name,name' });
if (lgaError) throw lgaError;
console.log(`Seeded ${states.length} states and ${lgas.length} LGAs.`);