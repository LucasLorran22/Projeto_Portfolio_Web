document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll('.cabecalho-menu-item');
    const sections = document.querySelectorAll('section');

    // Função para rolar suavemente para a seção
    menuItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Animação ao rolar para a seção
    function revealSections() {
        const scrollY = window.scrollY + window.innerHeight;
        sections.forEach(section => {
            if (section.offsetTop < scrollY) {
                section.classList.add('visivel');
            }
        });
    }

    window.addEventListener('scroll', revealSections);
    revealSections(); // Para revelar seções já visíveis no carregamento
});
