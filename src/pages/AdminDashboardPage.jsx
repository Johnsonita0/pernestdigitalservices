import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAllContactMessages, updateMessageStatus, getAllTestimonials, updateTestimonialStatus } from '../lib/supabaseClient';
import { sendInternshipEmail } from '../lib/emailClient';
import '../css/pages/AdminDashboardPage.css';

function AdminDashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [applications, setApplications] = useState([]);
  const [ngoApplications, setNgoApplications] = useState([]);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [businessApplications, setBusinessApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'messages') {
      const { data } = await getAllContactMessages();
      setMessages(data || []);
    } else if (activeTab === 'testimonials') {
      const { data } = await getAllTestimonials();
      setTestimonials(data || []);
    } else if (activeTab === 'applications') {
      const { data, error } = await supabase
        .from('internship_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) {
        setApplications(data || []);
      }
    } else if (activeTab === 'ngo') {
      const { data, error } = await supabase
        .from('ngo_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setNgoApplications(data || []);
    } else if (activeTab === 'company') {
      const { data, error } = await supabase
        .from('company_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setCompanyApplications(data || []);
    } else {
      const { data, error } = await supabase
        .from('business_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setBusinessApplications(data || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (messageId, newStatus) => {
    if (activeTab === 'messages') {
      await updateMessageStatus(messageId, newStatus);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: newStatus } : msg))
      );
    } else if (activeTab === 'testimonials') {
      await updateTestimonialStatus(messageId, newStatus);
      setTestimonials((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, status: newStatus } : item))
      );
    } else if (activeTab === 'applications') {
      const currentApp = applications.find((app) => app.id === messageId);
      const { error } = await supabase
        .from('internship_applications')
        .update({ status: newStatus })
        .eq('id', messageId);

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
      if (!error) setNgoApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else if (activeTab === 'company') {
      const { error } = await supabase
        .from('company_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      if (!error) setCompanyApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    } else {
      const { error } = await supabase
        .from('business_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      if (!error) setBusinessApplications((items) => items.map((item) => item.id === messageId ? { ...item, status: newStatus } : item));
    }
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
            : businessApplications.filter((app) => filter === 'all' || app.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      new: '#ff8c00',
      read: '#003d99',
      replied: '#4caf50',
      pending: '#f59e0b',
      payment_pending: '#f59e0b',
      payment_submitted: '#168ca3',
      approved: '#10b981',
      rejected: '#ef4444',
    };
    return colors[status] || '#999';
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <a href="/" className="header-logo-link" aria-label="Go to home page">
              <img src="/logo/logo1.jpeg" alt="Logo" className="header-logo" />
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
        <div className="tab-navigation">
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
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>{activeTab === 'messages' ? 'Filter Messages' : activeTab === 'testimonials' ? 'Filter Testimonials' : activeTab === 'applications' ? 'Filter Applications' : activeTab === 'ngo' ? 'Filter NGO Registrations' : activeTab === 'company' ? 'Filter Company Registrations' : 'Filter Business Registrations'}</h3>
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
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({ngoApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({ngoApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({ngoApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : activeTab === 'company' ? (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({companyApplications.length})</button>
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({companyApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({companyApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({companyApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              ) : (
                <>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({businessApplications.length})</button>
                  <button className={`filter-btn ${filter === 'payment_submitted' ? 'active' : ''}`} onClick={() => setFilter('payment_submitted')}>Payment Submitted ({businessApplications.filter((a) => a.status === 'payment_submitted').length})</button>
                  <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved ({businessApplications.filter((a) => a.status === 'approved').length})</button>
                  <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({businessApplications.filter((a) => a.status === 'rejected').length})</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {loading ? (
            <div className="loading">Loading {activeTab === 'messages' ? 'messages' : activeTab === 'ngo' ? 'NGO registrations' : activeTab === 'company' ? 'company registrations' : activeTab === 'business' ? 'business registrations' : 'applications'}...</div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <p>No {activeTab === 'messages' ? 'messages' : activeTab === 'ngo' ? 'NGO registrations' : activeTab === 'company' ? 'company registrations' : activeTab === 'business' ? 'business registrations' : 'applications'} found</p>
            </div>
          ) : (
            <div className="messages-container">
              {/* List */}
              <div className="messages-list">
                {filteredData.map((item) => {
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <div key={item.id} className="list-item-group">
                      <div
                        className={`message-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedItem(isSelected ? null : item)}
                      >
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
                          {activeTab === 'messages' ? (
                            <MessageDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
                          ) : activeTab === 'testimonials' ? (
                            <TestimonialDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
                          ) : activeTab === 'applications' ? (
                            <ApplicationDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
                          ) : activeTab === 'ngo' ? (
                            <NGOApplicationDetail item={item} onStatusChange={handleStatusChange} />
                          ) : activeTab === 'company' ? (
                            <CompanyApplicationDetail item={item} onStatusChange={handleStatusChange} />
                          ) : (
                            <BusinessApplicationDetail item={item} onStatusChange={handleStatusChange} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
        <div className="info-row"><strong>Payment slip:</strong><span>{item.payment_slip?.dataUrl ? <a href={item.payment_slip.dataUrl} target="_blank" rel="noreferrer">View {item.payment_slip.name}</a> : 'Not uploaded'}</span></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
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
        <div className="info-row"><strong>Payment slip:</strong><span>{item.payment_slip?.dataUrl ? <a href={item.payment_slip.dataUrl} target="_blank" rel="noreferrer">View {item.payment_slip.name}</a> : 'Not uploaded'}</span></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
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
        <div className="info-row"><strong>Payment slip:</strong><span>{item.payment_slip?.dataUrl ? <a href={item.payment_slip.dataUrl} target="_blank" rel="noreferrer">View {item.payment_slip.name}</a> : 'Not uploaded'}</span></div>
        <div className="info-row"><strong>Status:</strong><select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}><option value="payment_pending">Payment Pending</option><option value="payment_submitted">Payment Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div className="application-sections">
        {(item.proprietors || []).map((person, index) => <div className="app-section" key={index}><h4>Proprietor {index + 1}: {person.firstName} {person.surname}</h4><p>{person.email} · {person.phone} · {person.occupation}</p><p>{person.idDocument?.dataUrl ? <a href={person.idDocument.dataUrl} target="_blank" rel="noreferrer">View ID</a> : 'ID not uploaded'} · {person.signature?.dataUrl ? <a href={person.signature.dataUrl} target="_blank" rel="noreferrer">View signature</a> : 'Signature not uploaded'} · {person.passport?.dataUrl ? <a href={person.passport.dataUrl} target="_blank" rel="noreferrer">View passport</a> : 'Passport not uploaded'}</p></div>)}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
