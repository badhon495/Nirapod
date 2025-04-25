import React from 'react';
import './Level.css';

function Level() {
  return (
    <div className="level-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="level-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'auto' }}>
        <div className="level-right">
          <div className="level-box">
            <h2>Urgency Levels</h2>
            <div style={{ color: '#fff', textAlign: 'left' }}>
              <b>High Urgency</b>
              <div style={{ marginBottom: 16 }}>
                These complaints require immediate attention.<br />
                <ul>
                  <li><b>Police:</b> Murder, rape, armed robbery, kidnapping, active violence.</li>
                  <li><b>Fire Service:</b> Ongoing fire, building collapse, people trapped, gas leak.</li>
                  <li><b>City Corporation:</b> Major road blockages, severe waterlogging, large-scale accidents.</li>
                  <li><b>Animal Welfare:</b> Animal cruelty in progress, animal in life-threatening danger.</li>
                </ul>
              </div>
              <b>Medium Urgency</b>
              <div style={{ marginBottom: 16 }}>
                These are important but not life-threatening cases.<br />
                <ul>
                  <li><b>Police:</b> Theft, property damage, missing person (not immediate danger).</li>
                  <li><b>Fire Service:</b> Minor fire (under control), rescue of pets, non-critical hazards.</li>
                  <li><b>City Corporation:</b> Garbage overflow, streetlight outage, potholes causing inconvenience.</li>
                  <li><b>Animal Welfare:</b> Stray animal rescue, injured but stable animals.</li>
                </ul>
              </div>
              <b>Low Urgency</b>
              <div style={{ marginBottom: 16 }}>
                These are non-urgent or routine issues.<br />
                <ul>
                  <li><b>Police:</b> Noise complaints, lost and found, minor disputes.</li>
                  <li><b>Fire Service:</b> Fire safety inspection requests, fire drill scheduling.</li>
                  <li><b>City Corporation:</b> Tree trimming, routine maintenance, minor repairs.</li>
                  <li><b>Animal Welfare:</b> Adoption queries, general animal welfare advice.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Level;
