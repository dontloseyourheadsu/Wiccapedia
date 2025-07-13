// Global variables
let allGems = [];
let filteredGems = [];
let observer;

// DOM elements
const gemsContainer = document.getElementById("gems-container");
const searchInput = document.getElementById("search-input");
const colorFilter = document.getElementById("color-filter");
const categoryFilter = document.getElementById("category-filter");
const formulaFilter = document.getElementById("formula-filter");
const clearFiltersBtn = document.getElementById("clear-filters");
const gemsCount = document.getElementById("gems-count");
const loading = document.getElementById("loading");
const noResults = document.getElementById("no-results");
const gemModal = document.getElementById("gem-modal");
const addGemModal = document.getElementById("add-gem-modal");
const addGemBtn = document.getElementById("add-gem-btn");
const addGemForm = document.getElementById("add-gem-form");

// Modal elements
const modalClose = document.querySelector(".close");
const modalCloseAdd = document.querySelector(".close-add");
const cancelAddBtn = document.getElementById("cancel-add");

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  await loadGems();
  setupEventListeners();
  setupIntersectionObserver();
  populateFilters();
  renderGems();
});

// Load gems data from JSON
async function loadGems() {
  try {
    const response = await fetch("data/gems-description.json");
    allGems = await response.json();
    filteredGems = [...allGems];
    loading.style.display = "none";
  } catch (error) {
    console.error("Error loading gems:", error);
    loading.innerHTML =
      '<i class="fas fa-exclamation-triangle"></i>Error cargando las gemas';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search and filters
  searchInput.addEventListener("input", debounce(applyFilters, 300));
  colorFilter.addEventListener("change", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
  formulaFilter.addEventListener("change", applyFilters);
  clearFiltersBtn.addEventListener("click", clearFilters);

  // Modal controls
  addGemBtn.addEventListener("click", openAddGemModal);
  modalClose.addEventListener("click", closeGemModal);
  modalCloseAdd.addEventListener("click", closeAddGemModal);
  cancelAddBtn.addEventListener("click", closeAddGemModal);
  addGemForm.addEventListener("submit", handleAddGem);

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === gemModal) closeGemModal();
    if (e.target === addGemModal) closeAddGemModal();
  });

  // Image preview for add gem form
  const gemImageInput = document.getElementById("gem-image");
  gemImageInput.addEventListener("change", handleImagePreview);
}

// Setup intersection observer for lazy loading
function setupIntersectionObserver() {
  const options = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);

          // Add loading animation
          img.addEventListener("load", () => {
            img.style.opacity = "1";
          });
        }
      }
    });
  }, options);
}

// Populate filter options
function populateFilters() {
  const colors = [...new Set(allGems.map((gem) => gem.color))].sort();
  const categories = [...new Set(allGems.map((gem) => gem.category))].sort();
  const formulas = [
    ...new Set(allGems.map((gem) => gem.chemical_formula)),
  ].sort();

  populateSelect(colorFilter, colors);
  populateSelect(categoryFilter, categories);
  populateSelect(formulaFilter, formulas);
}

// Helper function to populate select elements
function populateSelect(selectElement, options) {
  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
  });
}

// Apply filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedColor = colorFilter.value;
  const selectedCategory = categoryFilter.value;
  const selectedFormula = formulaFilter.value;

  filteredGems = allGems.filter((gem) => {
    const matchesSearch =
      !searchTerm || gem.name.toLowerCase().includes(searchTerm);
    const matchesColor = !selectedColor || gem.color === selectedColor;
    const matchesCategory =
      !selectedCategory || gem.category === selectedCategory;
    const matchesFormula =
      !selectedFormula || gem.chemical_formula === selectedFormula;

    return matchesSearch && matchesColor && matchesCategory && matchesFormula;
  });

  renderGems();
}

// Clear all filters
function clearFilters() {
  searchInput.value = "";
  colorFilter.value = "";
  categoryFilter.value = "";
  formulaFilter.value = "";
  filteredGems = [...allGems];
  renderGems();
}

// Render gems grid
function renderGems() {
  gemsContainer.innerHTML = "";
  gemsCount.textContent = filteredGems.length;

  if (filteredGems.length === 0) {
    noResults.classList.add("show");
    return;
  } else {
    noResults.classList.remove("show");
  }

  filteredGems.forEach((gem, index) => {
    const gemCard = createGemCard(gem, index);
    gemsContainer.appendChild(gemCard);
  });
}

