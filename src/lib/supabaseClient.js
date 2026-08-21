import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const missingSupabaseConfig = !supabaseUrl || !supabaseAnonKey;

export const supabase = missingSupabaseConfig
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_REGISTRATIONS_KEY = 'pernestdigitalservices_internship_registrations';
const LOCAL_NGO_APPLICATIONS_KEY = 'pernestdigitalservices_ngo_applications';
const LOCAL_COMPANY_APPLICATIONS_KEY = 'pernestdigitalservices_company_applications';
const LOCAL_BUSINESS_APPLICATIONS_KEY = 'pernestdigitalservices_business_applications';
const LOCAL_SCUMl_APPLICATIONS_KEY = 'pernestdigitalservices_scuml_applications';
const LOCAL_NIN_APPLICATIONS_KEY = 'pernestdigitalservices_nin_applications';
const LOCAL_NIN_NAME_CHANGES_KEY = 'pernestdigitalservices_nin_name_changes';
const LOCAL_NIN_DATE_CHANGES_KEY = 'pernestdigitalservices_nin_date_changes';

const APPLICATION_STATUS_SOURCES = [
  ['internship_applications', 'Internship', (item) => `${item.first_name || ''} ${item.last_name || ''}`.trim()],
  ['ngo_applications', 'NGO Registration', (item) => item.proposed_name_1],
  ['company_applications', 'Company Registration', (item) => item.proposed_name_1],
  ['business_applications', 'Business Registration', (item) => item.proposed_name_1],
  ['scuml_applications', 'SCUML Registration', (item) => item.entity_name],
  ['nin_applications', 'NIN Verification', (item) => `${item.first_name || ''} ${item.surname || ''}`.trim()],
  ['nin_name_changes', 'NIN Name Change', (item) => `${item.new_first_name || ''} ${item.new_surname || ''}`.trim()],
  ['nin_date_changes', 'NIN Date Change', (item) => `${item.first_name || ''} ${item.surname || ''}`.trim()],
];

const APPLICATION_TABLES_BY_TAB = {
  applications: 'internship_applications',
  ngo: 'ngo_applications',
  company: 'company_applications',
  business: 'business_applications',
  scuml: 'scuml_applications',
  nin: 'nin_applications',
  'nin-name': 'nin_name_changes',
  'nin-date': 'nin_date_changes',
};

const PAYMENT_TABLES_BY_TYPE = {
  'NGO Registration': 'ngo_applications',
  'Company Registration': 'company_applications',
  'Business Registration': 'business_applications',
  'SCUML Registration': 'scuml_applications',
  'NIN Verification': 'nin_applications',
  'NIN Name Change': 'nin_name_changes',
  'NIN Date Change': 'nin_date_changes',
};

const PAYMENT_LOCAL_KEYS_BY_TABLE = {
  ngo_applications: LOCAL_NGO_APPLICATIONS_KEY,
  company_applications: LOCAL_COMPANY_APPLICATIONS_KEY,
  business_applications: LOCAL_BUSINESS_APPLICATIONS_KEY,
  scuml_applications: LOCAL_SCUMl_APPLICATIONS_KEY,
  nin_applications: LOCAL_NIN_APPLICATIONS_KEY,
  nin_name_changes: LOCAL_NIN_NAME_CHANGES_KEY,
  nin_date_changes: LOCAL_NIN_DATE_CHANGES_KEY,
};

export async function saveRegistrationDocuments(tab, recordId, documents) {
  const table = APPLICATION_TABLES_BY_TAB[tab];
  if (!table) return { error: new Error('Documents are not supported for this record.') };

  if (missingSupabaseConfig || !supabase) {
    try {
      const key = table === 'internship_applications' ? LOCAL_REGISTRATIONS_KEY : `pernestdigitalservices_${table}`;
      const stored = JSON.parse(window.localStorage.getItem(key) || '[]');
      const updated = stored.map((item) => item.id === recordId ? { ...item, registration_documents: documents, status: 'approved', updated_at: new Date().toISOString() } : item);
      window.localStorage.setItem(key, JSON.stringify(updated));
      return { error: null };
    } catch (error) {
      return { error: new Error('Unable to save registration documents on this device.') };
    }
  }

  const { error } = await supabase.from(table).update({ registration_documents: documents, status: 'approved', updated_at: new Date().toISOString() }).eq('id', recordId);
  return { error };
}

