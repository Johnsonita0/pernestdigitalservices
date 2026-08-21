import { useEffect, useState } from 'react';
import locationPackage from 'nigeria-state-lga-data';
import { supabase } from './supabaseClient';

let locationsPromise;

const packageStates = locationPackage.getStatesData();
const localLocationData = {
  states: packageStates.map(({ name }) => name),
  lgasByState: packageStates.reduce((locations, { name, lgas }) => ({
    ...locations,
    [name]: lgas,
  }), {}),
};

export function useLocationData() {
  const [locationData, setLocationData] = useState(localLocationData);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;

    const loadLocations = async () => {
      const [{ data: states, error: statesError }, { data: lgas, error: lgasError }] = await Promise.all([
        supabase.from('nigerian_states').select('name').order('name'),
        supabase.from('nigerian_lgas').select('name, state_name').order('name'),
      ]);
      if (statesError || lgasError || states?.length !== localLocationData.states.length || lgas?.length < 700) return null;
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