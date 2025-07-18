import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
import './Website.css';
import Header from './Header';
import Footer from './Footer';

const EyeIcon = ({ size = 20, color = "currentColor" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = ({ size = 20, color = "currentColor" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

function UserProfilePage() {
    const [personalInfo, setPersonalInfo] = useState({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
    });
    const [personalInfoErrors, setPersonalInfoErrors] = useState({});
    const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
    
    const [shippingAddress, setShippingAddress] = useState('');
    const [shippingAddressError, setShippingAddressError] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    
    const [passwordChange, setPasswordChange] = useState({ newPassword: '', confirmNewPassword: '' });
    const [passwordChangeErrors, setPasswordChangeErrors] = useState({});
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const navigate = useNavigate();
    const { dispatch } = useAuthContext();

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                setPersonalInfo({
                    fullName: user.full_name || '',
                    username: user.username || '',
                    email: user.email || '',
                    phoneNumber: user.phone_number || '',
                });
                setShippingAddress(user.shipping_address || 'No address provided.');
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            navigate('/login');
        }
    }, [navigate]);

    // --- Validation Functions ---
    const validateFullName = (name) => !name ? 'Full Name is required.' : '';
    const validateEmail = (email) => !email ? 'Email is required.' : (!/^\S+@\S+\.\S+$/.test(email) ? 'Invalid email format.' : '');
    const validatePhone = (phone) => !phone ? 'Phone number is required.' : (!/^\d{8}$/.test(phone) ? 'Must be 8 digits.' : '');
    const validateShippingAddress = (address) => !address ? 'Shipping address is required.' : '';
    const validateNewPassword = (pass) => pass.length < 8 ? 'Password must be at least 8 characters.' : '';
    const validateConfirmPassword = (newPass, confirmPass) => newPass !== confirmPass ? 'Passwords do not match.' : '';

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo(prev => ({ ...prev, [name]: value }));
        if (personalInfoErrors[name]) {
            setPersonalInfoErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSavePersonalInfo = async (e) => {
        e.preventDefault();
        const errors = {
            fullName: validateFullName(personalInfo.fullName),
            email: validateEmail(personalInfo.email),
            phoneNumber: validatePhone(personalInfo.phoneNumber),
        };
        setPersonalInfoErrors(errors);
        if (Object.values(errors).some(error => error)) return;

        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.token) return alert('Authentication error. Please log in again.');

        try {
            const updatedData = {
                full_name: personalInfo.fullName,
                email: personalInfo.email,
                phone_number: personalInfo.phoneNumber
            };
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userData.token}` },
                body: JSON.stringify(updatedData),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update user information');
            
            const updatedFields = await response.json();
            const newUserData = { ...userData, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUserData));
            setPersonalInfo({ fullName: newUserData.full_name, username: newUserData.username, email: newUserData.email, phoneNumber: newUserData.phone_number });
            setIsEditingPersonalInfo(false);
            alert('Personal information updated successfully!');
        } catch (error) {
            alert(`Failed to save personal information: ${error.message}`);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        const error = validateShippingAddress(shippingAddress);
        setShippingAddressError(error);
        if (error) return;

        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.token) return alert('Authentication error. Please log in again.');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/update`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userData.token}` },
                body: JSON.stringify({ shipping_address: shippingAddress }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update address');
            const updatedFields = await response.json();
            const newUserData = { ...userData, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUserData));
            setShippingAddress(newUserData.shipping_address);
            setIsEditingAddress(false);
            alert('Shipping address updated successfully!');
        } catch (error) {
            alert(`Failed to save shipping address: ${error.message}`);
        }
    };

    const handlePasswordFormChange = (e) => {
        const { name, value } = e.target;
        setPasswordChange(prev => ({ ...prev, [name]: value }));
        if (passwordChangeErrors[name]) {
            setPasswordChangeErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const errors = {
            newPassword: validateNewPassword(passwordChange.newPassword),
            confirmNewPassword: validateConfirmPassword(passwordChange.newPassword, passwordChange.confirmNewPassword),
        };
        if (errors.confirmNewPassword && !passwordChange.confirmNewPassword) errors.confirmNewPassword = 'Please confirm your new password.';
        
        setPasswordChangeErrors(errors);
        if (Object.values(errors).some(error => error)) return;

        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.token) return alert('Authentication error. Please log in again.');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/update-password`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userData.token}` },
                body: JSON.stringify({ newPassword: passwordChange.newPassword }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to update password.');
            alert('Password updated successfully!');
            setPasswordChange({ newPassword: '', confirmNewPassword: '' });
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    
    const handleBanAccount = async () => {
        if (!window.confirm("Are you sure you want to disable your account? You can contact an admin to restore it.")) return;
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.token) return alert('Authentication error. Please log in again.');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/${userData._id}/ban`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${userData.token}` },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to disable account.');
            alert('Your account has been successfully disabled. You will be logged out.');
            dispatch({ type: 'LOGOUT' });
            navigate('/');
        } catch (error) {
            alert(`Error disabling account: ${error.message}`);
        }
    };

    const errorMessageStyle = { color: '#e74c3c', fontSize: '0.875em', marginTop: '5px' };

    return (
        <>
            <Header />
            <div className="container user-profile-container">
                <h2>My Profile</h2>
                <div className="profile-section">
                    <div className="profile-section-header">
                        <h3>Personal Information</h3>
                        {!isEditingPersonalInfo && <button onClick={() => setIsEditingPersonalInfo(true)} className="btn-edit-profile">Edit</button>}
                    </div>
                    {isEditingPersonalInfo ? (
                        <form onSubmit={handleSavePersonalInfo} className="profile-form" noValidate>
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input type="text" id="fullName" name="fullName" value={personalInfo.fullName} onChange={handlePersonalInfoChange} onBlur={(e) => setPersonalInfoErrors(p => ({...p, fullName: validateFullName(e.target.value)}))} className={personalInfoErrors.fullName ? 'input-error' : ''} />
                                {personalInfoErrors.fullName && <p style={errorMessageStyle}>{personalInfoErrors.fullName}</p>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input type="text" id="username" name="username" value={personalInfo.username} disabled title="Username cannot be changed" className="disabled-input" />
                                <small className="form-text text-muted">Contact support to change your username.</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" name="email" value={personalInfo.email} onChange={handlePersonalInfoChange} onBlur={(e) => setPersonalInfoErrors(p => ({...p, email: validateEmail(e.target.value)}))} className={personalInfoErrors.email ? 'input-error' : ''} />
                                {personalInfoErrors.email && <p style={errorMessageStyle}>{personalInfoErrors.email}</p>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="phoneNumber">Phone Number</label>
                                <input type="tel" id="phoneNumber" name="phoneNumber" value={personalInfo.phoneNumber} onChange={handlePersonalInfoChange} onBlur={(e) => setPersonalInfoErrors(p => ({...p, phoneNumber: validatePhone(e.target.value)}))} pattern="[689]\d{7}" title="Enter a valid Singapore mobile or landline number" className={personalInfoErrors.phoneNumber ? 'input-error' : ''} />
                                {personalInfoErrors.phoneNumber && <p style={errorMessageStyle}>{personalInfoErrors.phoneNumber}</p>}
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-save-profile">Save Changes</button>
                                <button type="button" onClick={() => { setIsEditingPersonalInfo(false); setPersonalInfoErrors({}); }} className="btn-cancel-profile">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-display">
                            <p><strong>Name:</strong> {personalInfo.fullName}</p>
                            <p><strong>Username:</strong> {personalInfo.username}</p>
                            <p><strong>Email:</strong> {personalInfo.email}</p>
                            <p><strong>Phone:</strong> {personalInfo.phoneNumber || 'Not provided'}</p>
                        </div>
                    )}
                </div>

                <div className="profile-section">
                    <div className="profile-section-header"><h3>Shipping Address</h3>{!isEditingAddress && <button onClick={() => setIsEditingAddress(true)} className="btn-edit-profile">Edit</button>}</div>
                    {isEditingAddress ? (
                        <form onSubmit={handleSaveAddress} className="profile-form" noValidate>
                            <div className="form-group">
                                <label htmlFor="shippingAddress">Full Shipping Address</label>
                                <input type="text" id="shippingAddress" name="shippingAddress" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} onBlur={(e) => setShippingAddressError(validateShippingAddress(e.target.value))} className={shippingAddressError ? 'input-error' : ''} placeholder="Block/House No., Street, Unit, Postal Code" />
                                {shippingAddressError && <p style={errorMessageStyle}>{shippingAddressError}</p>}
                            </div>
                            <div className="form-actions"><button type="submit" className="btn-save-profile">Save Address</button><button type="button" onClick={() => { setIsEditingAddress(false); setShippingAddressError(''); }} className="btn-cancel-profile">Cancel</button></div>
                        </form>
                    ) : (<div className="profile-display address-display"><p>{shippingAddress}</p></div>)}
                </div>

                <div className="profile-section">
                    <div className="profile-section-header"><h3>Change Password</h3></div>
                    <form onSubmit={handleChangePassword} className="profile-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-wrapper">
                                <input type={isNewPasswordVisible ? 'text' : 'password'} id="newPassword" name="newPassword" value={passwordChange.newPassword} onChange={handlePasswordFormChange} onBlur={(e) => setPasswordChangeErrors(p => ({...p, newPassword: validateNewPassword(e.target.value)}))} className={passwordChangeErrors.newPassword ? 'input-error' : ''} />
                                <button type="button" className="password-toggle-btn" onClick={() => setIsNewPasswordVisible(p => !p)}>{isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}</button>
                            </div>
                            {passwordChangeErrors.newPassword ? <p style={errorMessageStyle}>{passwordChangeErrors.newPassword}</p> : <small className="form-text text-muted">Must be at least 8 characters long.</small>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmNewPassword">Confirm New Password</label>
                            <div className="password-input-wrapper">
                                <input type={isConfirmPasswordVisible ? 'text' : 'password'} id="confirmNewPassword" name="confirmNewPassword" value={passwordChange.confirmNewPassword} onChange={handlePasswordFormChange} onBlur={(e) => setPasswordChangeErrors(p => ({...p, confirmNewPassword: validateConfirmPassword(passwordChange.newPassword, e.target.value)}))} className={passwordChangeErrors.confirmNewPassword ? 'input-error' : ''} />
                                <button type="button" className="password-toggle-btn" onClick={() => setIsConfirmPasswordVisible(p => !p)}>{isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}</button>
                            </div>
                            {passwordChangeErrors.confirmNewPassword && <p style={errorMessageStyle}>{passwordChangeErrors.confirmNewPassword}</p>}
                        </div>
                        <div className="form-actions"><button type="submit" className="btn-save-profile">Update Password</button></div>
                    </form>
                </div>

                <div className="profile-section">
                    <div className="profile-section-header"><h3>My Orders</h3></div>
                    <div className="profile-display"><p>View your past purchases and track current orders.</p><a href="/order-history" className="btn-link-profile">View Order History</a></div>
                </div>

                <div className="profile-section danger-zone">
                    <div className="profile-section-header"><h3>Account Actions</h3></div>
                    <div className="profile-display">
                        <p>This will disable your account until an admin restores it. Contact us to restore access.</p>
                        <button onClick={handleBanAccount} className="btn-delete-account">Disable My Account</button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default UserProfilePage;