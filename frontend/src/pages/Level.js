import React from 'react';
import './Level.css';
import logo from '../image/logo.png';

function Level() {
  return (
    <div className="level-bg">
      <div className="level-content-wrapper">
        <div className="level-left">
          <img src={logo} alt="Logo" className="level-logo-img" />
          <div className="level-logo">Nirapod</div>
          <div className="level-tagline">Urgency Guidelines</div>
        </div>
        <div className="level-right">
          <div className="level-box">
            <h2>Urgency Levels</h2>
            
            <div className="urgency-section">
              <div className="urgency-title">High Urgency</div>
              <div className="urgency-content">
                These complaints require immediate attention.
                <ul className="urgency-list">
                  <li><b>Police:</b> Murder, rape, armed robbery, kidnapping, active violence.</li>
                  <li><b>Fire Service:</b> Ongoing fire, building collapse, people trapped, gas leak.</li>
                  <li><b>City Corporation:</b> Major road blockages, severe waterlogging, large-scale accidents.</li>
                  <li><b>Animal Welfare:</b> Animal cruelty in progress, animal in life-threatening danger.</li>
                </ul>
              </div>
            </div>
            
            <div className="urgency-section">
              <div className="urgency-title">Medium Urgency</div>
              <div className="urgency-content">
                These are important but not life-threatening cases.
                <ul className="urgency-list">
                  <li><b>Police:</b> Theft, property damage, missing person (not immediate danger).</li>
                  <li><b>Fire Service:</b> Minor fire (under control), rescue of pets, non-critical hazards.</li>
                  <li><b>City Corporation:</b> Garbage overflow, streetlight outage, potholes causing inconvenience.</li>
                  <li><b>Animal Welfare:</b> Stray animal rescue, injured but stable animals.</li>
                </ul>
              </div>
            </div>
            
            <div className="urgency-section">
              <div className="urgency-title">Low Urgency</div>
              <div className="urgency-content">
                These can be addressed within a reasonable timeframe.
                <ul className="urgency-list">
                  <li><b>Police:</b> Noise complaints, minor disputes, general inquiries.</li>
                  <li><b>Fire Service:</b> Safety inspections, fire safety education, equipment checks.</li>
                  <li><b>City Corporation:</b> Beautification requests, minor maintenance, general suggestions.</li>
                  <li><b>Animal Welfare:</b> General animal care inquiries, adoption requests.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="level-footer">
        <a href="/login" className="footer-link">Login</a>
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
      </footer>
    </div>
  );
}

export default Level;
