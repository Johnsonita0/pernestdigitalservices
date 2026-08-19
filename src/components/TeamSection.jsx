import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedinIn, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import '../css/components/TeamSection.css';

function TeamSection() {
  const team = [
    {
      id: 0,
      name: 'Hon. Akan Eyo',
      role: 'CEO & Founder',
      bio: 'Visionary leader driving T-Shirts Village towards innovation and excellence in the textile industry.',
      image: '/people/ceo.jpg',
      socials: { linkedin: '#', twitter: '#', instagram: '#' }
    }
  ];

  return (
    <section className="team-section" id="team">
      <div className="app-shell">
        <div className="section-header">
          <h2>Meet Our Team</h2>
          <p>Expert professionals dedicated to delivering exceptional results</p>
        </div>

        <div className="team-grid single-team-card">
          {team.map((member) => (
            <div key={member.id} className="team-card">
              <div className="team-image-wrapper">
                <img src={member.image} alt={member.name} className="team-image" />
                <div className="team-overlay">
                  <div className="team-socials">
                    {member.socials.linkedin && (
                      <a href={member.socials.linkedin} title="LinkedIn" aria-label="LinkedIn">
                        <FontAwesomeIcon icon={faLinkedinIn} aria-hidden="true" />
                      </a>
                    )}
                    {member.socials.twitter && (
                      <a href={member.socials.twitter} title="Twitter" aria-label="Twitter">
                        <FontAwesomeIcon icon={faXTwitter} aria-hidden="true" />
                      </a>
                    )}
                    {member.socials.instagram && (
                      <a href={member.socials.instagram} title="Instagram" aria-label="Instagram">
                        <FontAwesomeIcon icon={faInstagram} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="team-info">
                <h3>{member.name}</h3>
                <p className="role">{member.role}</p>
                <p className="bio">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