export async function lookupApplicationStatus(referenceNumber) {
  const reference = String(referenceNumber || '').trim().toUpperCase();
  if (!reference) return { data: null, error: new Error('Enter your reference number.') };

  if (missingSupabaseConfig || !supabase) {
    try {
      const localRecords = APPLICATION_STATUS_SOURCES.flatMap(([table, type]) => {
        const key = table === 'internship_applications' ? LOCAL_REGISTRATIONS_KEY : `pernestdigitalservices_${table}`;
        return JSON.parse(window.localStorage.getItem(key) || '[]').map((item) => ({ ...item, application_type: type }));
      });
      const record = localRecords.find((item) => String(item.reference_number || '').toUpperCase() === reference);
      return { data: record || null, error: record ? null : new Error('No application was found for that reference number.') };
    } catch (error) {
      return { data: null, error: new Error('Unable to check application status.') };
    }
  }

  const { data, error } = await supabase.rpc('lookup_application_status', { lookup_reference: reference });
  return { data: data?.[0] || null, error: error || (data?.length ? null : new Error('No application was found for that reference number.')) };
}

export async function updatePaymentSlipByReference(referenceNumber, paymentSlip) {
  const result = await lookupApplicationStatus(referenceNumber);
  if (result.error || !result.data) return { error: result.error || new Error('No application was found for that reference number.') };

  const table = PAYMENT_TABLES_BY_TYPE[result.data.application_type];
  if (!table) return { error: new Error('Payment upload is not available for this application type.') };
  const updatedAt = new Date().toISOString();

  if (missingSupabaseConfig || !supabase) {
    try {
      const key = PAYMENT_LOCAL_KEYS_BY_TABLE[table];
      const stored = JSON.parse(window.localStorage.getItem(key) || '[]');
      const updated = stored.map((application) => String(application.reference_number || '').toUpperCase() === String(referenceNumber).trim().toUpperCase()
        ? { ...application, payment_slip: paymentSlip, status: 'payment_submitted', updated_at: updatedAt }
        : application);
      window.localStorage.setItem(key, JSON.stringify(updated));
      return { error: null, data: { ...result.data, payment_slip: paymentSlip, status: 'payment_submitted', updated_at: updatedAt } };
    } catch (error) {
      return { error: new Error('Unable to save the payment slip on this device.') };
    }
  }

  const { data, error } = await supabase
    .from(table)
    .update({ payment_slip: paymentSlip, status: 'payment_submitted', updated_at: updatedAt })
    .eq('reference_number', String(referenceNumber).trim())
    .select('reference_number, status, updated_at')
    .single();
  return { data, error };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getPersistedRegistrations() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(LOCAL_REGISTRATIONS_KEY);
    return storedValue ? JSON.parse(storedValue) : [];
  } catch (error) {
    console.warn('Unable to read persisted registrations', error);
    return [];
  }
}

function savePersistedRegistrations(registrations = []) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_REGISTRATIONS_KEY, JSON.stringify(registrations));
  } catch (error) {
    console.warn('Unable to save persisted registrations', error);
  }
}

function notifyRegistrationChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('pernestdigitalservices:registrations-updated'));
}

async function findDuplicateRegistrationByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || missingSupabaseConfig || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('training_registrations')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data || null;
}

