import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./UpdateProfile.css";

const UpdateProfile = () => {
  const [form, setForm] = useState({
    presentAddress: "",
    permanentAddress: "",
    email: "",
    utilityBillCustomerId: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const identifier = localStorage.getItem("nirapod_identifier");
    if (identifier) {
      axios
        .get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`)
        .then((res) => {
          const { presentAddress, permanentAddress, email, utilityBillCustomerId } = res.data;
          setForm({
            presentAddress: presentAddress || "",
            permanentAddress: permanentAddress || "",
            email: email || "",
            utilityBillCustomerId: utilityBillCustomerId || "",
            newPassword: "",
          });
        })
        .catch(() => setMessage("Failed to load user data."));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const identifier = localStorage.getItem("nirapod_identifier");
    if (!identifier) {
      setMessage("User not found.");
      return;
    }
    try {
      const payload = {
        identifier,
        ...(form.presentAddress.trim() && { presentAddress: form.presentAddress }),
        ...(form.permanentAddress.trim() && { permanentAddress: form.permanentAddress }),
        ...(form.email.trim() && { email: form.email }),
        ...(form.utilityBillCustomerId.trim() && { utilityBillCustomerId: form.utilityBillCustomerId }),
        ...(form.newPassword.trim() && { newPassword: form.newPassword }),
      };
      await axios.post("/api/user/update-profile", payload);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage(err.response?.data || "Failed to update profile.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="update-profile-bg">
        <form className="update-profile-form" onSubmit={handleSubmit}>
          {message && <div className="update-profile-message">{message}</div>}
          <div className="update-profile-row">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Enter new email (optional)"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="update-profile-row">
            <label>Present Address:</label>
            <textarea
              name="presentAddress"
              placeholder="Enter new present address (optional)"
              value={form.presentAddress}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="update-profile-row">
            <label>Permanent Address:</label>
            <textarea
              name="permanentAddress"
              placeholder="Enter new permanent address (optional)"
              value={form.permanentAddress}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="update-profile-row">
            <label>Utility Bill Customer ID:</label>
            <input
              type="text"
              name="utilityBillCustomerId"
              placeholder="Enter new utility bill ID (optional)"
              value={form.utilityBillCustomerId}
              onChange={handleChange}
            />
          </div>
          <div className="update-profile-row">
            <label>New Password:</label>
            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password (optional)"
              value={form.newPassword}
              onChange={handleChange}
            />
          </div>
          <div className="update-profile-submit-row">
            <button type="submit">Update Profile</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UpdateProfile;
