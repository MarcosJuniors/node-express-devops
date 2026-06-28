// Efeito de Inclinação 3D Interativa para Cards (Tilt Effect)
document.addEventListener('DOMContentLoaded', () => {
  // Configura os listeners nos cards interativos
  initTiltEffect();
});

function initTiltEffect() {
  // Seleciona todos os elementos com a classe .tilt-3d
  const cards = document.querySelectorAll('.tilt-3d');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // coordenada X relativa ao card
      const y = e.clientY - rect.top;  // coordenada Y relativa ao card

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calcular o ângulo de rotação (máximo de 12 graus)
      const rotateX = -((y - centerY) / centerY) * 12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
      card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
      
      // Aplicar brilho neon dinâmico na borda com base no movimento do mouse
      card.style.boxShadow = `0 15px 35px rgba(168, 85, 247, 0.25), 0 0 25px rgba(6, 182, 212, 0.15)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      card.style.transition = 'transform 0.5s ease-out, box-shadow 0.5s ease-out';
      card.style.boxShadow = '';
    });
  });
}

// Exportar para recarregar quando o grid for injetado dinamicamente
window.initTiltEffect = initTiltEffect;
