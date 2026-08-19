import { useEffect, useState } from 'react';
import { LGAS_BY_STATE, NIGERIAN_STATES } from '../data/nigeriaLocations';
import { supabase } from './supabaseClient';

let locationsPromise;

export function useLocationData() {
  const [locationData, setLocationData] = useState({ states: NIGERIAN_STATES, lgasByState: LGAS_BY_STATE });

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;

    const loadLocations = async () => {
      const [{ data: states }, { data: lgas }] = await Promise.all([
        supabase.from('nigerian_states').select('name').order('name'),
        supabase.from('nigerian_lgas').select('name, state_name').order('name'),
      ]);
      if (!states?.length || !lgas?.length) return null;
      const lgasByState = lgas.reduce((locations, lga) => ({
        ...locations,
        [lga.state_name]: [...(locations[lga.state_name] || []), lga.name],
      }), {});
      return { states: states.map((state) => state.name), lgasByState };
    };

    locationsPromise = locationsPromise || loadLocations();
    locationsPromise.then((data) => {
      if (active && data) setLocationData(data);
    });
    return () => { active = false; };
  }, []);

  return locationData;
}