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
    } else {
      const { data, error } = await supabase
        .from('internship_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) {
        setApplications(data || []);
      }
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
    } else {
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
    }
  };

  const filteredData = activeTab === 'messages'
    ? messages.filter((msg) => filter === 'all' || msg.status === filter)
    : activeTab === 'testimonials'
      ? testimonials.filter((item) => filter === 'all' || item.status === filter)
      : applications.filter((app) => filter === 'all' || app.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      new: '#ff8c00',
      read: '#003d99',
      replied: '#4caf50',
      pending: '#f59e0b',
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
              <p>Manage messages, testimonials, and internship applications</p>
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
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>{activeTab === 'messages' ? 'Filter Messages' : activeTab === 'testimonials' ? 'Filter Testimonials' : 'Filter Applications'}</h3>
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
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {loading ? (
            <div className="loading">Loading {activeTab === 'messages' ? 'messages' : 'applications'}...</div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <p>No {activeTab === 'messages' ? 'messages' : 'applications'} found</p>
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
                        ) : (
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
                        )}
                      </div>

                      {isSelected && (
                        <div className="selected-detail-panel">
                          {activeTab === 'messages' ? (
                            <MessageDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
                          ) : activeTab === 'testimonials' ? (
                            <TestimonialDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
                          ) : (
                            <ApplicationDetail item={item} getStatusColor={getStatusColor} onStatusChange={handleStatusChange} />
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

export default AdminDashboardPage;