// Create gem card element
function createGemCard(gem, index) {
  const card = document.createElement("div");
  card.className = "gem-card";
  card.style.animationDelay = `${index * 0.1}s`;

  // Create image filename from gem name
  const imageFilename = gem.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ñ/g, "n");

  card.innerHTML = `
        <div class="gem-image-container">
            <img class="gem-image" 
                 data-src="images/${imageFilename}.jpg" 
                 alt="${gem.name}"
                 style="opacity: 0; transition: opacity 0.3s ease;">
        </div>
        <div class="gem-info">
            <h3 class="gem-name">${gem.name}</h3>
            <p class="gem-description">${gem.magical_description}</p>
            <div class="gem-properties">
                <span class="gem-property">${gem.color}</span>
                <span class="gem-property">${gem.category}</span>
            </div>
        </div>
    `;

  // Add click event to open modal
  card.addEventListener("click", () => openGemModal(gem, imageFilename));

  // Setup lazy loading for the image
  const img = card.querySelector(".gem-image");
  observer.observe(img);

  return card;
}

// Open gem detail modal
function openGemModal(gem, imageFilename) {
  const modalImage = document.getElementById("modal-gem-image");
  const modalName = document.getElementById("modal-gem-name");
  const modalDescription = document.getElementById("modal-gem-description");
  const modalCategory = document.getElementById("modal-gem-category");
  const modalColor = document.getElementById("modal-gem-color");
  const modalFormula = document.getElementById("modal-gem-formula");

  modalImage.src = `images/${imageFilename}.jpg`;
  modalImage.alt = gem.name;
  modalName.textContent = gem.name;
  modalDescription.textContent = gem.magical_description;
  modalCategory.textContent = gem.category;
  modalColor.textContent = gem.color;
  modalFormula.textContent = gem.chemical_formula;

  gemModal.classList.add("show");
  document.body.style.overflow = "hidden";
}

// Close gem detail modal
function closeGemModal() {
  gemModal.classList.remove("show");
  document.body.style.overflow = "auto";
}

// Open add gem modal
function openAddGemModal() {
  addGemModal.classList.add("show");
  document.body.style.overflow = "hidden";
}

// Close add gem modal
function closeAddGemModal() {
  addGemModal.classList.remove("show");
  document.body.style.overflow = "auto";
  addGemForm.reset();
  document.getElementById("image-preview").innerHTML = "";
}

// Handle image preview in add gem form
function handleImagePreview(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("image-preview");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
}

// Handle add gem form submission
async function handleAddGem(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const gemName = document.getElementById("gem-name").value.trim();
  const gemImage = document.getElementById("gem-image").files[0];
  const magicalDescription = document
    .getElementById("gem-magical-description")
    .value.trim();
  const category = document.getElementById("gem-category").value.trim();
  const color = document.getElementById("gem-color").value.trim();
  const formula = document.getElementById("gem-formula").value.trim();

  // Validate form
  if (
    !gemName ||
    !gemImage ||
    !magicalDescription ||
    !category ||
    !color ||
    !formula
  ) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Create new gem object
  const newGem = {
    name: gemName,
    image: `images/${createImageFilename(gemName)}.jpg`,
    magical_description: magicalDescription,
    category: category,
    color: color,
    chemical_formula: formula,
  };

  try {
    // In a real application, you would upload the image and update the JSON file on the server
    // For this demo, we'll simulate adding to the local data
    await simulateAddGem(newGem, gemImage);

    // Show success message
    alert("¡Gema agregada exitosamente!");
    closeAddGemModal();
  } catch (error) {
    console.error("Error adding gem:", error);
    alert("Error al agregar la gema. Por favor, intenta de nuevo.");
  }
}

// Simulate adding a gem (in real app, this would be a server call)
async function simulateAddGem(gem, imageFile) {
  // Add to local data
  allGems.push(gem);

  // Create image URL for preview (in real app, upload to server)
  const imageUrl = URL.createObjectURL(imageFile);

  // Update the gem image path to use the blob URL for immediate preview
  gem.image = imageUrl;

  // Refresh filters and display
  populateFilters();
  applyFilters();

  // In a real application, you would:
  // 1. Upload the image file to the server
  // 2. Update the gems-description.json file on the server
  // 3. Return the new gem data with the correct image path

  return gem;
}

// Create image filename from gem name
function createImageFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9-]/g, "");
}

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility function to normalize text for searching
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ñ/g, "n");
}

// Error handling for missing images
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      e.target.src =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23ddd"/><text x="150" y="100" text-anchor="middle" dy=".3em" fill="%23999">Imagen no encontrada</text></svg>';
      e.target.style.opacity = "1";
    }
  },
  true
);

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
    .gem-card {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .no-results {
        display: none;
    }
`;
document.head.appendChild(style);
