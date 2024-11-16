$(document).ready(function() {
    if (window.hasError) {
        $('#errorModal').modal('show');
    }
    if (window.hasSuccess) {
        $('#successModal').modal('show');
    }
});

const togglePassword = (fieldId) => {
    const passwordInput = document.getElementById(fieldId)
    const toggleIcon = document.getElementById(
        fieldId === 'password' ? 'toggleIconPassword' : 'toggleIconConfirmPassword'
    )

    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password'
    toggleIcon.classList.toggle('bi-eye-slash')
    toggleIcon.classList.toggle('bi-eye')
}

const toggleIconVisibility = (fieldId) => {
    const passwordInput = document.getElementById(fieldId)
    const toggleIcon = document.getElementById(
        fieldId === 'password' ? 'toggleIconPassword' : 'toggleIconConfirmPassword'
    )

    toggleIcon.style.display = passwordInput.value ? 'block' : 'none'
}