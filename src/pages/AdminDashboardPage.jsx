import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAllContactMessages, updateMessageStatus, getAllTestimonials, updateTestimonialStatus, saveRegistrationDocuments, updateApplicationForEdit } from '../lib/supabaseClient';
import { sendInternshipEmail } from '../lib/emailClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faPen, faPrint, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import ApplicationEditForm from '../components/ApplicationEditForm.jsx';
import '../css/pages/AdminDashboardPage.css';

const formatRecordValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return `${value.length} item(s)`;
  return String(value);
};

const statusLabels = {
  payment_pending: 'Payment pending',
  payment_submitted: 'Payment submitted',
  payment_confirmed: 'Payment confirmed',
  pending: 'Pending',
  in_review: 'In review',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
};

const formTabLabels = {
  messages: 'Contact Message',
  testimonials: 'Client Testimonial',
  applications: 'Internship Registration',
  ngo: 'NGO Registration',
  company: 'Company Registration',
  business: 'Business Registration',
  scuml: 'SCUML Registration',
  nin: 'NIN Verification',
  'nin-name': 'NIN Name Change',
  'nin-date': 'NIN Date of Birth Change',
};

function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'unknown').toLowerCase();
  return <span className={`application-status-badge status-badge-${normalizedStatus}`}>{statusLabels[normalizedStatus] || normalizedStatus.replace(/_/g, ' ')}</span>;
}

function showStatusToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, duration: type === 'error' ? 5000 : 4000 } }));
}

function getRecordColumns(tab, item) {
  const common = [
    ['Email', item.email],
    ['Phone', item.phone || item.new_phone_number],
    ['Status', item.status],
    ['Submitted', item.created_at ? new Date(item.created_at).toLocaleString() : '—'],
  ];

  if (tab === 'messages') return [['Subject', item.subject || 'No subject'], ['Message', item.message], ...common];
  if (tab === 'testimonials') return [['Company', item.company], ['Rating', `${item.rating || 0}/5`], ['Review', item.message], ...common];
  if (tab === 'applications') return [['Reference', item.reference_number], ['Institution', item.institution], ['Course', item.course_field], ...common];
  if (tab === 'ngo') return [['Reference', item.reference_number], ['Trustees', item.trustee_count], ['Payment', item.payment_slip ? 'Uploaded' : 'Not uploaded'], ...common];
  if (tab === 'company') return [['Reference', item.reference_number], ['Directors', item.directors], ['Shareholders', item.shareholders], ['Payment', item.payment_slip ? 'Uploaded' : 'Not uploaded'], ...common];
  if (tab === 'business') return [['Reference', item.reference_number], ['Proprietors', item.proprietors], ['Payment', item.payment_slip ? 'Uploaded' : 'Not uploaded'], ...common];
  if (tab === 'scuml') return [['Reference', item.reference_number], ['Registration', item.registration_number], ['Persons', item.persons], ['Payment', item.payment_slip ? 'Uploaded' : 'Not uploaded'], ...common];
  if (tab === 'nin') return [['Reference', item.reference_number], ['NIN', item.nin], ['Date of birth', item.date_of_birth], ...common];
  if (tab === 'nin-name') return [['Reference', item.reference_number], ['NIN', item.nin], ['New name', `${item.new_first_name || ''} ${item.new_surname || ''}`.trim()], ...common];
  return [['Reference', item.reference_number], ['NIN', item.nin], ['Old date', item.old_date_of_birth], ['New date', item.new_date_of_birth], ...common];
}

function getRecordName(tab, item) {
  if (tab === 'messages' || tab === 'testimonials') return item.name;
  if (tab === 'applications' || tab === 'nin') return `${item.first_name || ''} ${item.last_name || item.surname || ''}`.trim();
  if (tab === 'nin-name') return `${item.new_first_name || ''} ${item.new_surname || ''}`.trim();
  if (tab === 'scuml') return item.entity_name;
  return item.proposed_name_1 || `${item.first_name || ''} ${item.surname || ''}`.trim();
}

function AdminDashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [applications, setApplications] = useState([]);
  const [ngoApplications, setNgoApplications] = useState([]);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [businessApplications, setBusinessApplications] = useState([]);
  const [scumlApplications, setSCUMLApplications] = useState([]);
  const [ninApplications, setNINApplications] = useState([]);
  const [ninNameChanges, setNINNameChanges] = useState([]);
  const [ninDateChanges, setNINDateChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminEditing, setAdminEditing] = useState(false);
  const [modalTab, setModalTab] = useState('details');
  const [documentUploadBusy, setDocumentUploadBusy] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const tabNavigationRef = useRef(null);
  const [tabScrollState, setTabScrollState] = useState({ left: false, right: false });

  const updateTabScrollState = () => {
    const tabs = tabNavigationRef.current;
    if (!tabs) return;
    setTabScrollState({
      left: tabs.scrollLeft > 2,
      right: tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2,
    });
  };

  const scrollTabs = (direction) => {
    tabNavigationRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  useEffect(() => {
    const tabs = tabNavigationRef.current;
    if (!tabs) return undefined;
    updateTabScrollState();
    tabs.addEventListener('scroll', updateTabScrollState, { passive: true });
    window.addEventListener('resize', updateTabScrollState);
    return () => {
      tabs.removeEventListener('scroll', updateTabScrollState);
      window.removeEventListener('resize', updateTabScrollState);
    };
  }, []);

  useEffect(() => {
    setPendingDocuments([]);
    setAdminEditing(false);
    setModalTab('details');
  }, [selectedItem?.id]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const fetchTable = (table) => supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    const results = await Promise.all([
      getAllContactMessages(),
      getAllTestimonials(),
      fetchTable('internship_applications'),
      fetchTable('ngo_applications'),
      fetchTable('company_applications'),
      fetchTable('business_applications'),
      fetchTable('scuml_applications'),
      fetchTable('nin_applications'),
      fetchTable('nin_name_changes'),
      fetchTable('nin_date_changes'),
    ]);

    const [messagesResult, testimonialsResult, applicationsResult, ngoResult, companyResult, businessResult, scumlResult, ninResult, ninNameResult, ninDateResult] = results;
    setMessages(messagesResult.data || []);
    setTestimonials(testimonialsResult.data || []);
    setApplications(applicationsResult.data || []);
    setNgoApplications(ngoResult.data || []);
    setCompanyApplications(companyResult.data || []);
    setBusinessApplications(businessResult.data || []);
    setSCUMLApplications(scumlResult.data || []);
    setNINApplications(ninResult.data || []);
    setNINNameChanges(ninNameResult.data || []);
    setNINDateChanges(ninDateResult.data || []);
    setLoading(false);

    const errors = results.filter((result) => result.error);
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: {
        message: errors.length ? 'Some admin records could not be updated. Please try again.' : 'All admin records updated successfully.',
        type: errors.length ? 'error' : 'success',
        duration: 5000,
      },
    }));
  };

  const handleStatusChange = async (messageId, newStatus) => {
    let statusUpdateError = null;
    if (activeTab === 'messages') {
      const result = await updateMessageStatus(messageId, newStatus);
      statusUpdateError = result.error;
      if (statusUpdateError) return showStatusToast(`Unable to update message status: ${statusUpdateError.message}`, 'error');
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: newStatus } : msg))
      );
    } else if (activeTab === 'testimonials') {
      const result = await updateTestimonialStatus(messageId, newStatus);
      statusUpdateError = result.error;
      if (statusUpdateError) return showStatusToast(`Unable to update testimonial status: ${statusUpdateError.message}`, 'error');
      setTestimonials((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, status: newStatus } : item))
      );
    } else if (activeTab === 'applications') {
      const currentApp = applications.find((app) => app.id === messageId);
      const { error } = await supabase
        .from('internship_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      statusUpdateError = error;
      if (!error) {
        setApplications(
          applications.map((app) =>
            app.id === messageId ? { ...app, status: newStatus } : app
          )
        );

        if (newStatus === 'approved' && currentApp?.email) {
          try {
            await sendInternshipEmail({
              type: 'approval',
              email: currentApp.email,
              firstName: currentApp.first_name,
              referenceNumber: currentApp.reference_number,
            });
          } catch (emailError) {
            console.warn('Approval email not sent:', emailError.message || emailError);
          }
        }
      }
    } else if (activeTab === 'ngo') {
      const { error } = await supabase
        .from('ngo_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      if (!error) {
        setNgoApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus, updated_at: new Date().toISOString() } : item));
      } else {
        statusUpdateError = error;
      }
    } else if (activeTab === 'company') {
      const { error } = await supabase
        .from('company_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      statusUpdateError = error;
      if (!error) setCompanyApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else if (activeTab === 'business') {
      const { error } = await supabase
        .from('business_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      statusUpdateError = error;
      if (!error) setBusinessApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else if (activeTab === 'scuml') {
      const { error } = await supabase
        .from('scuml_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      statusUpdateError = error;
      if (!error) setSCUMLApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else if (activeTab === 'nin') {
      const { error } = await supabase
        .from('nin_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      statusUpdateError = error;
      if (!error) setNINApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else if (activeTab === 'nin-name') {
      const { error } = await supabase
        .from('nin_name_changes')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      statusUpdateError = error;
      if (!error) setNINNameChanges((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else {
      const { error } = await supabase
        .from('nin_date_changes')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      statusUpdateError = error;
      if (!error) setNINDateChanges((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    }
    if (statusUpdateError) {
      showStatusToast(`Unable to update ${activeTab.replace('-', ' ')} status: ${statusUpdateError.message}`, 'error');
    } else {
      showStatusToast(`${activeTab.replace('-', ' ')} status updated to ${newStatus.replace(/_/g, ' ')}.`, 'success');
    }
    setSelectedItem((item) => item?.id === messageId ? { ...item, status: newStatus, updated_at: new Date().toISOString() } : item);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this record permanently?')) return;
    const tableSetters = {
      messages: ['contact_messages', setMessages],
      testimonials: ['testimonials', setTestimonials],
      applications: ['internship_applications', setApplications],
      ngo: ['ngo_applications', setNgoApplications],
      company: ['company_applications', setCompanyApplications],
      business: ['business_applications', setBusinessApplications],
      scuml: ['scuml_applications', setSCUMLApplications],
      nin: ['nin_applications', setNINApplications],
      'nin-name': ['nin_name_changes', setNINNameChanges],
      'nin-date': ['nin_date_changes', setNINDateChanges],
    };
    const [table, setRecords] = tableSetters[activeTab] || [];
    if (!table) return;
    const { error } = await supabase.from(table).delete().eq('id', recordId);
    if (error) {
      window.alert(`Unable to delete this record: ${error.message}`);
      return;
    }
    setRecords((records) => records.filter((record) => record.id !== recordId));
    setSelectedItem(null);
  };

  const handleDocumentUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !selectedItem) return;
    const documents = await Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, label: file.name, type: file.type, size: file.size, dataUrl: reader.result });
      reader.onerror = () => resolve({ name: file.name, label: file.name, type: file.type, size: file.size });
      reader.readAsDataURL(file);
    })));
    setPendingDocuments((items) => [...items, ...documents]);
    event.target.value = '';
  };

  const handlePendingDocumentLabelChange = (index, label) => {
    setPendingDocuments((documents) => documents.map((document, documentIndex) => documentIndex === index ? { ...document, label } : document));
  };

  const handlePendingDocumentRemove = (index) => {
    setPendingDocuments((documents) => documents.filter((_, documentIndex) => documentIndex !== index));
  };

  const updateActiveTabRecord = (recordId, changes) => {
    const setters = {
      applications: setApplications,
      ngo: setNgoApplications,
      company: setCompanyApplications,
      business: setBusinessApplications,
      scuml: setSCUMLApplications,
      nin: setNINApplications,
      'nin-name': setNINNameChanges,
      'nin-date': setNINDateChanges,
    };
    setters[activeTab]?.((records) => records.map((record) => record.id === recordId ? { ...record, ...changes } : record));
  };

  const saveAdminEdit = (updated) => {
    const changes = { ...updated, updated_at: new Date().toISOString() };
    updateActiveTabRecord(selectedItem.id, changes);
    setSelectedItem((item) => ({ ...item, ...changes }));
    setAdminEditing(false);
    showStatusToast('Application updated successfully.', 'success');
  };

  const applicationActivity = Array.isArray(selectedItem?.edit_history) ? selectedItem.edit_history : [];
  const canEditApplication = activeTab !== 'messages' && activeTab !== 'testimonials';

  const renderModalTabs = () => (
    <div className="application-modal-tabs" role="tablist" aria-label="Application modal views">
      <button type="button" className={modalTab === 'details' ? 'active' : ''} onClick={() => { setModalTab('details'); setAdminEditing(false); }}>Details</button>
      {canEditApplication && <button type="button" className={modalTab === 'edit' ? 'active' : ''} onClick={() => { setModalTab('edit'); setAdminEditing(true); }}>Edit</button>}
      <button type="button" className={modalTab === 'activity' ? 'active' : ''} onClick={() => { setModalTab('activity'); setAdminEditing(false); }}>Activity ({applicationActivity.length})</button>
    </div>
  );

  const renderActivity = () => (
    <section className="application-activity-panel">
      <div className="application-activity-heading"><p className="application-edit-kicker">Application history</p><h2>Activity log</h2><p>Every client and administrator edit is recorded here.</p></div>
      {applicationActivity.length ? <ol className="application-activity-list">{[...applicationActivity].reverse().map((activity, index) => <li key={`${activity.timestamp || 'activity'}-${index}`}><time dateTime={activity.timestamp}>{new Date(activity.timestamp).toLocaleString()}</time><strong>{activity.activity || 'Application updated'}</strong><span>{activity.actor || 'Client'}</span>{activity.fields?.length > 0 && <small>Updated: {activity.fields.join(', ')}</small>}</li>)}</ol> : <p className="registration-documents-empty">No edits have been recorded for this application.</p>}
    </section>
  );

  const handleSaveDocuments = async (documentsOverride = null) => {
    if (!selectedItem || (!pendingDocuments.length && !documentsOverride)) return;
    setDocumentUploadBusy(true);
    const existing = Array.isArray(selectedItem.registration_documents) ? selectedItem.registration_documents : [];
    const nextDocuments = documentsOverride || [...existing, ...pendingDocuments];
    const updatedAt = new Date().toISOString();
    const activity = { timestamp: updatedAt, actor: 'Administrator', activity: documentsOverride ? 'Official documents changed' : 'Official documents uploaded', fields: ['registration_documents'] };
    const nextHistory = [...(Array.isArray(selectedItem.edit_history) ? selectedItem.edit_history : []), activity];
    const { error } = await saveRegistrationDocuments(activeTab, selectedItem.id, nextDocuments, nextHistory);
    if (!error) {
      const completedStatus = activeTab.startsWith('nin-') || activeTab === 'nin' ? 'completed' : 'approved';
      const changes = { registration_documents: nextDocuments, status: completedStatus, updated_at: updatedAt, edit_history: nextHistory };
      updateActiveTabRecord(selectedItem.id, changes);
      setSelectedItem((item) => ({ ...item, ...changes }));
      setPendingDocuments([]);
      showStatusToast(documentsOverride ? 'Document changes saved successfully.' : 'Documents uploaded successfully.', 'success');
    } else {
      showStatusToast(`Unable to save documents: ${error.message}`, 'error');
    }
    setDocumentUploadBusy(false);
  };

  const filteredData = activeTab === 'messages'
    ? messages.filter((msg) => filter === 'all' || msg.status === filter)
    : activeTab === 'testimonials'
      ? testimonials.filter((item) => filter === 'all' || item.status === filter)
      : activeTab === 'applications'
        ? applications.filter((app) => filter === 'all' || app.status === filter)
        : activeTab === 'ngo'
          ? ngoApplications.filter((app) => filter === 'all' || app.status === filter)
          : activeTab === 'company'
            ? companyApplications.filter((app) => filter === 'all' || app.status === filter)
            : activeTab === 'business'
              ? businessApplications.filter((app) => filter === 'all' || app.status === filter)
              : activeTab === 'scuml'
                ? scumlApplications.filter((app) => filter === 'all' || app.status === filter)
                : activeTab === 'nin'
                  ? ninApplications.filter((app) => filter === 'all' || app.status === filter)
                  : activeTab === 'nin-name'
                    ? ninNameChanges.filter((app) => filter === 'all' || app.status === filter)
                    : ninDateChanges.filter((app) => filter === 'all' || app.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      new: '#ff8c00',
      read: '#003d99',
      replied: '#4caf50',
      pending: '#f59e0b',
      payment_pending: '#f59e0b',
      payment_submitted: '#168ca3',
      payment_confirmed: '#08734f',
      approved: '#10b981',
      rejected: '#ef4444',
    };
    return colors[status] || '#999';
  };

  const renderDetail = (item) => (
    activeTab === 'messages' ? <MessageDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
      : activeTab === 'testimonials' ? <TestimonialDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
        : activeTab === 'applications' ? <ApplicationDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
          : activeTab === 'ngo' ? <NGOApplicationDetail item={item} onStatusChange={handleStatusChange} />
            : activeTab === 'company' ? <CompanyApplicationDetail item={item} onStatusChange={handleStatusChange} />
              : activeTab === 'business' ? <BusinessApplicationDetail item={item} onStatusChange={handleStatusChange} />
                : activeTab === 'nin' ? <NINApplicationDetail item={item} onStatusChange={handleStatusChange} />
                  : activeTab === 'nin-name' ? <NINNameChangeDetail item={item} onStatusChange={handleStatusChange} />
                    : activeTab === 'nin-date' ? <NINDateChangeDetail item={item} onStatusChange={handleStatusChange} />
                      : <SCUMLApplicationDetail item={item} onStatusChange={handleStatusChange} />
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <a href="/" className="header-logo-link" aria-label="Go to home page">
              <img src="/logo/logo2.jpeg" alt="Logo" className="header-logo" />
            </a>
            <div className="header-copy">
              <h1>Welcome Admin</h1>
              <p>Manage messages, testimonials, internship, NGO, and company registrations</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Tab Navigation */}
        <div className="tab-navigation-shell">
          <button type="button" className="tab-scroll-arrow tab-scroll-arrow-left" onClick={() => scrollTabs(-1)} disabled={!tabScrollState.left} aria-label="Scroll tabs left" title="Scroll tabs left">‹</button>
          <div className="tab-navigation" ref={tabNavigationRef}>
          <button
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('messages');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            📧 Contact Messages ({messages.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'testimonials' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('testimonials');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            ⭐ Testimonials ({testimonials.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('applications');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            🎓 Internship Applications ({applications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'ngo' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ngo');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            🏛️ NGO Registrations ({ngoApplications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('company');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            🏢 Company Registrations ({companyApplications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('business');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            🧾 Business Registrations ({businessApplications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'scuml' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('scuml');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            🛡️ SCUML Applications ({scumlApplications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'nin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('nin');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            🪪 NIN Requests ({ninApplications.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'nin-name' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('nin-name');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            ✏️ NIN Name Changes ({ninNameChanges.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'nin-date' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('nin-date');
              setFilter('all');
              setSelectedItem(null);
            }}
          >
            📅 NIN Date Changes ({ninDateChanges.length})
          </button>
          </div>
          <button type="button" className="tab-scroll-arrow tab-scroll-arrow-right" onClick={() => scrollTabs(1)} disabled={!tabScrollState.right} aria-label="Scroll tabs right" title="Scroll tabs right">›</button>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>{activeTab === 'messages' ? 'Filter Messages' : activeTab === 'testimonials' ? 'Filter Testimonials' : activeTab === 'applications' ? 'Filter Applications' : activeTab === 'ngo' ? 'Filter NGO Registrations' : activeTab === 'company' ? 'Filter Company Registrations' : activeTab === 'business' ? 'Filter Business Registrations' : activeTab === 'scuml' ? 'Filter SCUML Applications' : activeTab === 'nin' ? 'Filter NIN Requests' : activeTab === 'nin-name' ? 'Filter NIN Name Changes' : 'Filter NIN Date Changes'}</h3>
            <div className="filter-buttons">
              {activeTab === 'messages' ? (
                <>
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({messages.length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
                    onClick={() => setFilter('new')}
                  >
                    New ({messages.filter((m) => m.status === 'new').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                    onClick={() => setFilter('read')}
                  >
                    Read ({messages.filter((m) => m.status === 'read').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'replied' ? 'active' : ''}`}
                    onClick={() => setFilter('replied')}
                  >
                    Replied ({messages.filter((m) => m.status === 'replied').length})
                  </button>
                </>
              ) : activeTab === 'testimonials' ? (
                <>
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({testimonials.length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
                    onClick={() => setFilter('new')}
                  >
                    New ({testimonials.filter((item) => item.status === 'new').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                  >
                    Approved ({testimonials.filter((item) => item.status === 'approved').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilter('rejected')}
                  >
                    Rejected ({testimonials.filter((item) => item.status === 'rejected').length})
                  </button>
                </>
              ) : activeTab === 'applications' ? (
                <>
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({applications.length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                  >
                    Pending ({applications.filter((a) => a.status === 'pending').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                  >
                    Approved ({applications.filter((a) => a.status === 'approved').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilter('rejected')}
                  >
                    Rejected ({applications.filter((a) => a.status === 'rejected').length})
                  </button>
                </>
              ) : activeTab === 'ngo' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({ngoApplications.length})</button>
                  <button className={`filter-btn ${filter === 'payment_pending' ? 'active' : ''}`} onClick={() => setFilter('payment_pending')}>Payment Pending ({ngoApplications.filter((a) => a.status === 'payment_pending').length})</button>
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({ngoApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'payment_confirmed' ? 'active' : ''}`} onClick={() => setFilter('payment_confirmed')}>Payment Confirmed ({ngoApplications.filter((a) => a.status === 'payment_confirmed').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({ngoApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({ngoApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : activeTab === 'company' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({companyApplications.length})</button>
                  <button className={`filter-btn ${filter === 'payment_pending' ? 'active' : ''}`} onClick={() => setFilter('payment_pending')}>Payment Pending ({companyApplications.filter((a) => a.status === 'payment_pending').length})</button>
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({companyApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'payment_confirmed' ? 'active' : ''}`} onClick={() => setFilter('payment_confirmed')}>Payment Confirmed ({companyApplications.filter((a) => a.status === 'payment_confirmed').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({companyApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({companyApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : activeTab === 'business' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({businessApplications.length})</button>
                  <button className={`filter-btn ${filter === 'payment_pending' ? 'active' : ''}`} onClick={() => setFilter('payment_pending')}>Payment Pending ({businessApplications.filter((a) => a.status === 'payment_pending').length})</button>
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({businessApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'payment_confirmed' ? 'active' : ''}`} onClick={() => setFilter('payment_confirmed')}>Payment Confirmed ({businessApplications.filter((a) => a.status === 'payment_confirmed').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({businessApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({businessApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : activeTab === 'scuml' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({scumlApplications.length})</button>
                  <button className={`filter-btn ${filter === 'payment_pending' ? 'active' : ''}`} onClick={() => setFilter('payment_pending')}>Payment Pending ({scumlApplications.filter((a) => a.status === 'payment_pending').length})</button>
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({scumlApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'payment_confirmed' ? 'active' : ''}`} onClick={() => setFilter('payment_confirmed')}>Payment Confirmed ({scumlApplications.filter((a) => a.status === 'payment_confirmed').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({scumlApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({scumlApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : activeTab === 'nin' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({ninApplications.length})</button>
                  <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending ({ninApplications.filter((a) => a.status === 'pending').length})</button>
                  <button className={`filter-btn ${filter === 'in_review' ? 'active' : ''}`} onClick={() => setFilter('in_review')}>In Review ({ninApplications.filter((a) => a.status === 'in_review').length})</button>
                  <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed ({ninApplications.filter((a) => a.status === 'completed').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({ninApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : activeTab === 'nin-name' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({ninNameChanges.length})</button>
                  <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending ({ninNameChanges.filter((a) => a.status === 'pending').length})</button>
                  <button className={`filter-btn ${filter === 'in_review' ? 'active' : ''}`} onClick={() => setFilter('in_review')}>In Review ({ninNameChanges.filter((a) => a.status === 'in_review').length})</button>
                  <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed ({ninNameChanges.filter((a) => a.status === 'completed').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({ninNameChanges.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({ninDateChanges.length})</button>
                  <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending ({ninDateChanges.filter((a) => a.status === 'pending').length})</button>
                  <button className={`filter-btn ${filter === 'in_review' ? 'active' : ''}`} onClick={() => setFilter('in_review')}>In Review ({ninDateChanges.filter((a) => a.status === 'in_review').length})</button>
                  <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed ({ninDateChanges.filter((a) => a.status === 'completed').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({ninDateChanges.filter((a) => a.status === 'rejected').length})</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {loading ? (
            <div className="loading">Loading {activeTab === 'messages' ? 'messages' : activeTab === 'ngo' ? 'NGO registrations' : activeTab === 'company' ? 'company registrations' : activeTab === 'business' ? 'business registrations' : activeTab === 'scuml' ? 'SCUML applications' : activeTab === 'nin' ? 'NIN requests' : activeTab === 'nin-name' ? 'NIN name changes' : 'NIN date changes'}...</div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <p>No {activeTab === 'messages' ? 'messages' : activeTab === 'ngo' ? 'NGO registrations' : activeTab === 'company' ? 'company registrations' : activeTab === 'business' ? 'business registrations' : activeTab === 'scuml' ? 'SCUML applications' : activeTab === 'nin' ? 'NIN requests' : activeTab === 'nin-name' ? 'NIN name changes' : 'NIN date changes'} found</p>
            </div>
          ) : (
            <div className="messages-container">
              <div className="records-table-wrap">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      {getRecordColumns(activeTab, filteredData[0]).map(([label]) => <th key={label}>{label}</th>)}
                      <th className="records-actions-heading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id}>
                        <td className="record-name-cell" onClick={() => setSelectedItem(item)}>
                          <button type="button" className="record-name-btn" onClick={() => setSelectedItem(item)} aria-label={`Open details for ${getRecordName(activeTab, item) || 'record'}`}>
                            {getRecordName(activeTab, item) || 'Unnamed applicant'}
                          </button>
                        </td>
                        {getRecordColumns(activeTab, item).map(([label, value]) => <td className={label === 'Status' ? `status-table-cell status-cell-${String(value || 'unknown').toLowerCase()}` : ''} key={label}>{formatRecordValue(value)}</td>)}
                        <td className="records-actions-cell"><button type="button" className="record-delete-table-btn" onClick={() => handleDelete(item.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* List */}
              <div className="messages-list legacy-record-list">
                {filteredData.map((item) => {
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <div key={item.id} className="list-item-group">
                      <div
                        className={`message-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedItem(isSelected ? null : item)}
                      >
                        <button type="button" className="record-delete-btn" onClick={(event) => { event.stopPropagation(); handleDelete(item.id); }} aria-label="Delete record" title="Delete record">Delete</button>
                        {activeTab === 'messages' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.name}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span
                                className="message-status"
                                style={{ backgroundColor: getStatusColor(item.status) }}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="message-subject">{item.subject || 'No subject'}</p>
                            <p className="message-preview">{item.message.substring(0, 100)}...</p>
                            <p className="message-date">
                              {new Date(item.created_at).toLocaleDateString()}{' '}
                              {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                          </>
                        ) : activeTab === 'testimonials' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.name}</h4>
                                <p className="message-email">{item.company}</p>
                              </div>
                              <span
                                className="message-status"
                                style={{ backgroundColor: getStatusColor(item.status) }}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="message-subject">{Array(item.rating || 0).fill('⭐').join('')}</p>
                            <p className="message-preview">{item.message.substring(0, 100)}...</p>
                            <p className="message-date">
                              {new Date(item.created_at).toLocaleDateString()}{' '}
                              {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                          </>
                        ) : activeTab === 'applications' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.first_name} {item.last_name}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span
                                className="message-status"
                                style={{ backgroundColor: getStatusColor(item.status) }}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.institution}</p>
                            <p className="message-date">
                              {new Date(item.created_at).toLocaleDateString()}{' '}
                              {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                          </>
                        ) : activeTab === 'ngo' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.proposed_name_1}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.trustee_count} trustee(s) · {item.payment_slip ? 'Payment slip uploaded' : 'Awaiting payment slip'}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        ) : activeTab === 'company' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.proposed_name_1}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.directors?.length || 0} director(s) · {item.shareholders?.length || 0} shareholder(s) · {item.payment_slip ? 'Payment slip uploaded' : 'Awaiting payment slip'}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        ) : activeTab === 'scuml' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.entity_name}</h4>
                                <p className="message-email">{item.registration_number}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.persons?.length || 0} person(s) · {item.payment_slip ? 'Payment slip uploaded' : 'Awaiting payment slip'}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        ) : activeTab === 'nin' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.first_name} {item.surname}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.nin || item.phone || 'Name and date of birth search'}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        ) : activeTab === 'nin-name' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.new_first_name} {item.new_surname}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">NIN: {item.nin} · New phone: {item.new_phone_number}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        ) : activeTab === 'nin-date' ? (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.first_name} {item.surname}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.old_date_of_birth} → {item.new_date_of_birth} · NIN: {item.nin}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        ) : (
                          <>
                            <div className="message-header">
                              <div className="message-info">
                                <h4>{item.proposed_name_1}</h4>
                                <p className="message-email">{item.email}</p>
                              </div>
                              <span className="message-status" style={{ backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <p className="message-subject">{item.reference_number}</p>
                            <p className="message-preview">{item.proprietors?.length || 0} proprietor(s) · {item.payment_slip ? 'Payment slip uploaded' : 'Awaiting payment slip'}</p>
                            <p className="message-date">{new Date(item.created_at).toLocaleString()}</p>
                          </>
                        )}
                      </div>

                      {isSelected && (
                        <div className="selected-detail-panel">
                          {renderDetail(item)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {selectedItem && !loading && (
            <div className="record-modal-backdrop" role="presentation" onMouseDown={() => setSelectedItem(null)}>
              <div className={`record-modal-card ${activeTab === 'ngo' ? 'ngo-modal' : ''}`} role="dialog" aria-modal="true" aria-label="Record details" onMouseDown={(event) => event.stopPropagation()}>
                {activeTab === 'ngo' ? (
                  <>{renderModalTabs()}{modalTab === 'activity' ? renderActivity() : modalTab === 'edit' ? <ApplicationEditForm application={selectedItem} applicationType={formTabLabels[activeTab]} isAdmin onCancel={() => setModalTab('details')} onSaved={saveAdminEdit} /> : <NGOApplicationDocument item={selectedItem} onEdit={() => setModalTab('edit')} onStatusChange={handleStatusChange} onClose={() => setSelectedItem(null)} documentUploadBusy={documentUploadBusy} pendingDocuments={pendingDocuments} onDocumentUpload={handleDocumentUpload} onLabelChange={handlePendingDocumentLabelChange} onRemove={handlePendingDocumentRemove} onSaveDocuments={handleSaveDocuments} />}</>
                ) : (
                  <>{renderModalTabs()}{modalTab === 'activity' ? renderActivity() : modalTab === 'edit' && canEditApplication ? <ApplicationEditForm application={selectedItem} applicationType={formTabLabels[activeTab]} isAdmin onCancel={() => setModalTab('details')} onSaved={saveAdminEdit} /> : <div className="generic-document-shell">
                    <div className="generic-document-toolbar"><span>{formTabLabels[activeTab] || 'Application'} form</span><div><button type="button" className="print-document-btn modal-action-btn" onClick={() => setModalTab('edit')} aria-label="Edit application" title="Edit application"><FontAwesomeIcon icon={faPen} /><span>Edit application</span></button><button type="button" className="print-document-btn modal-action-btn" onClick={() => window.print()} aria-label="Print document" title="Print document"><FontAwesomeIcon icon={faPrint} /><span>Print document</span></button><button type="button" className="ngo-document-close" onClick={() => setSelectedItem(null)} aria-label="Close document">×</button></div></div>
                    <header className="generic-document-heading">
                      <div className="generic-document-brand"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /><div><p className="generic-document-eyebrow">PERNEST DIGITAL ENTERPRISES</p><h2>{formTabLabels[activeTab] || 'Application'}</h2><p>Official administrative review copy</p></div></div>
                      <ModalPaymentPreview paymentSlip={selectedItem.payment_slip} />
                    </header>
                    <div className="generic-document-meta"><div><strong>Reference number</strong><span>{selectedItem.reference_number || 'Not available'}</span></div><div className={`generic-status-cell status-cell-${String(selectedItem.status || 'unknown').toLowerCase()}`}><strong>Application status</strong><StatusBadge status={selectedItem.status} /></div><div><strong>Date submitted</strong><span>{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'Not available'}</span></div></div>
                    {renderDetail(selectedItem)}
                    <div className="record-modal-section-stack">
                      <CollectedFields item={selectedItem} />
                      <UploadedImages item={selectedItem} />
                      <RegistrationDocuments item={selectedItem} isAdmin={activeTab !== 'messages' && activeTab !== 'testimonials'} pendingDocuments={pendingDocuments} onUpload={handleDocumentUpload} onLabelChange={handlePendingDocumentLabelChange} onRemove={handlePendingDocumentRemove} onSave={handleSaveDocuments} uploadBusy={documentUploadBusy} />
                    </div>
                  </div>}</>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Detail Component
function MessageDetail({ item, getStatusColor, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>{item.subject || 'No Subject'}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>

      <div className="detail-info">
        <div className="info-row">
          <strong>From:</strong>
          <span>{item.name}</span>
        </div>
        <div className="info-row">
          <strong>Email:</strong>
          <span>
            <a href={`mailto:${item.email}`}>{item.email}</a>
          </span>
        </div>
        {item.phone && (
          <div className="info-row">
            <strong>Phone:</strong>
            <span>
              <a href={`tel:${item.phone}`}>{item.phone}</a>
            </span>
          </div>
        )}
        <div className="info-row">
          <strong>Date:</strong>
          <span>{new Date(item.created_at).toLocaleString()}</span>
        </div>
        <div className="info-row">
          <strong>Status:</strong>
          <select
            value={item.status}
            onChange={(e) => onStatusChange(item.id, e.target.value)}
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      <div className="detail-message">
        <h3>Message</h3>
        <p>{item.message}</p>
      </div>

      <div className="detail-actions">
        <a href={`mailto:${item.email}?subject=Re: ${item.subject}`} className="reply-btn">
          Reply via Email
        </a>
        {item.phone && (
          <a href={`tel:${item.phone}`} className="call-btn">
            Call
          </a>
        )}
      </div>
    </div>
  );
}

// Testimonial Detail Component
function TestimonialDetail({ item, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>Testimonial Review</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>

      <div className="detail-info">
        <div className="info-row">
          <strong>Name:</strong>
          <span>{item.name}</span>
        </div>
        <div className="info-row">
          <strong>Company:</strong>
          <span>{item.company}</span>
        </div>
        <div className="info-row">
          <strong>Rating:</strong>
          <span>{Array(item.rating || 0).fill('⭐').join('')}</span>
        </div>
        <div className="info-row">
          <strong>Date:</strong>
          <span>{new Date(item.created_at).toLocaleString()}</span>
        </div>
        <div className="info-row">
          <strong>Status:</strong>
          <select
            value={item.status}
            onChange={(e) => onStatusChange(item.id, e.target.value)}
          >
            <option value="new">New</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="detail-message">
        <h3>Review</h3>
        <p>{item.message}</p>
      </div>
    </div>
  );
}

// Application Detail Component
function ApplicationDetail({ item, getStatusColor, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>Application: {item.first_name} {item.last_name}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>

      <div className="detail-info">
        <div className="info-row">
          <strong>Reference Number:</strong>
          <span className="reference-number">{item.reference_number}</span>
        </div>
        <div className="info-row">
          <strong>Name:</strong>
          <span>{item.first_name} {item.last_name}</span>
        </div>
        <div className="info-row">
          <strong>Email:</strong>
          <span>
            <a href={`mailto:${item.email}`}>{item.email}</a>
          </span>
        </div>
        <div className="info-row">
          <strong>Phone:</strong>
          <span>
            <a href={`tel:${item.phone}`}>{item.phone}</a>
          </span>
        </div>
        <div className="info-row">
          <strong>Date of Birth:</strong>
          <span>{item.date_of_birth}</span>
        </div>
        <div className="info-row">
          <strong>Location:</strong>
          <span>{item.city}, {item.state}</span>
        </div>
        <div className="info-row">
          <strong>Institution:</strong>
          <span>{item.institution}</span>
        </div>
        <div className="info-row">
          <strong>Course/Field:</strong>
          <span>{item.course_field}</span>
        </div>
        <div className="info-row">
          <strong>Education Level:</strong>
          <span>{item.education_level}</span>
        </div>
        <div className="info-row">
          <strong>Applied Date:</strong>
          <span>{new Date(item.created_at).toLocaleString()}</span>
        </div>
        <div className="info-row">
          <strong>Status:</strong>
          <select
            value={item.status}
            onChange={(e) => onStatusChange(item.id, e.target.value)}
            className="status-select"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="application-sections">
        <div className="app-section">
          <h4>Previous Experience</h4>
          <p>{item.previous_experience}</p>
        </div>

        <div className="app-section">
          <h4>Why Interested</h4>
          <p>{item.why_interested}</p>
        </div>

        <div className="app-section">
          <h4>Goals for Internship</h4>
          <p>{item.goals}</p>
        </div>

        <div className="app-section">
          <h4>Skills Interested</h4>
          <p>{item.skills_interested}</p>
        </div>
      </div>

      <div className="detail-actions">
        <a href={`mailto:${item.email}?subject=Internship Application Status`} className="reply-btn">
          Send Email
        </a>
        <a href={`tel:${item.phone}`} className="call-btn">
          Call
        </a>
      </div>
    </div>
  );
}

function PaymentSlipPreview({ paymentSlip }) {
  if (!paymentSlip?.dataUrl) return <span>Not uploaded</span>;
  const isImage = paymentSlip.type?.startsWith('image/') || paymentSlip.dataUrl.startsWith('data:image/');
  return (
    <span className="admin-payment-preview">
      {isImage ? <img src={paymentSlip.dataUrl} alt={`${paymentSlip.name || 'Payment slip'} preview`} /> : <span className="admin-payment-pdf">PDF</span>}
      <a href={paymentSlip.dataUrl} target="_blank" rel="noreferrer">View {paymentSlip.name || 'payment slip'}</a>
    </span>
  );
}

function ModalPaymentPreview({ paymentSlip }) {
  if (!paymentSlip?.dataUrl) return null;
  const isImage = paymentSlip.type?.startsWith('image/') || paymentSlip.dataUrl.startsWith('data:image/');
  return <div className="modal-payment-preview" title={paymentSlip.name || 'Payment slip'}>{isImage ? <img src={paymentSlip.dataUrl} alt="Payment slip preview" /> : <span>PDF</span>}<a href={paymentSlip.dataUrl} target="_blank" rel="noreferrer" aria-label="View payment slip"><FontAwesomeIcon icon={faDownload} /></a></div>;
}

function NGOApplicationDetail({ item, onStatusChange }) {
  const trustees = Array.isArray(item.trustees) ? item.trustees : [];
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>NGO Application: {item.proposed_name_1}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>Email:</strong><span><a href={`mailto:${item.email}`}>{item.email}</a></span></div>
        <div className="info-row"><strong>Office:</strong><span>{item.office_address}</span></div>
        <div className="info-row"><strong>Trustees:</strong><span>{item.trustee_count}</span></div>
        <div className="info-row"><strong>Payment slip:</strong><PaymentSlipPreview paymentSlip={item.payment_slip} /></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="payment_confirmed">Payment Confirmed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="application-sections">
        <div className="app-section"><h4>Aims and objectives</h4><p>{item.aims}</p></div>
        <div className="app-section"><h4>Sources of income</h4><p>{item.source_of_income}</p></div>
        {trustees.map((trustee, index) => <div className="app-section" key={index}><h4>Trustee {index + 1}: {trustee.firstName} {trustee.surname}</h4><p>{trustee.email} · {trustee.phone} · {trustee.occupation}</p><p>{trustee.idDocument?.dataUrl ? <a href={trustee.idDocument.dataUrl} target="_blank" rel="noreferrer">View ID</a> : 'ID not uploaded'} · {trustee.signature?.dataUrl ? <a href={trustee.signature.dataUrl} target="_blank" rel="noreferrer">View signature</a> : 'Signature not uploaded'} · {trustee.passport?.dataUrl ? <a href={trustee.passport.dataUrl} target="_blank" rel="noreferrer">View passport</a> : 'Passport not uploaded'}</p></div>)}
      </div>
    </div>
  );
}

function CompanyApplicationDetail({ item, onStatusChange }) {
  const people = [
    ['Witness', item.witness],
    ...(item.directors || []).map((person, index) => [`Director ${index + 1}`, person]),
    ...(item.shareholders || []).map((person, index) => [`Shareholder ${index + 1}`, person]),
  ];
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>Company Application: {item.proposed_name_1}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>Email:</strong><span><a href={`mailto:${item.email}`}>{item.email}</a></span></div>
        <div className="info-row"><strong>Phone:</strong><span>{item.phone}</span></div>
        <div className="info-row"><strong>Address:</strong><span>{item.town}, {item.state}, {item.street_name}</span></div>
        <div className="info-row"><strong>Payment slip:</strong><PaymentSlipPreview paymentSlip={item.payment_slip} /></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="payment_confirmed">Payment Confirmed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="application-sections">
        <div className="app-section"><h4>Object of memorandum</h4><p>{item.objects}</p></div>
        {people.map(([label, person]) => <div className="app-section" key={label}><h4>{label}: {person?.firstName} {person?.surname}</h4><p>{person?.email} · {person?.phone} · {person?.occupation}</p><p>{person?.idDocument?.dataUrl ? <a href={person.idDocument.dataUrl} target="_blank" rel="noreferrer">View ID</a> : 'ID not uploaded'} · {person?.signature?.dataUrl ? <a href={person.signature.dataUrl} target="_blank" rel="noreferrer">View signature</a> : 'Signature not uploaded'}</p></div>)}
      </div>
    </div>
  );
}

function BusinessApplicationDetail({ item, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>Business Application: {item.proposed_name_1}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>Email:</strong><span><a href={`mailto:${item.email}`}>{item.email}</a></span></div>
        <div className="info-row"><strong>Phone:</strong><span>{item.phone}</span></div>
        <div className="info-row"><strong>Address:</strong><span>{item.town}, {item.state}, {item.street_name}</span></div>
        <div className="info-row"><strong>Payment slip:</strong><PaymentSlipPreview paymentSlip={item.payment_slip} /></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="payment_confirmed">Payment Confirmed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="application-sections">
        {(item.proprietors || []).map((person, index) => <div className="app-section" key={index}><h4>Proprietor {index + 1}: {person.firstName} {person.surname}</h4><p>{person.email} · {person.phone} · {person.occupation}</p><p>{person.idDocument?.dataUrl ? <a href={person.idDocument.dataUrl} target="_blank" rel="noreferrer">View ID</a> : 'ID not uploaded'} · {person.signature?.dataUrl ? <a href={person.signature.dataUrl} target="_blank" rel="noreferrer">View signature</a> : 'Signature not uploaded'} · {person.passport?.dataUrl ? <a href={person.passport.dataUrl} target="_blank" rel="noreferrer">View passport</a> : 'Passport not uploaded'}</p></div>)}
      </div>
    </div>
  );
}

function SCUMLApplicationDetail({ item, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>SCUML Application: {item.entity_name}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>Registration:</strong><span>{item.registration_number}</span></div>
        <div className="info-row"><strong>Tax ID:</strong><span>{item.tax_id}</span></div>
        <div className="info-row"><strong>Address:</strong><span>{item.registered_address}</span></div>
        <div className="info-row"><strong>Payment slip:</strong><PaymentSlipPreview paymentSlip={item.payment_slip} /></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="payment_confirmed">Payment Confirmed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="application-sections">
        <div className="app-section"><h4>Account details</h4><p>{item.bank_name} · {item.account_number} · {item.account_name}</p></div>
        {(item.persons || []).map((person, index) => <div className="app-section" key={index}><h4>Person {index + 1}: {person.name}</h4><p>{person.email} · {person.phone} · BVN: {person.bvn} · NIN: {person.nin}</p><p>{person.address}</p></div>)}
      </div>
    </div>
  );
}

function NINApplicationDetail({ item, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>NIN Request: {item.first_name} {item.surname}</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>NIN:</strong><span>{item.nin || 'Not provided'}</span></div>
        <div className="info-row"><strong>Phone:</strong><span>{item.phone || 'Not provided'}</span></div>
        <div className="info-row"><strong>Name:</strong><span>{item.first_name} {item.surname}</span></div>
        <div className="info-row"><strong>Date of birth:</strong><span>{item.date_of_birth || 'Not provided'}</span></div>
        <div className="info-row"><strong>Email:</strong><span><a href={`mailto:${item.email}`}>{item.email}</a></span></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="pending">Pending</option><option value="in_review">In Review</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="detail-message"><h3>Address</h3><p>{item.address || 'Not provided'}</p></div>
    </div>
  );
}

function NINNameChangeDetail({ item, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>NIN Name Change Request</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>NIN:</strong><span>{item.nin}</span></div>
        <div className="info-row"><strong>New surname:</strong><span>{item.new_surname}</span></div>
        <div className="info-row"><strong>New first name:</strong><span>{item.new_first_name}</span></div>
        <div className="info-row"><strong>New middle name:</strong><span>{item.new_middle_name || 'Not provided'}</span></div>
        <div className="info-row"><strong>New phone:</strong><span>{item.new_phone_number}</span></div>
        <div className="info-row"><strong>Email:</strong><span><a href={`mailto:${item.email}`}>{item.email}</a></span></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="pending">Pending</option><option value="in_review">In Review</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
      </div>
    </div>
  );
}

function NINDateChangeDetail({ item, onStatusChange }) {
  return (
    <div className="message-detail">
      <div className="detail-header">
        <h2>NIN Date of Birth Change</h2>
        <button className="close-btn" onClick={() => window.location.reload()}>×</button>
      </div>
      <div className="detail-info">
        <div className="info-row"><strong>Reference:</strong><span>{item.reference_number}</span></div>
        <div className="info-row"><strong>NIN:</strong><span>{item.nin}</span></div>
        <div className="info-row"><strong>Applicant:</strong><span>{item.first_name} {item.middle_name} {item.surname}</span></div>
        <div className="info-row"><strong>Old date:</strong><span>{item.old_date_of_birth}</span></div>
        <div className="info-row"><strong>New date:</strong><span>{item.new_date_of_birth}</span></div>
        <div className="info-row"><strong>Phone:</strong><span>{item.phone}</span></div>
        <div className="info-row"><strong>Email:</strong><span><a href={`mailto:${item.email}`}>{item.email}</a></span></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="pending">Pending</option><option value="in_review">In Review</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="application-sections"><div className="app-section"><h4>Residence and education</h4><p>{item.state_of_residence}, {item.lga_of_residence}. {item.residential_address}</p><p>{item.education} · {item.occupation}</p></div><div className="app-section"><h4>Parent information</h4><p>Father: {item.father_first_name} {item.father_surname}, {item.father_state}, {item.father_lga}</p><p>Mother: {item.mother_first_name} {item.mother_surname} ({item.mother_maiden_name}), {item.mother_state}, {item.mother_lga}</p></div></div>
    </div>
  );
}

function NGOApplicationDocument({ item, onEdit, onStatusChange, onClose, documentUploadBusy, pendingDocuments, onDocumentUpload, onLabelChange, onRemove, onSaveDocuments }) {
  const trustees = Array.isArray(item.trustees) ? item.trustees : [];
  const passport = trustees[0]?.passport?.dataUrl;
  const names = [item.proposed_name_1, item.proposed_name_2, item.proposed_name_3].filter(Boolean);

  return (
    <div className="ngo-document">
      <div className="ngo-document-toolbar">
        <span>NGO registration application</span>
        <div><button type="button" className="print-document-btn modal-action-btn" onClick={onEdit} aria-label="Edit application" title="Edit application"><FontAwesomeIcon icon={faPen} /><span>Edit application</span></button><button type="button" className="print-document-btn modal-action-btn" onClick={() => window.print()} aria-label="Print document" title="Print document"><FontAwesomeIcon icon={faPrint} /><span>Print document</span></button><button type="button" className="ngo-document-close" onClick={onClose} aria-label="Close document">×</button></div>
      </div>

      <header className="ngo-document-heading">
        <div className="ngo-document-brand">
          <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" />
          <div>
            <p className="ngo-document-eyebrow">PERNEST DIGITAL ENTERPRISES</p>
            <h2>NGO Registration Application</h2>
            <p>Official administrative review copy</p>
          </div>
        </div>
        {passport ? <div className="ngo-document-passport-frame"><img className="ngo-document-passport" src={passport} alt="Chairman passport photograph" /><ImageDownloadButton src={passport} label="Chairman passport" /></div> : <div className="ngo-document-passport placeholder">Passport<br />photograph</div>}
      </header>

      <div className="ngo-document-meta">
        <div><strong>Reference number</strong><span>{item.reference_number}</span></div>
        <div className={`generic-status-cell status-cell-${String(item.status || 'unknown').toLowerCase()}`}><strong>Application status</strong><div className="ngo-status-control"><StatusBadge status={item.status} /><select className={`status-control-select status-badge-${item.status}`} value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="payment_confirmed">Payment Confirmed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div></div>
        <div><strong>Date submitted</strong><span>{new Date(item.created_at).toLocaleString()}</span></div>
      </div>

      <DocumentSection title="1. Proposed NGO names">
        <div className="ngo-document-names">{names.map((name, index) => <div key={name}><b>{index + 1}.</b> {name}</div>)}</div>
      </DocumentSection>

      <DocumentSection title="2. Applicant and registered office">
        <DocumentFields fields={[
          ['Email address', item.email], ['Office address', item.office_address], ['State', item.state],
          ['LGA', item.lga], ['Town / city', item.town], ['House number', item.house_number], ['Street name', item.street_name],
        ]} />
      </DocumentSection>

      <DocumentSection title="3. Constitution and objectives">
        <DocumentFields fields={[["Number of trustees", item.trustee_count], ['Trustee tenure', item.trustee_tenure ? `${item.trustee_tenure} years` : ''], ['Aims and objectives', item.aims], ['Sources of income', item.source_of_income]]} wide />
      </DocumentSection>

      <DocumentSection title={`4. Trustee information (${trustees.length})`}>
        <div className="ngo-trustee-list">
          {trustees.map((trustee, index) => (
            <article className="ngo-trustee-card" key={index}>
              <div className="ngo-trustee-card-heading"><h4>Trustee {index + 1}{index === 0 ? ' · Chairman' : index === 1 ? ' · Secretary' : ''}</h4><span>{trustee.idType || 'Identification'}: {trustee.idNumber || 'Not provided'}</span></div>
              <DocumentFields fields={[
                ['Full name', [trustee.firstName, trustee.otherName, trustee.surname].filter(Boolean).join(' ')], ['Date of birth', trustee.dateOfBirth], ['Gender', trustee.gender], ['Nationality', trustee.nationality],
                ['Phone number', trustee.phone], ['Email address', trustee.email], ['Occupation', trustee.occupation], ['Address', [trustee.houseNumber, trustee.streetName, trustee.town, trustee.lga, trustee.state].filter(Boolean).join(', ')],
              ]} />
              <div className="ngo-trustee-documents"><span>{trustee.idDocument?.dataUrl ? 'ID document uploaded' : 'ID document not uploaded'}</span><span>{trustee.signature?.dataUrl ? 'Signature uploaded' : 'Signature not uploaded'}</span><span>{trustee.passport?.dataUrl ? 'Passport uploaded' : 'Passport not uploaded'}</span></div>
            </article>
          ))}
        </div>
      </DocumentSection>

      <NGODocumentUploads item={item} trustees={trustees} />

      <footer className="ngo-document-footer">
        <span>System record ID: {item.id}</span>
        <span>Created: {item.created_at ? new Date(item.created_at).toISOString() : 'Not available'}</span>
        <span>Generated: {new Date().toISOString()}</span>
      </footer>
      <RegistrationDocuments item={item} isAdmin pendingDocuments={pendingDocuments} onUpload={onDocumentUpload} onLabelChange={onLabelChange} onRemove={onRemove} onSave={onSaveDocuments} uploadBusy={documentUploadBusy} />
    </div>
  );
}

function DocumentSection({ title, children }) {
  return <section className="ngo-document-section"><h3>{title}</h3>{children}</section>;
}

function DocumentFields({ fields, wide = false }) {
  return <div className={`ngo-document-fields ${wide ? 'wide' : ''}`}>{fields.map(([label, value]) => <div className="ngo-document-field" key={label}><strong>{label}</strong><span>{value === null || value === undefined || value === '' ? 'Not provided' : value}</span></div>)}</div>;
}

function NGODocumentUploads({ item, trustees }) {
  const uploads = [];
  trustees.forEach((trustee, index) => {
    [['idDocument', 'ID document'], ['signature', 'Signature'], ['passport', 'Passport photograph']].forEach(([field, label]) => {
      if (index === 0 && field === 'passport') return;
      if (trustee[field]?.dataUrl?.startsWith('data:image/')) uploads.push({ label: `Trustee ${index + 1} - ${label}`, src: trustee[field].dataUrl });
    });
  });
  if (item.payment_slip?.dataUrl?.startsWith('data:image/')) uploads.push({ label: 'Payment slip', src: item.payment_slip.dataUrl });
  if (!uploads.length) return null;

  return (
    <DocumentSection title="5. Supporting documents">
      <div className="ngo-document-upload-grid">
        {uploads.map((upload) => <figure className="ngo-document-upload" key={upload.label}><div className="document-image-frame"><img src={upload.src} alt={upload.label} /><ImageDownloadButton src={upload.src} label={upload.label} /></div><figcaption>{upload.label}</figcaption></figure>)}
      </div>
    </DocumentSection>
  );
}

export default AdminDashboardPage;

function RegistrationDocuments({ item, isAdmin = false, pendingDocuments = [], onUpload, onLabelChange, onRemove, onSave, uploadBusy = false }) {
  const documents = Array.isArray(item.registration_documents) ? item.registration_documents : [];
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedLabel, setEditedLabel] = useState('');

  const startEditing = (index, document) => {
    setEditingIndex(index);
    setEditedLabel(document.label || document.name || '');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditedLabel('');
  };

  const saveEditedLabel = () => {
    const label = editedLabel.trim();
    if (!label || editingIndex === null) return;
    const nextDocuments = documents.map((document, index) => index === editingIndex ? { ...document, label } : document);
    cancelEditing();
    onSave(nextDocuments);
  };

  const deleteDocument = (index, document) => {
    if (!window.confirm(`Delete ${document.label || document.name || 'this document'}?`)) return;
    onSave(documents.filter((_, documentIndex) => documentIndex !== index));
  };

  return (
    <section className="registration-documents-panel">
      <div className="registration-documents-heading">
        <div><h3>Admin document upload section</h3><p>Upload approved files and name each document so the correct label appears on the verification page.</p></div>
        {isAdmin && <div className="document-upload-actions"><label className="document-upload-button">Choose files<input type="file" accept="image/*,.pdf" multiple disabled={uploadBusy} onChange={onUpload} /></label><button type="button" className="document-save-button" disabled={uploadBusy || !pendingDocuments.length} onClick={onSave}>{uploadBusy ? 'Saving...' : 'Save official documents'}</button></div>}
      </div>
      {isAdmin && pendingDocuments.length > 0 && <div className="pending-registration-documents">
        <p className="registration-documents-note">Name each document before saving. Saving will update this application.</p>
        {pendingDocuments.map((document, index) => <div className="pending-registration-document" key={`${document.name}-${index}`}>
          <div className="pending-registration-preview">
            {document.dataUrl && (document.type?.startsWith('image/') || document.dataUrl.startsWith('data:image/')) && <img src={document.dataUrl} alt={`Preview of ${document.name}`} />}
            {document.dataUrl && document.type === 'application/pdf' && <iframe src={document.dataUrl} title={`Preview of ${document.name}`} />}
            {!document.dataUrl && <span>Preview unavailable</span>}
          </div>
          <div className="pending-registration-document-fields">
            <input type="text" value={document.label || ''} onChange={(event) => onLabelChange(index, event.target.value)} placeholder="Name this document (e.g. CAC Certificate)" aria-label={`Label for ${document.name}`} />
            <span title={document.name}>{document.name}</span>
          </div>
          <button type="button" className="pending-document-remove" onClick={() => onRemove(index)} disabled={uploadBusy} aria-label={`Remove ${document.name}`} title="Remove file"><FontAwesomeIcon icon={faTrash} aria-hidden="true" /></button>
        </div>)}
      </div>}
      {documents.length ? <div className="registration-document-list">{documents.map((document, index) => <div className="registration-document-row" key={`${document.name}-${index}`}>
        {editingIndex === index ? <input className="registration-document-name-input" type="text" value={editedLabel} onChange={(event) => setEditedLabel(event.target.value)} aria-label={`Edit name for ${document.name || 'document'}`} autoFocus /> : <a href={document.dataUrl} download={document.name || `registration-document-${index + 1}`} target="_blank" rel="noreferrer"><span>{document.label || document.name || `Registration document ${index + 1}`}</span><FontAwesomeIcon icon={faDownload} aria-hidden="true" /></a>}
        {isAdmin && <div className="registration-document-actions">
          {editingIndex === index ? <>
            <button type="button" className="document-icon-button document-icon-save" onClick={saveEditedLabel} disabled={uploadBusy || !editedLabel.trim()} aria-label="Save file name" title="Save file name"><FontAwesomeIcon icon={faCheck} aria-hidden="true" /></button>
            <button type="button" className="document-icon-button document-icon-cancel" onClick={cancelEditing} disabled={uploadBusy} aria-label="Cancel file name edit" title="Cancel"><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
          </> : <button type="button" className="document-icon-button" onClick={() => startEditing(index, document)} disabled={uploadBusy} aria-label={`Edit name of ${document.label || document.name || 'document'}`} title="Edit file name"><FontAwesomeIcon icon={faPen} aria-hidden="true" /></button>}
          <button type="button" className="document-icon-button document-icon-delete" onClick={() => deleteDocument(index, document)} disabled={uploadBusy} aria-label={`Delete ${document.label || document.name || 'document'}`} title="Delete file"><FontAwesomeIcon icon={faTrash} aria-hidden="true" /></button>
        </div>}
      </div>)}</div> : <p className="registration-documents-empty">No approved documents uploaded yet.</p>}
    </section>
  );
}

function humanizeFieldLabel(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase())
    .replace(/\bId\b/g, 'ID');
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function CollectedFields({ item }) {
  const fields = [];
  const collectFields = (value, label = 'Field', path = 'field') => {
    if (value === null || value === undefined || typeof value !== 'object') {
      fields.push({ label: humanizeFieldLabel(label), value: formatFieldValue(value), path });
      return;
    }

    if (value.dataUrl && String(value.dataUrl).startsWith('data:')) {
      fields.push({ label: humanizeFieldLabel(label), value: 'Image uploaded', path });
      return;
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        fields.push({ label: humanizeFieldLabel(label), value: 'None', path });
        return;
      }
      value.forEach((entry, index) => collectFields(entry, `${label} ${index + 1}`, `${path}-${index}`));
      return;
    }

    Object.entries(value).forEach(([key, child]) => {
      if (key !== 'dataUrl' && key !== 'name' && key !== 'type') {
        collectFields(child, key, `${path}-${key}`);
      }
    });
  };

  collectFields(item);

  return (
    <section className="ngo-document-section collected-fields">
      <div className="collected-fields-heading"><h3>All submitted fields</h3><span>{fields.length} fields</span></div>
      <div className="collected-fields-grid">
        {fields.map((field) => (
          <article className="collected-field-card" key={field.path}>
            <h4>{field.label}</h4>
            <p>{field.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function UploadedImages({ item }) {
  const uploads = [];
  const addImage = (file, label) => {
    if (file?.dataUrl && (file.type?.startsWith('image/') || String(file.dataUrl).startsWith('data:image/'))) {
      uploads.push({ label, src: file.dataUrl });
    }
  };

  (item.proprietors || []).forEach((person, index) => {
    addImage(person.passport, `Proprietor ${index + 1} - Passport`);
    addImage(person.signature, `Proprietor ${index + 1} - Signature`);
    addImage(person.idDocument, `Proprietor ${index + 1} - ID document`);
  });
  if (item.witness) {
    addImage(item.witness.signature, 'Witness - Signature');
    addImage(item.witness.idDocument, 'Witness - ID document');
  }
  [...(item.directors || []), ...(item.shareholders || [])].forEach((person, index) => {
    const group = item.directors?.includes(person) ? 'Director' : 'Shareholder';
    addImage(person.signature, `${group} ${index + 1} - Signature`);
    addImage(person.idDocument, `${group} ${index + 1} - ID document`);
  });
  addImage(item.payment_slip, 'Payment slip');
  if (!uploads.length) return null;

  return (
    <section className="ngo-document-section uploaded-images">
      <h3>Uploaded images</h3>
      <div className="ngo-document-upload-grid">
        {uploads.map((upload, index) => (
          <figure key={`${upload.label}-${index}`} className="ngo-document-upload">
            <div className="document-image-frame"><img src={upload.src} alt={upload.label} /><ImageDownloadButton src={upload.src} label={upload.label} /></div>
            <figcaption>{upload.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function ImageDownloadButton({ src, label }) {
  const fileName = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'uploaded-image'}.png`;
  return <a className="image-download-btn" href={src} download={fileName} aria-label={`Download ${label}`} title={`Download ${label}`}><FontAwesomeIcon icon={faDownload} aria-hidden="true" /></a>;
}
