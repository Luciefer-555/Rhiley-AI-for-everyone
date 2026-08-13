function renderNavbar(section) {
  const links = section.links || [];
  const linkElements = links.map(link => `<a href="#" class="text-gray-700 hover:text-black px-3 py-2">${link}</a>`).join("");
  
  return `<nav class="bg-white shadow-md px-6 py-4">
    <div class="flex justify-between items-center">
      <div class="text-xl font-bold">${section.logo || "Brand"}</div>
      <div class="flex space-x-4">${linkElements}</div>
    </div>
  </nav>`;
}

function renderHero(section) {
  return `<section class="min-h-screen flex flex-col justify-center items-center text-center bg-gray-100 px-6">
    <h1 class="text-4xl font-bold mb-4">${section.title || "Welcome"}</h1>
    <p class="text-lg mb-6 max-w-2xl">${section.subtitle || ""}</p>
    ${section.buttonText ? `<button class="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">${section.buttonText}</button>` : ""}
  </section>`;
}

function renderTextSection(section) {
  return `<section class="py-16 px-6 bg-white">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl font-bold mb-6">${section.title || "Section Title"}</h2>
      <p class="text-lg text-gray-700">${section.content || "Section content here"}</p>
    </div>
  </section>`;
}

function renderCardGrid(section) {
  const columns = section.columns || 3;
  const cards = section.cards || [];
  const columnClass = columns === 2 ? "md:grid-cols-2" : columns === 4 ? "md:grid-cols-4" : "md:grid-cols-3";
  
  const cardElements = cards.map(card => `
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-2">${card.title}</h3>
      <p class="text-gray-600">${card.description || ""}</p>
    </div>
  `).join("");

  return `<section class="py-16 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 ${columnClass} gap-6">${cardElements}</div>
    </div>
  </section>`;
}

function renderFooter(section) {
  return `<footer class="bg-gray-800 text-white py-8 px-6">
    <div class="max-w-6xl mx-auto text-center">
      <p>${section.text || "© 2026"}</p>
    </div>
  </footer>`;
}

module.exports = {
  renderNavbar,
  renderHero,
  renderTextSection,
  renderCardGrid,
  renderFooter
};