export async function verifyIdCode(code) {
  if (missingSupabaseConfig || !supabase) {
    throw new Error(
      'Supabase credentials are missing. Copy .env.example to .env.local and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

  return supabase
    .from('id_cards')
    .select('id, name, tag, position, membership_id, chapter, status, issued_at, expires_at')
    .eq('barcode', code)
    .limit(1)
    .single();
}

export async function registerMember(member) {
  if (missingSupabaseConfig || !supabase) {
    throw new Error(
      'Supabase credentials are missing. Copy .env.example to .env.local and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

  return supabase
    .from('id_cards')
    .insert(member)
    .select()
    .single();
}

export async function saveTrainingRegistration(registration) {
  const duplicateRegistration = await findDuplicateRegistrationByEmail(registration.email);
  if (duplicateRegistration) {
    return {
      data: null,
      error: new Error('This email address has already been used for a registration.'),
    };
  }

  if (missingSupabaseConfig || !supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('training_registrations')
      .insert(registration)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: new Error(
        'Unable to save registration to the database. Please check your connection and try again.'
      ),
    };
  }
}

export async function submitNGOApplication(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_NGO_APPLICATIONS_KEY) || '[]');
      window.localStorage.setItem(LOCAL_NGO_APPLICATIONS_KEY, JSON.stringify([{ ...application, id: `local-ngo-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save your NGO application on this device.') };
    }
  }

  try {
    const { error } = await supabase
      .from('ngo_applications')
      .insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the NGO application. Please try again.') };
  }
}

export async function updateNGOPaymentSlip(referenceNumber, paymentSlip) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_NGO_APPLICATIONS_KEY) || '[]');
      const updated = stored.map((application) => application.reference_number === referenceNumber
        ? { ...application, payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() }
        : application);
      if (!stored.some((application) => application.reference_number === referenceNumber)) return { error: new Error('No application was found for this reference number.') };
      window.localStorage.setItem(LOCAL_NGO_APPLICATIONS_KEY, JSON.stringify(updated));
      return { error: null };
    } catch (error) {
      return { error: new Error('Unable to save the payment slip on this device.') };
    }
  }

  try {
    const { error } = await supabase
      .from('ngo_applications')
      .update({ payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() })
      .eq('reference_number', referenceNumber);
    return { error };
  } catch (error) {
    return { error: new Error('Unable to upload the payment slip. Please check your connection and try again.') };
  }
}

export async function submitCompanyApplication(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_COMPANY_APPLICATIONS_KEY) || '[]');
      window.localStorage.setItem(LOCAL_COMPANY_APPLICATIONS_KEY, JSON.stringify([{ ...application, id: `local-company-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save the company application on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('company_applications').insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the company application. Please try again.') };
  }
}

export async function updateCompanyPaymentSlip(referenceNumber, paymentSlip) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_COMPANY_APPLICATIONS_KEY) || '[]');
      const updated = stored.map((application) => application.reference_number === referenceNumber ? { ...application, payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() } : application);
      if (!stored.some((application) => application.reference_number === referenceNumber)) return { error: new Error('No application was found for this reference number.') };
      window.localStorage.setItem(LOCAL_COMPANY_APPLICATIONS_KEY, JSON.stringify(updated));
      return { error: null };
    } catch (error) {
      return { error: new Error('Unable to save the payment slip on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('company_applications').update({ payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() }).eq('reference_number', referenceNumber);
    return { error };
  } catch (error) {
    return { error: new Error('Unable to upload the payment slip. Please check your connection and try again.') };
  }
}

export async function submitBusinessApplication(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_BUSINESS_APPLICATIONS_KEY) || '[]');
      window.localStorage.setItem(LOCAL_BUSINESS_APPLICATIONS_KEY, JSON.stringify([{ ...application, id: `local-business-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save the business application on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('business_applications').insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the business application. Please try again.') };
  }
}

export async function updateBusinessPaymentSlip(referenceNumber, paymentSlip) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_BUSINESS_APPLICATIONS_KEY) || '[]');
      const updated = stored.map((application) => application.reference_number === referenceNumber ? { ...application, payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() } : application);
      if (!stored.some((application) => application.reference_number === referenceNumber)) return { error: new Error('No application was found for this reference number.') };
      window.localStorage.setItem(LOCAL_BUSINESS_APPLICATIONS_KEY, JSON.stringify(updated));
      return { error: null };
    } catch (error) {
      return { error: new Error('Unable to save the payment slip on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('business_applications').update({ payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() }).eq('reference_number', referenceNumber);
    return { error };
  } catch (error) {
    return { error: new Error('Unable to upload the payment slip. Please check your connection and try again.') };
  }
}

export async function submitSCUMLApplication(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_SCUMl_APPLICATIONS_KEY) || '[]');
      window.localStorage.setItem(LOCAL_SCUMl_APPLICATIONS_KEY, JSON.stringify([{ ...application, id: `local-scuml-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save the SCUML application on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('scuml_applications').insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the SCUML application. Please try again.') };
  }
}

export async function updateSCUMLPaymentSlip(referenceNumber, paymentSlip) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_SCUMl_APPLICATIONS_KEY) || '[]');
      const updated = stored.map((application) => application.reference_number === referenceNumber ? { ...application, payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() } : application);
      if (!stored.some((application) => application.reference_number === referenceNumber)) return { error: new Error('No application was found for this reference number.') };
      window.localStorage.setItem(LOCAL_SCUMl_APPLICATIONS_KEY, JSON.stringify(updated));
      return { error: null };
    } catch (error) {
      return { error: new Error('Unable to save the payment slip on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('scuml_applications').update({ payment_slip: paymentSlip, status: 'payment_submitted', updated_at: new Date().toISOString() }).eq('reference_number', referenceNumber);
    return { error };
  } catch (error) {
    return { error: new Error('Unable to upload the payment slip. Please check your connection and try again.') };
  }
}

export async function submitNINApplication(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_NIN_APPLICATIONS_KEY) || '[]');
      window.localStorage.setItem(LOCAL_NIN_APPLICATIONS_KEY, JSON.stringify([{ ...application, id: `local-nin-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save the NIN request on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('nin_applications').insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the NIN request. Please try again.') };
  }
}

export async function submitNINNameChange(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_NIN_NAME_CHANGES_KEY) || '[]');
      window.localStorage.setItem(LOCAL_NIN_NAME_CHANGES_KEY, JSON.stringify([{ ...application, id: `local-nin-name-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save the NIN name-change request on this device.') };
    }
  }

  try {
    const { error } = await supabase.from('nin_name_changes').insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the NIN name-change request. Please try again.') };
  }
}

export async function submitNINDateChange(application) {
  if (missingSupabaseConfig || !supabase) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(LOCAL_NIN_DATE_CHANGES_KEY) || '[]');
      window.localStorage.setItem(LOCAL_NIN_DATE_CHANGES_KEY, JSON.stringify([{ ...application, id: `local-nin-date-${Date.now()}` }, ...stored]));
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error: new Error('Unable to save the NIN date-change request on this device.') };
    }
  }
  try {
    const { error } = await supabase.from('nin_date_changes').insert(application);
    return { data: error ? null : application, error };
  } catch (error) {
    return { data: null, error: new Error('Unable to submit the NIN date-change request. Please try again.') };
  }
}

