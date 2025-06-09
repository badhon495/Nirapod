import React from 'react';
import './FAQ.css';
import logo from '../image/logo.png';

function FAQ() {
  const faqs = [
    {
      question: "How can I recover my password?",
      answer: "Click on the 'Forgotten password?' link on the login page, enter your email, and you will receive a new password in your email inbox. Make sure to check your spam/junk folder if you don't see it in your main inbox."
    },
    {
      question: "I did not receive the OTP. What should I do?",
      answer: "Please check your spam/junk folder first. If you still don't receive the OTP, ensure your email address is correct and try requesting it again. Sometimes there might be a slight delay due to network issues."
    },
    {
      question: "What file types can I upload for NID, Driving License, etc.?",
      answer: "You can upload JPG, PNG, or PDF files. Each file should not exceed the maximum allowed size (usually 5MB). Make sure the documents are clear and readable for faster verification."
    },
    {
      question: "How do I sign up as a privileged user?",
      answer: "Select 'Privileged User' during the signup process and provide the required affiliation details and supporting documents. This includes your professional credentials and any relevant certifications."
    },
    {
      question: "How long does account approval take?",
      answer: "Account approval typically takes 1-48 hours. You will be notified by email once your account is approved or if additional information is needed. Privileged user accounts may take longer due to additional verification steps."
    },
    {
      question: "How do I track my complaint?",
      answer: "After submitting a complaint, you'll receive a unique tracking ID. Use this ID on the 'Track Complaint' page to check the status and any updates from the relevant authorities."
    },
    {
      question: "Can I edit my complaint after submitting?",
      answer: "Once submitted, complaints cannot be directly edited. However, you can contact support or submit additional information through the chat feature if needed."
    },
    {
      question: "What should I do if my complaint is urgent?",
      answer: "Mark your complaint as 'High Priority' when submitting. For immediate emergencies, please contact the relevant emergency services directly (Police: 999, Fire: 199, Ambulance: 199)."
    }
  ];

  return (
    <div className="faq-container">
      <div className="faq-split">
        <div className="faq-left">
          <img src={logo} alt="Nirapod Logo" className="faq-logo-img" />
          <div className="faq-logo">Nirapod</div>
          <div className="faq-tagline">
            Frequently Asked Questions<br />
            Find answers to common queries
          </div>
        </div>
        <div className="faq-right">
          <div className="faq-content-box">
            <h2>❓ FAQ</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <div className="faq-question">
                    <span className="faq-question-icon">Q{index + 1}.</span>
                    {faq.question}
                  </div>
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="faq-footer">
        <a href="/login" className="faq-footer-link">🔐 Login</a>
        <a href="/ReachOut" className="faq-footer-link">📞 Reach Out</a>
        <a href="/contact" className="faq-footer-link">📧 Contact</a>
      </footer>
    </div>
  );
}

export default FAQ;
