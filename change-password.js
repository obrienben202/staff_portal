const API_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // Replace with your Google Apps Script URL

// Load username from session storage when page loads
document.addEventListener('DOMContentLoaded', function() {
    const username = sessionStorage.getItem('username');
    if (!username) {
        alert('Please log in first');
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('username').value = username;
});

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.style.opacity = isPassword ? '1' : '0.5';
    });
});

// Form submission
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    // Clear messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    try {
        // Disable button while processing
        submitBtn.disabled = true;
        submitBtn.textContent = 'Changing Password...';
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'changePassword',
                username: username,
                oldPassword: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successDiv.textContent = '✓ Password changed successfully! Redirecting to login...';
            successDiv.style.display = 'block';
            
            // Clear session and redirect after 2 seconds
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorDiv.textContent = '✗ ' + (data.error || 'Failed to change password');
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Change Password';
        }
    } catch (error) {
        errorDiv.textContent = '✗ Error: ' + error.message;
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
    }
});

function goBackToDashboard() {
    window.location.href = 'index.html';
}