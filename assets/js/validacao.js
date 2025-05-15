document.querySelector('form').addEventListener('submit', function(e) {
  if(grecaptcha.getResponse() === "") {
    e.preventDefault();
    alert("Por favor, marque o reCAPTCHA para enviar o formulário.");
  }
});