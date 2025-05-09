import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PrivilegedDashboard() {
  const [users, setUsers] = useState([]);
  const affiliation = 'Police Dept'; // TODO: Replace with actual logged-in user's affiliation

  const [search, setSearch] = useState({ nid: '', drivingLicence: '', passport: '' });
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchChange = e => setSearch({ ...search, [e.target.name]: e.target.value });

  const handleSearch = async () => {
    const params = {};
    if (search.nid) params.nid = search.nid;
    if (search.drivingLicence) params.drivingLicence = search.drivingLicence;
    if (search.passport) params.passport = search.passport;
    const res = await axios.get('/api/user/search', { params });
    setSearchResults(res.data);
  };

  useEffect(() => {
    axios.get(`/api/user/department/${encodeURIComponent(affiliation)}`)
      .then(res => setUsers(res.data));
  }, [affiliation]);

  return (
    <div className="privileged-dashboard">
      <h2>{affiliation} Dashboard</h2>
      <h3>Department Users</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Investigate</h3>
      <div>
        <input name="nid" placeholder="NID" value={search.nid} onChange={handleSearchChange} />
        <input name="drivingLicence" placeholder="Driving Licence" value={search.drivingLicence} onChange={handleSearchChange} />
        <input name="passport" placeholder="Passport" value={search.passport} onChange={handleSearchChange} />
        <button onClick={handleSearch}>Search</button>
      </div>
      {searchResults.length > 0 && (
        <table border="1" cellPadding="6" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PrivilegedDashboard;
