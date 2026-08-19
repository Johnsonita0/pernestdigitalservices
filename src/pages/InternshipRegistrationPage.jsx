import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { sendInternshipEmail } from '../lib/emailClient';
import '../css/pages/InternshipRegistrationPage.css';

function InternshipRegistrationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',

    // Step 2: Educational Background
    institution: '',
    courseField: '',
    educationLevel: '',
    yearOfStudy: '',

    // Step 3: Experience & Motivation
    previousExperience: '',
    whyInterested: '',
    goals: '',
    skills: [],

    // Step 4: Review & Terms
    agreeTerms: false,
  });

  const totalSteps = 5;

  // Form validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !isValidEmail(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
    }

    if (step === 2) {
      if (!formData.institution.trim()) newErrors.institution = 'Institution is required';
      if (!formData.courseField.trim()) newErrors.courseField = 'Course/Field is required';
      if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
    }

    if (step === 3) {
      if (!formData.previousExperience.trim()) newErrors.previousExperience = 'Please describe your experience';
      if (!formData.whyInterested.trim()) newErrors.whyInterested = 'Please tell us why you are interested';
      if (!formData.goals.trim()) newErrors.goals = 'Please share your goals';
      if (formData.skills.length === 0) newErrors.skills = 'Please select at least one skill you want to learn';
    }

    if (step === 4) {
      if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSkillChange = (skill) => {
    const newSkills = formData.skills.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills: newSkills });
    if (errors.skills) {
      setErrors({ ...errors, skills: '' });
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      const refNumber = `TSV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const payload = {
        reference_number: refNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        institution: formData.institution,
        course_field: formData.courseField,
        education_level: formData.educationLevel,
        year_of_study: formData.yearOfStudy || null,
        previous_experience: formData.previousExperience,
        why_interested: formData.whyInterested,
        goals: formData.goals,
        skills_interested: formData.skills.join(', '),
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      if (!supabase) {
        throw new Error('Database connection is not configured.');
      }

      const { data, error } = await supabase
        .from('internship_applications')
        .insert([payload])
        .select();

      if (error) throw error;

      try {
        await sendInternshipEmail({
          type: 'registration',
          email: formData.email,
          firstName: formData.firstName,
          referenceNumber: refNumber,
          institution: formData.institution,
          courseField: formData.courseField,
        });
      } catch (emailError) {
        console.warn('Registration email not sent:', emailError.message || emailError);
      }

      setSuccessData({
        ...formData,
        refNumber,
        applicationId: data?.[0]?.id || null,
      });

      setShowSuccess(true);
      setCurrentStep(5);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Submission error:', error);

      const fallbackId = `local-${Date.now()}`;
      const localEntry = {
        id: fallbackId,
        reference_number: `TSV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        ...Object.fromEntries(
          Object.entries({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            institution: formData.institution,
            course_field: formData.courseField,
            education_level: formData.educationLevel,
            year_of_study: formData.yearOfStudy || null,
            previous_experience: formData.previousExperience,
            why_interested: formData.whyInterested,
            goals: formData.goals,
            skills_interested: formData.skills.join(', '),
            status: 'pending',
            created_at: new Date().toISOString(),
          }).map(([key, value]) => [key, value ?? null])
        ),
      };

      try {
        if (typeof window !== 'undefined') {
          const storageKey = 'tshirtvilage_local_internship_applications';
          const existing = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
          window.localStorage.setItem(storageKey, JSON.stringify([localEntry, ...existing]));
        }
      } catch (storageError) {
        console.warn('Unable to save local fallback application', storageError);
      }

      setSuccessData({
        ...formData,
        refNumber: localEntry.reference_number,
        applicationId: fallbackId,
      });

      setShowSuccess(true);
      setCurrentStep(5);
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess && successData) {
    return <SuccessStep data={successData} />;
  }

  return (
    <div className="internship-registration-container">
      <div className="registration-wrapper">
        {/* Header */}
        <div className="registration-header">
          <a href="/" className="header-logo" aria-label="Go to home page">
            <img src="/logo/logo1.jpeg" alt="T-Shirts Village" className="logo" />
          </a>
          <h1 className="registration-title">FREE Internship Program Registration</h1>
          <p className="registration-subtitle">
            In Commemoration with our 8th Anniversary
          </p>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`progress-step ${i + 1 <= currentStep ? 'active' : ''} ${
                  i + 1 === currentStep ? 'current' : ''
                }`}
              >
                <span className="step-number">{i + 1}</span>
                <span className="step-label">
                  {i === 0 && 'Personal Info'}
                  {i === 1 && 'Education'}
                  {i === 2 && 'Experience'}
                  {i === 3 && 'Review & Terms'}
                  {i === 4 && 'Success'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form className="registration-form" onSubmit={handleSubmit}>
          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && <Step1PersonalInfo formData={formData} errors={errors} handleInputChange={handleInputChange} />}

          {/* Step 2: Educational Background */}
          {currentStep === 2 && <Step2Education formData={formData} errors={errors} handleInputChange={handleInputChange} />}

          {/* Step 3: Experience & Motivation */}
          {currentStep === 3 && (
            <Step3Experience
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleSkillChange={handleSkillChange}
            />
          )}

          {/* Step 4: Review & Terms */}
          {currentStep === 4 && (
            <Step4Review formData={formData} errors={errors} handleInputChange={handleInputChange} />
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              ← Previous
            </button>

            {currentStep < 4 ? (
              <button type="button" className="btn-primary" onClick={handleNextStep}>
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 1: Personal Information
function Step1PersonalInfo({ formData, errors, handleInputChange }) {
  return (
    <div className="form-step active">
      <h2 className="step-title">Personal Information</h2>
      <p className="step-description">Tell us about yourself</p>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Enter your first name"
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Enter your last name"
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>

        <div className="form-group full-width">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email address"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="e.g., +234 (0) 704 781 6889"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={errors.dateOfBirth ? 'error' : ''}
          />
          {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
        </div>

        <div className="form-group full-width">
          <label htmlFor="address">Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter your residential address"
            className={errors.address ? 'error' : ''}
          />
          {errors.address && <span className="error-message">{errors.address}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Enter your city"
            className={errors.city ? 'error' : ''}
          />
          {errors.city && <span className="error-message">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="state">State *</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="Enter your state"
            className={errors.state ? 'error' : ''}
          />
          {errors.state && <span className="error-message">{errors.state}</span>}
        </div>
      </div>
    </div>
  );
}

// Step 2: Educational Background
function Step2Education({ formData, errors, handleInputChange }) {
  return (
    <div className="form-step active">
      <h2 className="step-title">Educational Background</h2>
      <p className="step-description">Tell us about your education</p>

      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="institution">Institution/School *</label>
          <input
            type="text"
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleInputChange}
            placeholder="e.g., University of Uyo, Technical College"
            className={errors.institution ? 'error' : ''}
          />
          {errors.institution && <span className="error-message">{errors.institution}</span>}
        </div>

        <div className="form-group full-width">
          <label htmlFor="courseField">Course/Field of Study *</label>
          <input
            type="text"
            id="courseField"
            name="courseField"
            value={formData.courseField}
            onChange={handleInputChange}
            placeholder="e.g., Business Administration, Fashion Design"
            className={errors.courseField ? 'error' : ''}
          />
          {errors.courseField && <span className="error-message">{errors.courseField}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="educationLevel">Education Level *</label>
          <select
            id="educationLevel"
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleInputChange}
            className={errors.educationLevel ? 'error' : ''}
          >
            <option value="">Select education level</option>
            <option value="high-school">High School</option>
            <option value="diploma">Diploma</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="vocational">Vocational Training</option>
            <option value="other">Other</option>
          </select>
          {errors.educationLevel && <span className="error-message">{errors.educationLevel}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="yearOfStudy">Current Year of Study</label>
          <select
            id="yearOfStudy"
            name="yearOfStudy"
            value={formData.yearOfStudy}
            onChange={handleInputChange}
          >
            <option value="">Select (optional)</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 3: Experience & Motivation
function Step3Experience({ formData, errors, handleInputChange, handleSkillChange }) {
  const skillOptions = [
    'Practical Workshop Skills',
    'T-Shirts Production Techniques',
    'Equipment Handling',
    'Quality & Finishing',
    'Work Ethics & Teamwork',
  ];

  return (
    <div className="form-step active">
      <h2 className="step-title">Experience & Motivation</h2>
      <p className="step-description">Tell us about your experience and what you want to learn</p>

      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="previousExperience">Previous Work/Training Experience *</label>
          <textarea
            id="previousExperience"
            name="previousExperience"
            value={formData.previousExperience}
            onChange={handleInputChange}
            placeholder="Describe any relevant work or training experience you have..."
            rows="4"
            className={errors.previousExperience ? 'error' : ''}
          ></textarea>
          {errors.previousExperience && (
            <span className="error-message">{errors.previousExperience}</span>
          )}
        </div>

        <div className="form-group full-width">
          <label htmlFor="whyInterested">Why are you interested in this internship? *</label>
          <textarea
            id="whyInterested"
            name="whyInterested"
            value={formData.whyInterested}
            onChange={handleInputChange}
            placeholder="Tell us what attracted you to this internship opportunity..."
            rows="4"
            className={errors.whyInterested ? 'error' : ''}
          ></textarea>
          {errors.whyInterested && (
            <span className="error-message">{errors.whyInterested}</span>
          )}
        </div>

        <div className="form-group full-width">
          <label htmlFor="goals">Your Goals for this Internship *</label>
          <textarea
            id="goals"
            name="goals"
            value={formData.goals}
            onChange={handleInputChange}
            placeholder="What do you hope to achieve during this 6-month internship?..."
            rows="4"
            className={errors.goals ? 'error' : ''}
          ></textarea>
          {errors.goals && <span className="error-message">{errors.goals}</span>}
        </div>

        <div className="form-group full-width">
          <label className="skills-label">Skills You Want to Learn *</label>
          <div className="skills-grid">
            {skillOptions.map((skill) => (
              <div key={skill} className="skill-checkbox">
                <input
                  type="checkbox"
                  id={skill}
                  checked={formData.skills.includes(skill)}
                  onChange={() => handleSkillChange(skill)}
                />
                <label htmlFor={skill}>{skill}</label>
              </div>
            ))}
          </div>
          {errors.skills && <span className="error-message">{errors.skills}</span>}
        </div>
      </div>
    </div>
  );
}

// Step 4: Review & Terms
function Step4Review({ formData, errors, handleInputChange }) {
  return (
    <div className="form-step active">
      <h2 className="step-title">Review & Terms</h2>
      <p className="step-description">Review your information and agree to terms</p>

      <div className="review-section">
        <h3 className="review-subtitle">Program Details</h3>
        <div className="review-grid">
          <div className="review-item">
            <span className="review-label">Program:</span>
            <span className="review-value">Free Internship</span>
          </div>
          <div className="review-item">
            <span className="review-label">Duration:</span>
            <span className="review-value">6 Months</span>
          </div>
          <div className="review-item">
            <span className="review-label">Class Starts:</span>
            <span className="review-value">31st August</span>
          </div>
        </div>
      </div>

      <div className="review-section">
        <h3 className="review-subtitle">Your Information</h3>
        <div className="review-grid">
          <div className="review-item">
            <span className="review-label">Full Name:</span>
            <span className="review-value">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Email:</span>
            <span className="review-value">{formData.email}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Phone:</span>
            <span className="review-value">{formData.phone}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Location:</span>
            <span className="review-value">{formData.city}, {formData.state}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Institution:</span>
            <span className="review-value">{formData.institution}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Skills Interested:</span>
            <span className="review-value">{formData.skills.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="terms-section">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="agreeTerms"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleInputChange}
            className={errors.agreeTerms ? 'error' : ''}
          />
          <label htmlFor="agreeTerms">
            I agree to the terms and conditions and confirm that all information provided is accurate and true.
          </label>
        </div>
        {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
      </div>

      <div className="terms-content">
        <h4>Terms & Conditions</h4>
        <ul>
          <li>This internship program is free and open to eligible applicants.</li>
          <li>Attendance is mandatory. Interns are expected to attend all training sessions.</li>
          <li>Punctuality and professionalism are essential throughout the program.</li>
          <li>All equipment must be handled with care. Damages will be charged to the intern.</li>
          <li>Successful completion will earn you a certificate of internship.</li>
          <li>T-Shirts Village reserves the right to terminate the internship for misconduct.</li>
        </ul>
      </div>
    </div>
  );
}

// Step 5: Success
function SuccessStep({ data }) {
  return (
    <div className="success-container">
      <div className="success-wrapper">
        <div className="success-icon">✓</div>
        <h1 className="success-title">Application Submitted Successfully!</h1>
        <p className="success-subtitle">
          Thank you for applying to our FREE Internship Program
        </p>

        <div className="success-content">
          <div className="success-message">
            <p>
              We have received your application. A confirmation email will be sent to{' '}
              <strong>{data.email}</strong>.
            </p>
          </div>

          <div className="reference-box">
            <p className="reference-label">Your Reference Number:</p>
            <p className="reference-number">{data.refNumber}</p>
            <p className="reference-note">Keep this number for your records and bring it to registration</p>
          </div>

          <div className="barcode-section">
            <p className="barcode-label">Application Details for Registration:</p>
            <div className="barcode-content">
              <div className="barcode-item">
                <strong>Name:</strong> {data.firstName} {data.lastName}
              </div>
              <div className="barcode-item">
                <strong>Email:</strong> {data.email}
              </div>
              <div className="barcode-item">
                <strong>Phone:</strong> {data.phone}
              </div>
              <div className="barcode-item">
                <strong>Reference:</strong> {data.refNumber}
              </div>
            </div>
          </div>

          <div className="success-details">
            <h3>Important Information:</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <div>
                  <strong>Registration Deadline:</strong>
                  <p>27th August 2026</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🎓</span>
                <div>
                  <strong>Classes Start:</strong>
                  <p>31st August 2026</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">⏱️</span>
                <div>
                  <strong>Duration:</strong>
                  <p>6 Months</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">✅</span>
                <div>
                  <strong>Program Status:</strong>
                  <p>Free Internship</p>
                </div>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>You will receive a confirmation email from our team</li>
              <li>Await final review and approval from the admin team</li>
              <li>You'll receive your onboarding confirmation once approved</li>
            </ol>
          </div>

          <div className="contact-info">
            <p>
              <strong>Questions?</strong> Contact us at <a href="tel:+2340704781688">+234 (0) 704 781 6889</a> or{' '}
              <a href="mailto:info@tshirtvilage.com">info@tshirtvilage.com</a>
            </p>
          </div>
        </div>

        <div className="success-actions">
        </div>
      </div>
    </div>
  );
}

export default InternshipRegistrationPage;
