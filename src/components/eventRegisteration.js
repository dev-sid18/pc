import React, { useState } from "react";
import axios from "axios";
import "./Register.css";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  FaUser, FaIdBadge, FaEnvelope, FaListAlt, FaPhoneAlt,
  FaGraduationCap, FaHome, FaCode, FaPencilAlt,
  FaUserFriends, FaSuitcase, FaStar, FaPaperPlane, FaLock
} from "react-icons/fa";
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si";

const branchCodes = {
  ME: "40", ECE: "31", EE: "21", "CSE(Hindi)": "169", "CSE (Hindi)": "169",
  AIML: "164", "CSE(DS)": "154", "CSE (DS)": "154", "CSE(AIML)": "153",
  "CSE (AIML)": "153", IT: "13", CS: "12", CSIT: "11", "CS IT": "11",
  CSE: "10", CE: "0",
};

const GOOGLE_SITE_KEY = "6LcGdFgtAAAAAF9ghkLpjwuig_Xhzpp1u71MKpO4";
const BACKEND_URL = "https://cin.monu14.me/api/register";

function EventRegisterationForm() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    fullName: "", emailId: "", phoneNumber: "",
    hackerrankProfile: "", leetcodeProfile: "",
    codeforcesProfile: "", codechefProfile: "",
    branch: "", gender: "", hosteller: "",
    studentNumber: "", rollNumber: "", website: "", otherThanCp: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let tempErrors = {};
    const {
      fullName, emailId, phoneNumber, rollNumber, branch, hosteller, studentNumber,
      hackerrankProfile, leetcodeProfile, codeforcesProfile, codechefProfile
    } = formData;

    if (!fullName.trim() || !/^[a-zA-Z\s]+$/.test(fullName)) {
      tempErrors.fullName = "Name must contain only alphabets.";
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      tempErrors.phoneNumber = "Enter valid 10-digit mobile number.";
    }
    if (!studentNumber.trim() || !/^24\d{5,6}$/.test(studentNumber)) {
      tempErrors.studentNumber = "Student No. must start with '24'  and be 7-8 digits.";
    }
    if (!/^[a-zA-Z0-9._%+-]+@akgec\.ac\.in$/.test(emailId)) {
      tempErrors.emailId = "Enter a valid email ending with @akgec.ac.in";
    } else if (studentNumber && !emailId.replace("@akgec.ac.in", "").endsWith(studentNumber)) {
      tempErrors.emailId = "Email ID doesn't match your Student No.";
    }
    if (!rollNumber.trim() || !/^24\d{11}$/.test(rollNumber)) {
      tempErrors.rollNumber = "Roll No. must start with '24'  and be 13 digits.";
    } else if (branch && branchCodes[branch] && !rollNumber.substring(5, 9).includes(branchCodes[branch])) {
      tempErrors.rollNumber = `Roll No. doesn't match selected branch (${branch}).`;
    }
    if (!branch) tempErrors.branch = "Please select your Branch.";
    if (hosteller === "") tempErrors.hosteller = "Please select Residence status.";
    if (!formData.gender) tempErrors.gender = "Please select your Gender.";

    // Strict URL Validation to prevent injection
    const hrRegex = /^https?:\/\/(www\.)?hackerrank\.com\/[a-zA-Z0-9_.-]+(\/)?$/;
    const lcRegex = /^https?:\/\/(www\.)?leetcode\.com\/[a-zA-Z0-9_.-]+(\/)?$/;
    const cfRegex = /^https?:\/\/(www\.)?codeforces\.com\/profile\/[a-zA-Z0-9_.-]+(\/)?$/;
    const ccRegex = /^https?:\/\/(www\.)?codechef\.com\/(users\/)?[a-zA-Z0-9_.-]+(\/)?$/;

    if (!hackerrankProfile.trim()) {
      tempErrors.hackerrankProfile = "HackerRank Profile is required.";
    } else if (!hrRegex.test(hackerrankProfile)) {
      tempErrors.hackerrankProfile = "Must be a valid HackerRank URL (e.g. https://hackerrank.com/username).";
    }

    if (leetcodeProfile.trim() && !lcRegex.test(leetcodeProfile)) {
      tempErrors.leetcodeProfile = "Must be a valid LeetCode URL (e.g. https://leetcode.com/username).";
    }

    if (codeforcesProfile.trim() && !cfRegex.test(codeforcesProfile)) {
      tempErrors.codeforcesProfile = "Must be a valid Codeforces URL (e.g. https://codeforces.com/profile/username).";
    }

    if (codechefProfile.trim() && !ccRegex.test(codechefProfile)) {
      tempErrors.codechefProfile = "Must be a valid CodeChef URL (e.g. https://www.codechef.com/users/username).";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "hosteller") processedValue = value === "yes" ? true : value === "no" ? false : "";
    setFormData((prevState) => ({ ...prevState, [name]: processedValue }));
    if (errors[name]) {
      setErrors((prev) => { const newErr = { ...prev }; delete newErr[name]; return newErr; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (formData.website !== "") {
      setMessage("Registration successful!");
      setIsError(false);
      return;
    }

    const isValid = validateForm();
    if (!isValid) {
      setMessage("Please fix the errors highlighted in red.");
      setIsError(true);
      return;
    }

    if (!executeRecaptcha) {
      setMessage("reCAPTCHA not ready, please try again.");
      setIsError(true);
      return;
    }

    setLoading(true);
    let captchaToken;
    try {
      captchaToken = await executeRecaptcha("register");
      if (!captchaToken) {
        throw new Error("Failed to generate reCAPTCHA token.");
      }
    } catch (err) {
      setLoading(false);
      setMessage("reCAPTCHA verification failed. Please try again.");
      setIsError(true);
      return;
    }

    const { otherThanCp, ...apiPayloadData } = formData;
    const payload = { ...apiPayloadData, captchaToken };

    try {
      await axios.post(BACKEND_URL, payload, { headers: { 'Content-Type': 'application/json' } });
      setLoading(false);
      setMessage("Registration successful!");
      setIsError(false);

      setFormData({
        fullName: "", emailId: "", phoneNumber: "",
        hackerrankProfile: "", leetcodeProfile: "",
        codeforcesProfile: "", codechefProfile: "",
        branch: "", gender: "", hosteller: "",
        studentNumber: "", rollNumber: "", website: "", otherThanCp: ""
      });

    } catch (error) {
      setLoading(false);
      setIsError(true);
      const errorMsg = error.response?.data?.message || "Server Error.";
      if (errorMsg.includes("duplicate") || errorMsg.includes("already exists")) {
        setMessage("User already registered with this Email/Roll No!");
      } else if (errorMsg.includes("captcha") || errorMsg.includes("reCAPTCHA")) {
        setMessage("Captcha verification failed. Please try again.");
      } else {
        setMessage(errorMsg);
      }
    }
  };

  return (
    <div className="formContainer">

      {/* Header Section */}
      <div className="formHeaderSection">
        <h2 style={{ letterSpacing: '1px' }}>
          <span className="highlight" style={{ fontWeight: 'bold' }}>CIN</span>
          <span style={{ color: '#a0a0a0', margin: '0 10px' }}>&gt;&gt;</span>
          PC REGISTRATION
        </h2>
        <p className="description">
          Got the logic? Got the passion for code? Join the CP & DSA family!
        </p>
        <div className="pill-container">
          <div className="line-fade line-left"></div>
          <div className="pill">Open for 2nd Year Students Only</div>
          <div className="line-fade line-right"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text" name="website" value={formData.website}
          onChange={handleChange} style={{ opacity: 0, position: 'absolute', left: '-9999px' }}
          tabIndex="-1" autoComplete="off" maxLength={50}
        />

        {/* SECTION 1: PERSONAL DETAILS */}
        <div className="sectionHeader">
          <FaUserFriends className="sectionIcon" /> PERSONAL DETAILS
        </div>
        <div className="formGrid">
          <div className="formGroup">
            <label className="label">Full Name <span>*</span></label>
            <div className="inputWrapper">
              <FaUser className="inputIcon" />
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={`input ${errors.fullName ? "input-error" : ""}`} placeholder="Enter your full name" maxLength={50} />
            </div>
            {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Student No <span>*</span></label>
            <div className="inputWrapper">
              <FaIdBadge className="inputIcon" />
              <input type="text" name="studentNumber" value={formData.studentNumber} onChange={handleChange} className={`input ${errors.studentNumber ? "input-error" : ""}`} placeholder="Enter your student number" maxLength={8} />
            </div>
            {errors.studentNumber && <span className="error-msg">{errors.studentNumber}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Email <span>*</span></label>
            <div className="inputWrapper">
              <FaEnvelope className="inputIcon" />
              <input type="email" name="emailId" value={formData.emailId} onChange={handleChange} className={`input ${errors.emailId ? "input-error" : ""}`} placeholder="name@student.ac.in" maxLength={50} />
            </div>
            {errors.emailId && <span className="error-msg">{errors.emailId}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Roll No <span>*</span></label>
            <div className="inputWrapper">
              <FaListAlt className="inputIcon" />
              <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className={`input ${errors.rollNumber ? "input-error" : ""}`} placeholder="Enter your roll number" maxLength={13} />
            </div>
            {errors.rollNumber && <span className="error-msg">{errors.rollNumber}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Phone <span>*</span></label>
            <div className="inputWrapper">
              <FaPhoneAlt className="inputIcon" />
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={`input ${errors.phoneNumber ? "input-error" : ""}`} placeholder="10-digit mobile number" maxLength={10} />
            </div>
            {errors.phoneNumber && <span className="error-msg">{errors.phoneNumber}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Branch <span>*</span></label>
            <div className="inputWrapper">
              <FaGraduationCap className="inputIcon" />
              <select name="branch" value={formData.branch} onChange={handleChange} className={`select ${errors.branch ? "input-error" : ""}`}>
                <option value="">Select Branch</option>
                <option value="CSE">CSE</option>
                <option value="CS IT">CS & IT</option>
                <option value="CS">CS</option>
                <option value="IT">IT</option>
                <option value="CSE(AIML)">CSE (AIML)</option>
                <option value="AIML">AIML</option>
                <option value="CSE(DS)">CSE (DS)</option>
                <option value="CSE(Hindi)">CSE (Hindi)</option>
                <option value="ECE">ECE</option>
                <option value="EE">EE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
            </div>
            {errors.branch && <span className="error-msg">{errors.branch}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Gender <span>*</span></label>
            <div className="inputWrapper">
              <FaUser className="inputIcon" />
              <select name="gender" value={formData.gender} onChange={handleChange} className={`select ${errors.gender ? "input-error" : ""}`}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {errors.gender && <span className="error-msg">{errors.gender}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Hosteller <span>*</span></label>
            <div className="inputWrapper">
              <FaHome className="inputIcon" />
              <select name="hosteller" value={formData.hosteller === true ? "yes" : formData.hosteller === false ? "no" : ""} onChange={handleChange} className={`select ${errors.hosteller ? "input-error" : ""}`}>
                <option value="">Select Status</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {errors.hosteller && <span className="error-msg">{errors.hosteller}</span>}
          </div>
        </div>

        {/* SECTION 2: PROFILES */}
        <div className="sectionHeader" style={{ marginTop: '20px' }}>
          <FaSuitcase className="sectionIcon" /> PROFILES
        </div>
        <div className="formGrid">
          <div className="formGroup">
            <label className="label">HackerRank Profile <span>*</span></label>
            <div className="inputWrapper">
              <FaCode className="inputIcon" />
              <input type="text" name="hackerrankProfile" value={formData.hackerrankProfile} onChange={handleChange} className={`input ${errors.hackerrankProfile ? "input-error" : ""}`} placeholder="https://hackerrank.com/username" maxLength={100} />
            </div>
            {errors.hackerrankProfile && <span className="error-msg">{errors.hackerrankProfile}</span>}
          </div>

          <div className="formGroup">
            <label className="label">LeetCode Profile <span className="optionalText" style={{ fontSize: '0.8rem', color: '#707070' }}>(Optional)</span></label>
            <div className="inputWrapper">
              <SiLeetcode className="inputIcon" />
              <input type="text" name="leetcodeProfile" value={formData.leetcodeProfile} onChange={handleChange} className={`input ${errors.leetcodeProfile ? "input-error" : ""}`} placeholder="https://leetcode.com/username" maxLength={100} />
            </div>
            {errors.leetcodeProfile && <span className="error-msg">{errors.leetcodeProfile}</span>}
          </div>

          <div className="formGroup">
            <label className="label">Codeforces Profile <span className="optionalText" style={{ fontSize: '0.8rem', color: '#707070' }}>(Optional)</span></label>
            <div className="inputWrapper">
              <SiCodeforces className="inputIcon" />
              <input type="text" name="codeforcesProfile" value={formData.codeforcesProfile} onChange={handleChange} className={`input ${errors.codeforcesProfile ? "input-error" : ""}`} placeholder="https://codeforces.com/profile/username" maxLength={100} />
            </div>
            {errors.codeforcesProfile && <span className="error-msg">{errors.codeforcesProfile}</span>}
          </div>

          <div className="formGroup">
            <label className="label">CodeChef Profile <span className="optionalText" style={{ fontSize: '0.8rem', color: '#707070' }}>(Optional)</span></label>
            <div className="inputWrapper">
              <SiCodechef className="inputIcon" />
              <input type="text" name="codechefProfile" value={formData.codechefProfile} onChange={handleChange} className={`input ${errors.codechefProfile ? "input-error" : ""}`} placeholder="https://www.codechef.com/users/username" maxLength={100} />
            </div>
            {errors.codechefProfile && <span className="error-msg">{errors.codechefProfile}</span>}
          </div>
        </div>

        {/* SECTION 3: OTHER DETAILS */}
        <div className="sectionHeader" style={{ marginTop: '20px' }}>
          <FaStar className="sectionIcon" /> OTHER DETAILS
        </div>
        <div className="formGrid full-width-grid">
          <div className="formGroup">
            <label className="label">What do you do other than CP? <span>*</span></label>
            <div className="inputWrapper">
              <FaPencilAlt className="inputIcon" />
              <select name="otherThanCp" value={formData.otherThanCp} onChange={handleChange} className={`select ${errors.otherThanCp ? "input-error" : ""}`} required>
                <option value="">Select an option</option>
                <option value="Designing">Designing</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Web Dev">Web Dev</option>
                <option value="App Dev">App Dev</option>
                <option value="Other">Other</option>
                <option value="Nothing, Just CP">Nothing, Just CP</option>
                <option value="I am a beginner">I am a beginner</option>
              </select>
            </div>
            {errors.otherThanCp && <span className="error-msg">{errors.otherThanCp}</span>}
          </div>
        </div>

        <div className="submitContainer">
          <button type="submit" disabled={loading} className="buttonSubmit">
            <FaPaperPlane style={{ marginRight: '8px' }} /> {loading ? "Processing..." : "SUBMIT REGISTRATION"}
          </button>
        </div>

        {message && <p className={`message ${isError ? "error" : "success"}`}>{message}</p>}

      </form>
    </div>
  );
}

export default function EventRegisteration() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={GOOGLE_SITE_KEY}>
      <EventRegisterationForm />
    </GoogleReCaptchaProvider>
  );
}