export async function deleteTrainingRegistration(registrationId) {
  if (String(registrationId || '').startsWith('local-')) {
    return {
      data: null,
      error: new Error('Cannot delete a local pending registration from Supabase.'),
    };
  }

  if (missingSupabaseConfig || !supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('training_registrations')
      .delete()
      .eq('id', registrationId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: new Error('Unable to delete registration. Please try again.'),
    };
  }
}

export async function signInAdmin(email, password) {
  if (missingSupabaseConfig || !supabase) {
    throw new Error('Supabase credentials are missing. Add your Supabase URL and anon key to the environment.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { data: null, error };
  }

  const user = data?.user;
  if (!user) {
    return { data: null, error: new Error('No active Supabase user was returned.') };
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id, email, role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminError || !adminRecord) {
    await supabase.auth.signOut();
    return { data: null, error: new Error('This account is not authorized for admin access.') };
  }

  return { data: { session: data.session, user }, error: null };
}

export async function signUpAdmin(email, password) {
  if (missingSupabaseConfig || !supabase) {
    throw new Error('Supabase credentials are missing. Add your Supabase URL and anon key to the environment.');
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { data: null, error };
  }

  const user = data?.user;
  if (!user) {
    return { data: null, error: new Error('Supabase did not return a user for this signup.') };
  }

  return { data: { session: data.session, user }, error: null };
}

export async function signOutAdmin() {
  if (!supabase) {
    return { error: null };
  }

  return supabase.auth.signOut();
}

export async function getAdminSession() {
  if (!supabase) {
    return { data: null, error: null };
  }

  return supabase.auth.getSession();
}

export async function getAllTrainingRegistrations() {
  if (missingSupabaseConfig || !supabase) {
    return { data: getPersistedRegistrations(), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('training_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: getPersistedRegistrations(), error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: getPersistedRegistrations(), error: err };
  }
}

export async function getTrainingRegistrationById(id) {
  if (missingSupabaseConfig || !supabase) {
    const registrations = getPersistedRegistrations();
    const matchingRegistration = registrations.find((entry) => entry.id === id);
    return { data: matchingRegistration || null, error: null };
  }

  return supabase
    .from('training_registrations')
    .select('*')
    .eq('id', id)
    .single();
}

export async function pushPendingRegistrations() {
  if (missingSupabaseConfig || !supabase) {
    return { pushed: 0, error: new Error('Supabase not configured') };
  }

  const persisted = getPersistedRegistrations();
  const pending = persisted.filter((r) => String(r.id || '').startsWith('local-') || !r.id);
  if (!pending.length) {
    return { pushed: 0 };
  }

  let pushed = 0;

  for (const entry of pending) {
    // prepare payload: remove local id and created_at to let Supabase assign values
    const payload = { ...entry };
    delete payload.id;
    // keep created_at if present

    try {
      const { data, error } = await supabase.from('training_registrations').insert(payload).select().single();
      if (error) {
        // if duplicate by unique constraint, attempt to skip
        console.warn('Failed to push pending registration', error);
        continue;
      }

      // Replace local entry with remote data in persisted store
      try {
        const current = getPersistedRegistrations();
        const others = current.filter((c) => c.id !== entry.id);
        savePersistedRegistrations([data, ...others]);
      } catch (persistError) {
        console.warn('Unable to persist pushed registration locally', persistError);
      }

      pushed += 1;
      notifyRegistrationChange();
    } catch (err) {
      console.warn('Error pushing pending registration', err);
    }
  }

  return { pushed };
}

export async function saveContactMessage(message) {
  if (missingSupabaseConfig || !supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: new Error('Unable to save message to the database. Please try again.'),
    };
  }
}

export async function saveTestimonial(testimonial) {
  if (missingSupabaseConfig || !supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .insert(testimonial)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: new Error('Unable to save testimonial. Please try again.'),
    };
  }
}

export async function getAllTestimonials() {
  if (missingSupabaseConfig || !supabase) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function updateTestimonialStatus(testimonialId, status) {
  if (missingSupabaseConfig || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', testimonialId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getAllContactMessages() {
  if (missingSupabaseConfig || !supabase) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function updateMessageStatus(messageId, status) {
  if (missingSupabaseConfig || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
