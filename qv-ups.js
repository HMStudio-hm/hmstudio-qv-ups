// qv-ups.js - HMStudio test for qv/ups v1.0.0

(function() {
    console.log('HMStudio All Features script initialized');
  
    // =============== QUICK VIEW FEATURE ===============
    // src/scripts/quickView.js v2.3.1
(function() {
    console.log('Quick View script initialized');
  
    function getStoreIdFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const storeId = scriptUrl.searchParams.get('storeId');
      return storeId ? storeId.split('?')[0] : null;
    }
  
    function getCurrentLanguage() {
      return document.documentElement.lang || 'ar'; // Default to Arabic if not found
    }
  
    const storeId = getStoreIdFromUrl();
    if (!storeId) {
      console.error('Store ID not found in script URL');
      return;
    }
  
    const config = {
      ...window.HMStudioQuickViewConfig,
      storeId: storeId
    };
  
    console.log('Quick View config:', config);
  
    // Add Analytics object
    const QuickViewStats = {
      async trackEvent(eventType, data) {
        try {
          console.log('Starting Quick View stats tracking for event:', eventType);
          
          const timestamp = new Date();
          const month = timestamp.toISOString().slice(0, 7);
    
          const eventData = {
            storeId,
            eventType,
            timestamp: timestamp.toISOString(),
            month,
            ...data
          };
    
          console.log('Sending Quick View stats data:', eventData);
    
          const response = await fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackQuickViewStats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
          });
    
          const responseData = await response.json();
          console.log('Quick View stats response:', responseData);
    
          if (!response.ok) {
            throw new Error(`Quick View stats tracking failed: ${responseData.error || response.statusText}`);
          }
    
        } catch (error) {
          console.error('Quick View stats tracking error:', error);
        }
      }
    };
  
    async function fetchProductData(productId) {
      console.log('Fetching product data for ID:', productId);
      const url = `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getProductData?storeId=${storeId}&productId=${productId}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch product data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Received product data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching product data:', error);
        throw error;
      }
    }
  
    function createImageGallery(images) {
      console.log('Creating gallery with images:', images);
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'quick-view-gallery';
      galleryContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      `;
  
      // Main image display
      const mainImageContainer = document.createElement('div');
      mainImageContainer.style.cssText = `
        width: 100%;
        height: 300px;
        overflow: hidden;
        border-radius: 8px;
        position: relative;
      `;
  
      const mainImage = document.createElement('img');
      if (images && images.length > 0) {
        mainImage.src = images[0].url;
        mainImage.alt = images[0].alt_text || 'Product Image';
      } else {
        mainImage.src = 'https://via.placeholder.com/400x400?text=No+Image+Available';
        mainImage.alt = 'No Image Available';
      }
      mainImage.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
      `;
      mainImageContainer.appendChild(mainImage);
  
      if (images && images.length > 1) {
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.style.cssText = `
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 5px 0;
        `;
  
        images.forEach((image, index) => {
          const thumbnail = document.createElement('img');
          thumbnail.src = image.thumbnail;
          thumbnail.alt = image.alt_text || `Product Image ${index + 1}`;
          thumbnail.style.cssText = `
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            cursor: pointer;
            border: 2px solid ${index === 0 ? '#4CAF50' : 'transparent'};
          `;
  
          thumbnail.addEventListener('click', () => {
            mainImage.src = image.url;
            thumbnailsContainer.querySelectorAll('img').forEach(thumb => {
              thumb.style.border = '2px solid transparent';
            });
            thumbnail.style.border = '2px solid #4CAF50';
          });
  
          thumbnailsContainer.appendChild(thumbnail);
        });
  
        galleryContainer.appendChild(thumbnailsContainer);
      }
  
      galleryContainer.insertBefore(mainImageContainer, galleryContainer.firstChild);
      return galleryContainer;
    }
  
    function createVariantsSection(productData) {
      const currentLang = getCurrentLanguage();
      const variantsContainer = document.createElement('div');
      variantsContainer.className = 'quick-view-variants';
      variantsContainer.style.cssText = `
        margin-top: 15px;
        padding: 10px 0;
      `;
  
      if (productData.variants && productData.variants.length > 0) {
        // Get unique variants and their values
        const variantAttributes = new Map();
        
        productData.variants.forEach(variant => {
          if (variant.attributes && variant.attributes.length > 0) {
            variant.attributes.forEach(attr => {
              if (!variantAttributes.has(attr.name)) {
                variantAttributes.set(attr.name, {
                  name: attr.name,
                  slug: attr.slug,
                  values: new Set()
                });
              }
              variantAttributes.get(attr.name).values.add(attr.value[currentLang]);
            });
          }
        });
  
        // Create dropdowns for each attribute type
        variantAttributes.forEach(attr => {
          const select = document.createElement('select');
          select.className = 'variant-select';
          select.style.cssText = `
            margin: 5px 0;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
          `;
  
          const labelText = currentLang === 'ar' ? attr.slug : attr.name;
          
          const label = document.createElement('label');
          label.textContent = labelText;
          label.style.cssText = `
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          `;
  
          const placeholderText = currentLang === 'ar' ? `اختر ${labelText}` : `Select ${labelText}`;
          
          let optionsHTML = `<option value="">${placeholderText}</option>`;
          
          Array.from(attr.values).forEach(value => {
            optionsHTML += `<option value="${value}">${value}</option>`;
          });
          
          select.innerHTML = optionsHTML;
  
          select.addEventListener('change', () => {
            console.log('Selected:', attr.name, select.value);
            updateSelectedVariant(productData);
          });
  
          variantsContainer.appendChild(label);
          variantsContainer.appendChild(select);
        });
      }
  
      return variantsContainer;
    }
  
    function createQuantitySelector(currentLang) {
      const quantityContainer = document.createElement('div');
      quantityContainer.style.cssText = `
        margin: 15px 0;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
  
      const quantityLabel = document.createElement('label');
      quantityLabel.textContent = currentLang === 'ar' ? 'الكمية:' : 'Quantity:';
      quantityLabel.style.cssText = `
        font-weight: bold;
        color: #333;
      `;
  
      const quantityWrapper = document.createElement('div');
      quantityWrapper.style.cssText = `
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      `;
  
      // Decrease button
      const decreaseBtn = document.createElement('button');
      decreaseBtn.type = 'button';
      decreaseBtn.textContent = '-';
      decreaseBtn.style.cssText = `
        width: 32px;
        height: 32px;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
        transition: background-color 0.3s ease;
      `;
  
      // Quantity input
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.name = 'quantity';
      quantityInput.id = 'product-quantity';
      quantityInput.min = '1';
      quantityInput.value = '1';
      quantityInput.style.cssText = `
        width: 50px;
        height: 32px;
        border: none;
        border-left: 1px solid #ddd;
        border-right: 1px solid #ddd;
        text-align: center;
        font-size: 14px;
        -moz-appearance: textfield;
      `;
      // Remove spinner arrows
      quantityInput.addEventListener('mousewheel', (e) => e.preventDefault());
  
      // Increase button
      const increaseBtn = document.createElement('button');
      increaseBtn.type = 'button';
      increaseBtn.textContent = '+';
      increaseBtn.style.cssText = `
        width: 32px;
        height: 32px;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
        transition: background-color 0.3s ease;
      `;
  
      // Add event listeners
      decreaseBtn.addEventListener('mouseover', () => {
        decreaseBtn.style.backgroundColor = '#e0e0e0';
      });
      decreaseBtn.addEventListener('mouseout', () => {
        decreaseBtn.style.backgroundColor = '#f5f5f5';
      });
      decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
          quantityInput.value = currentValue - 1;
        }
      });
  
      increaseBtn.addEventListener('mouseover', () => {
        increaseBtn.style.backgroundColor = '#e0e0e0';
      });
      increaseBtn.addEventListener('mouseout', () => {
        increaseBtn.style.backgroundColor = '#f5f5f5';
      });
      increaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        quantityInput.value = currentValue + 1;
      });
  
      // Validate input
      quantityInput.addEventListener('input', () => {
        let value = parseInt(quantityInput.value);
        if (isNaN(value) || value < 1) {
          quantityInput.value = 1;
        }
      });
  
      quantityInput.addEventListener('blur', () => {
        if (quantityInput.value === '') {
          quantityInput.value = 1;
        }
      });
  
      // Assemble quantity selector
      quantityWrapper.appendChild(decreaseBtn);
      quantityWrapper.appendChild(quantityInput);
      quantityWrapper.appendChild(increaseBtn);
      
      quantityContainer.appendChild(quantityLabel);
      quantityContainer.appendChild(quantityWrapper);
  
      return quantityContainer;
    }
  
    function updateSelectedVariant(productData) {
      const form = document.getElementById('product-form');
      if (!form) {
        console.error('Product form not found');
        return;
      }
  
      const currentLang = getCurrentLanguage();
      const selectedValues = {};
  
      // Get all selected values
      form.querySelectorAll('.variant-select').forEach(select => {
        if (select.value) {
          const labelText = select.previousElementSibling.textContent;
          selectedValues[labelText] = select.value;
        }
      });
  
      console.log('Selected values:', selectedValues);
  
      // Find matching variant
      const selectedVariant = productData.variants.find(variant => {
        return variant.attributes.every(attr => {
          const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
          return selectedValues[attrLabel] === attr.value[currentLang];
        });
      });
  
      console.log('Found variant:', selectedVariant);
  
      if (selectedVariant) {
        // Update product ID input
        let productIdInput = form.querySelector('input[name="product_id"]');
        if (!productIdInput) {
          productIdInput = document.createElement('input');
          productIdInput.type = 'hidden';
          productIdInput.name = 'product_id';
          form.appendChild(productIdInput);
        }
        productIdInput.value = selectedVariant.id;
        console.log('Updated product ID to:', selectedVariant.id);
  
        // Update price display
        const priceElement = form.querySelector('#product-price');
        const oldPriceElement = form.querySelector('#product-old-price');
        
        if (priceElement) {
          if (selectedVariant.formatted_sale_price) {
            priceElement.textContent = selectedVariant.formatted_sale_price;
            if (oldPriceElement) {
              oldPriceElement.textContent = selectedVariant.formatted_price;
              oldPriceElement.style.display = 'block';
            }
          } else {
            priceElement.textContent = selectedVariant.formatted_price;
            if (oldPriceElement) {
              oldPriceElement.style.display = 'none';
            }
          }
        }
  
        // Update add to cart button
        const addToCartBtn = form.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
          if (!selectedVariant.unavailable) {
            addToCartBtn.disabled = false;
            addToCartBtn.classList.remove('disabled');
            addToCartBtn.style.opacity = '1';
          } else {
            addToCartBtn.disabled = true;
            addToCartBtn.classList.add('disabled');
            addToCartBtn.style.opacity = '0.5';
          }
        }
      }
    }
  
    async function handleAddToCart(productData) {
      const currentLang = getCurrentLanguage();
      const form = document.getElementById('product-form');
      
      // Get the quantity value
      const quantityInput = form.querySelector('#product-quantity');
      const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
      
      if (isNaN(quantity) || quantity < 1) {
        const message = currentLang === 'ar' 
          ? 'الرجاء إدخال كمية صحيحة'
          : 'Please enter a valid quantity';
        alert(message);
        return;
      }
    
      // Check if product has variants
      if (productData.variants && productData.variants.length > 0) {
        console.log('Product has variants:', productData.variants);
        
        // Get all variant selections
        const selectedVariants = {};
        const missingSelections = [];
        
        form.querySelectorAll('.variant-select').forEach(select => {
          const labelText = select.previousElementSibling.textContent;
          if (!select.value) {
            missingSelections.push(labelText);
          }
          selectedVariants[labelText] = select.value;
        });
    
        // Check if all variants are selected
        if (missingSelections.length > 0) {
          const message = currentLang === 'ar' 
            ? `الرجاء اختيار ${missingSelections.join(', ')}`
            : `Please select ${missingSelections.join(', ')}`;
          alert(message);
          return;
        }
    
        console.log('Selected variants:', selectedVariants);
    
        // Find the matching variant
        const selectedVariant = productData.variants.find(variant => {
          return variant.attributes.every(attr => {
            const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
            return selectedVariants[attrLabel] === attr.value[currentLang];
          });
        });
    
        if (!selectedVariant) {
          console.error('No matching variant found');
          console.log('Selected combinations:', selectedVariants);
          const message = currentLang === 'ar' 
            ? 'هذا المنتج غير متوفر بالمواصفات المختارة'
            : 'This product variant is not available';
          alert(message);
          return;
        }
    
        console.log('Found matching variant:', selectedVariant);
        
        // Update product ID to selected variant ID
        const productIdInput = form.querySelector('input[name="product_id"]');
        if (productIdInput) {
          productIdInput.value = selectedVariant.id;
          console.log('Updated product ID to variant ID:', selectedVariant.id);
        }
      }
    
      // Ensure required hidden inputs exist and are populated
      let productIdInput = form.querySelector('input[name="product_id"]');
      if (!productIdInput) {
        productIdInput = document.createElement('input');
        productIdInput.type = 'hidden';
        productIdInput.name = 'product_id';
        form.appendChild(productIdInput);
      }
      
      // Update quantity in form
      let formQuantityInput = form.querySelector('input[name="quantity"]');
      if (!formQuantityInput) {
        formQuantityInput = document.createElement('input');
        formQuantityInput.type = 'hidden';
        formQuantityInput.name = 'quantity';
        form.appendChild(formQuantityInput);
      }
      formQuantityInput.value = quantity;
    
      // Show loading spinner
      const loadingSpinners = document.querySelectorAll('.add-to-cart-progress');
      loadingSpinners.forEach(spinner => spinner.classList.remove('d-none'));
    
      // Get the form data
      const formData = new FormData(form);
      console.log('Form data being submitted:', {
        product_id: formData.get('product_id'),
        quantity: formData.get('quantity')
      });
    
      // Call Zid's cart function
      try {
        zid.store.cart.addProduct({ 
          formId: 'product-form',
          data: {
            product_id: formData.get('product_id'),
            quantity: formData.get('quantity')
          }
        })
        .then(async function (response) {
          console.log('Add to cart response:', response);
          if (response.status === 'success') {
            // Track successful cart addition
            try {
              await QuickViewStats.trackEvent('cart_add', {
                productId: formData.get('product_id'),
                quantity: parseInt(formData.get('quantity')),
                productName: typeof productData.name === 'object' ? 
                  productData.name[currentLang] : 
                  productData.name
              });
            } catch (trackingError) {
              console.warn('Quick View stats tracking error:', trackingError);
            }
    
            if (typeof setCartBadge === 'function') {
              setCartBadge(response.data.cart.products_count);
            }
            // Close modal immediately without alert
            const modal = document.querySelector('.quick-view-modal');
            if (modal) {
              modal.remove();
            }
          } else {
            console.error('Add to cart failed:', response);
            const errorMessage = currentLang === 'ar' 
              ? response.data.message || 'فشل إضافة المنتج إلى السلة'
              : response.data.message || 'Failed to add product to cart';
            alert(errorMessage);
          }
        })
        .catch(function(error) {
          console.error('Error adding to cart:', error);
          const errorMessage = currentLang === 'ar' 
            ? 'حدث خطأ أثناء إضافة المنتج إلى السلة'
            : 'Error occurred while adding product to cart';
          alert(errorMessage);
        })
        .finally(function() {
          // Hide loading spinner
          loadingSpinners.forEach(spinner => spinner.classList.add('d-none'));
        });
      } catch (error) {
        console.error('Critical error in add to cart:', error);
        loadingSpinners.forEach(spinner => spinner.classList.add('d-none'));
      }
    }
  
  
    async function displayQuickViewModal(productData) {
      const currentLang = getCurrentLanguage();
      console.log('Displaying Quick View modal for product:', productData);
  
      // Track modal open event
      try {
        await QuickViewStats.trackEvent('modal_open', {
          productId: productData.id,
          productName: typeof productData.name === 'object' ? 
            productData.name[currentLang] : 
            productData.name
        });
      } catch (trackingError) {
        console.warn('Quick View stats tracking error:', trackingError);
      }
      
      const existingModal = document.querySelector('.quick-view-modal');
      if (existingModal) {
        existingModal.remove();
      }
  
      // Add viewport meta tag if it doesn't exist
      if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
        document.head.appendChild(viewport);
      }
  
      const modal = document.createElement('div');
      modal.className = 'quick-view-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 16px;
      `;
  
      const content = document.createElement('div');
      content.className = 'quick-view-content';
      content.style.cssText = `
        background-color: white;
        border-radius: 12px;
        width: 95%;
        max-height: 90vh;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        max-width: 1000px;
        overflow: hidden;
      `;
  
      // Create form
      const form = document.createElement('form');
      form.id = 'product-form';
      form.style.cssText = `
        display: flex;
        width: 100%;
        height: 100%;
        flex-direction: column;
        overflow-y: auto;
      `;
  
      // Add media query styles
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @media screen and (min-width: 768px) {
          .quick-view-form {
            flex-direction: row !important;
            overflow: hidden !important;
          }
          .quick-view-gallery {
            width: 50% !important;
            border-bottom: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding-top: 40px !important;
          }
          .quick-view-details {
            width: 50% !important;
            padding-top: 40px !important;
          }
          .quick-view-gallery img {
            margin: 0 auto !important;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
  
      form.className = 'quick-view-form';
      content.appendChild(form);
  
      // Left side - Image Gallery
      const gallerySection = document.createElement('div');
      gallerySection.className = 'quick-view-gallery';
      gallerySection.style.cssText = `
        width: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
  
      // Create and append the image gallery
      if (productData.images && productData.images.length > 0) {
        const gallery = createImageGallery(productData.images);
        gallery.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          width: 100%;
        `;
        gallerySection.appendChild(gallery);
      }
  
      // Right side - Product Details
      const detailsSection = document.createElement('div');
      detailsSection.className = 'quick-view-details';
      detailsSection.style.cssText = `
        width: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;
        text-align: ${currentLang === 'ar' ? 'right' : 'left'};
        direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'};
      `;
  
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: ${currentLang === 'ar' ? 'auto' : '12px'};
        left: ${currentLang === 'ar' ? '12px' : 'auto'};
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s;
        z-index: 10;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        &:hover {
          background-color: #f3f4f6;
          color: #000;
        }
      `;
      closeBtn.addEventListener('click', () => modal.remove());
      content.appendChild(closeBtn);
  
      // Create and append the title
      const title = document.createElement('h2');
      title.className = 'quick-view-title';
      title.textContent = productData.name[currentLang] || productData.name;
      title.style.cssText = `
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        line-height: 1.3;
      `;
      detailsSection.appendChild(title);
  
      // Add rating if available
      if (productData.rating) {
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'quick-view-rating';
        ratingContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        `;
  
        const starRating = document.createElement('div');
        starRating.style.cssText = `
          display: flex;
          align-items: center;
        `;
  
        const fullStars = Math.floor(productData.rating.average);
        const remainingStars = 5 - fullStars;
  
        for (let i = 0; i < fullStars; i++) {
          const star = document.createElement('span');
          star.textContent = '★';
          star.style.color = '#fbbf24';
          starRating.appendChild(star);
        }
  
        for (let i = 0; i < remainingStars; i++) {
          const star = document.createElement('span');
          star.textContent = '☆';
          star.style.color = '#e5e7eb';
          starRating.appendChild(star);
        }
  
        const ratingText = document.createElement('span');
        ratingText.textContent = `(${productData.rating.average.toFixed(1)})`;
        ratingText.style.color = '#6b7280';
  
        ratingContainer.appendChild(starRating);
        ratingContainer.appendChild(ratingText);
        detailsSection.appendChild(ratingContainer);
      }
  
      // Add price display elements
      const priceContainer = document.createElement('div');
      priceContainer.className = 'quick-view-price-container';
      priceContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      `;
  
      const currencySymbol = currentLang === 'ar' ? 'ر.س' : 'SAR';
  
      if (productData.sale_price) {
        const salePrice = document.createElement('span');
        salePrice.className = 'quick-view-sale-price';
        salePrice.style.cssText = `
          font-size: 24px;
          font-weight: 700;
          color: #059669;
        `;
        salePrice.textContent = `${productData.sale_price} ${currencySymbol}`;
  
        const originalPrice = document.createElement('span');
        originalPrice.className = 'quick-view-original-price';
        originalPrice.style.cssText = `
          text-decoration: line-through;
          color: #6b7280;
          font-size: 16px;
        `;
        originalPrice.textContent = `${productData.price} ${currencySymbol}`;
  
        priceContainer.appendChild(salePrice);
        priceContainer.appendChild(originalPrice);
      } else {
        const price = document.createElement('span');
        price.className = 'quick-view-current-price';
        price.style.cssText = `
          font-size: 24px;
          font-weight: 700;
          color: #059669;
        `;
        price.textContent = `${productData.price} ${currencySymbol}`;
        priceContainer.appendChild(price);
      }
  
      detailsSection.appendChild(priceContainer);
  
      // Add short description
      if (productData.short_description && productData.short_description[currentLang]) {
        const description = document.createElement('p');
        description.className = 'quick-view-description';
        description.style.cssText = `
          margin-bottom: 20px;
          line-height: 1.5;
          color: #4b5563;
          font-size: 14px;
        `;
        description.textContent = productData.short_description[currentLang];
        detailsSection.appendChild(description);
      }
  
      // Add variants section if product has variants
      if (productData.variants && productData.variants.length > 0) {
        const variantsSection = createVariantsSection(productData);
        variantsSection.style.cssText += `
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        `;
        detailsSection.appendChild(variantsSection);
      }
  
      // Add quantity selector
      const quantitySelector = createQuantitySelector(currentLang);
      quantitySelector.className = 'quick-view-quantity-selector';
      quantitySelector.style.cssText = `
        display: flex;
        justify-content: center;
        width: 100%;
      `;
  
      // Remove the quantity label
      const quantityLabel = quantitySelector.querySelector('label');
      if (quantityLabel) {
        quantityLabel.remove();
      }
  
      // Style the quantity input and buttons
      const quantityWrapper = quantitySelector.querySelector('div');
      if (quantityWrapper) {
        quantityWrapper.style.cssText = `
          display: flex;
          width: 100%;
          height: 48px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        `;
  
        const decreaseBtn = quantityWrapper.querySelector('button:first-child');
        const increaseBtn = quantityWrapper.querySelector('button:last-child');
        const quantityInput = quantityWrapper.querySelector('input');
  
        if (decreaseBtn && increaseBtn && quantityInput) {
          const buttonStyle = `
            width: 48px;
            height: 100%;
            background-color: #f3f4f6;
            border: none;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          decreaseBtn.style.cssText = buttonStyle;
          increaseBtn.style.cssText = buttonStyle;
  
          quantityInput.style.cssText = `
            flex: 1;
            height: 100%;
            border: none;
            text-align: center;
            font-size: 16px;
            -moz-appearance: textfield;
          `;
        }
      }
  
      // Add buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'quick-view-purchase-controls';
      buttonsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: auto;
        padding-top: 20px;
      `;
  
      // Add to Cart button
      const addToCartBtn = document.createElement('button');
      addToCartBtn.textContent = currentLang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart';
      addToCartBtn.className = 'btn btn-primary add-to-cart-btn quick-view-add-to-cart-btn';
      addToCartBtn.type = 'button';
      addToCartBtn.style.cssText = `
        width: 100%;
        padding: 12px 20px;
        background-color: #059669;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 48px;
        &:hover {
          background-color: #047857;
        }
      `;
  
      // Add loading spinner
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'add-to-cart-progress d-none';
      loadingSpinner.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
      `;
      addToCartBtn.appendChild(loadingSpinner);
  
      addToCartBtn.addEventListener('click', () => {
        handleAddToCart(productData);
      });
  
      // Move quantitySelector inside buttonsContainer
      buttonsContainer.appendChild(quantitySelector);
      buttonsContainer.appendChild(addToCartBtn);
      detailsSection.appendChild(buttonsContainer);
  
      // Add hidden inputs
      const productIdInput = document.createElement('input');
      productIdInput.type = 'hidden';
      productIdInput.id = 'product-id';
      productIdInput.name = 'product_id';
      productIdInput.value = productData.id;
      form.appendChild(productIdInput);
  
      // Assemble the modal
      form.appendChild(gallerySection);
      form.appendChild(detailsSection);
      modal.appendChild(content);
  
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
  
      document.body.appendChild(modal);
      
      // Initialize price display
      if (productData.selected_product) {
        updateSelectedVariant(productData);
      }
  
      console.log('Quick View modal added to DOM');
    }
    
    async function openQuickView(productId) {
      console.log('Opening Quick View for product ID:', productId);
      try {
        const productData = await fetchProductData(productId);
        displayQuickViewModal(productData);
      } catch (error) {
        console.error('Failed to open quick view:', error);
      }
    }
  
    function addQuickViewButtons() {
      console.log('Adding Quick View buttons');
      const productCards = document.querySelectorAll('.product-item.position-relative');
      console.log('Found product cards:', productCards.length);
      
      productCards.forEach(card => {
        if (card.querySelector('.quick-view-btn')) {
          console.log('Quick View button already exists for a product, skipping');
          return;
        }
  
        // Get product ID from data-wishlist-id
        const productId = card.querySelector('[data-wishlist-id]')?.getAttribute('data-wishlist-id');
        
        if (productId) {
          console.log('Found product ID:', productId);
          
          // Find the button container - it's the div with text-align: center
          const buttonContainer = card.querySelector('div[style*="text-align: center"]');
  if (buttonContainer) {
    // Update the button container styles to ensure horizontal alignment
    buttonContainer.className = 'hmstudio-buttons-container';  // Add this class
  buttonContainer.style.cssText = `
      text-align: center;
      display: inline-flex;  
      align-items: center;
      justify-content: center;
      gap: 5px;
  `;
  
    const button = document.createElement('button');
    button.className = 'quick-view-btn';
    button.style.cssText = `
      width: 35px;
      height: 35px;
      padding: 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #ffffff;
      cursor: pointer;
      transition: background-color 0.3s ease;
      display: inline-flex;  /* Changed to inline-flex */
      align-items: center;
      justify-content: center;
      vertical-align: middle;  /* Added this */
    `;
  
            // Add eye icon using SVG
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            `;
  
            button.addEventListener('mouseover', () => {
              button.style.backgroundColor = '#f0f0f0';
            });
  
            button.addEventListener('mouseout', () => {
              button.style.backgroundColor = '#ffffff';
            });
  
            button.addEventListener('click', (e) => {
              e.preventDefault();
              console.log('Quick View button clicked for product ID:', productId);
              openQuickView(productId);
            });
  
            // Insert before the first button in the container
            const firstButton = buttonContainer.querySelector('a, button');
            if (firstButton) {
              buttonContainer.insertBefore(button, firstButton);
            } else {
              buttonContainer.appendChild(button);
            }
          }
        }
      });
    }
  
    // Initial setup
    console.log('Running initial setup');
    addQuickViewButtons();
  
    // Re-apply Quick View buttons when the page content changes
    const observer = new MutationObserver(() => {
      console.log('Page content changed, re-applying Quick View buttons');
      addQuickViewButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('MutationObserver set up');
  
    // Expose necessary functions
    window.HMStudioQuickView = {
      openQuickView: openQuickView
    };
    console.log('HMStudioQuickView object exposed to window');
  })();
  
    // =============== UPSELL FEATURE ===============
    // src/scripts/upsell.js v2.4.7
// HMStudio Upsell Feature

(function() {

    // Add this style block first
    const styleTag = document.createElement('style');
    styleTag.textContent = `
    @font-face {font-family: "Teshrin AR+LT Bold"; src: url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.eot"); 
  src: url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.woff") format("woff"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.svg#Teshrin AR+LT Bold") format("svg"); 
  }
      /* Base modal styles */
      .hmstudio-upsell-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    
      .hmstudio-upsell-content {
        background: white;
        padding: 40px;
        border-radius: 12px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        transform: translateY(20px);
        transition: transform 0.3s ease;
      }
    
      /* Responsive sizing based on product count */
      .hmstudio-upsell-content:has(.hmstudio-upsell-products > *:only-child) {
        max-width: 620px; /* For single product */
      }
  
      .hmstudio-upsell-content:has(.hmstudio-upsell-products > *:first-child:nth-last-child(2)) {
        max-width: 750px; /* For two products */
      }
  
      .hmstudio-upsell-content:has(.hmstudio-upsell-products > *:first-child:nth-last-child(3)) {
        max-width: 1000px; /* For three products */
      }
    
      .hmstudio-upsell-header {
        text-align: center;
        margin-bottom: 30px;
      }
    
      .hmstudio-upsell-title {
        font-size: 28px;
        margin-bottom: 10px;
        color: #333;
      }
    
      .hmstudio-upsell-subtitle {
        font-size: 18px;
        color: #666;
        margin: 0;
      }
    
      .hmstudio-upsell-main {
        display: flex;
        gap: 30px;
        align-items: flex-start;
      }
    
      .hmstudio-upsell-sidebar {
        width: 250px;
        flex-shrink: 0;
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        position: sticky;
        top: 20px;
      }
    
      .hmstudio-upsell-products {
        display: grid;
        grid-template-columns: repeat(auto-fit, 180px);
        gap: 20px;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
      }
    
      /* Product Card Styles */
      .hmstudio-upsell-product-card {
        border: 1px solid #eee;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2) !important;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
    
      /* Product Form Styles */
      .hmstudio-upsell-product-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    
      .hmstudio-upsell-product-image-container {
        width: 100%;
        margin-bottom: 15px;
      }
    
      .hmstudio-upsell-product-image {
        width: 100%;
        height: 150px;
        object-fit: contain;
        margin-bottom: 10px;
      }
    
      .hmstudio-upsell-product-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    
      .hmstudio-upsell-product-title {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin: 0;
        min-height: 40px;
        text-align: center;
      }
    
      .hmstudio-upsell-product-price {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--theme-primary, #00b286);
        font-weight: bold;
        justify-content: center;
        margin-bottom: 5px;
      }
    
      /* Variants Styles */
      .hmstudio-upsell-variants {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        margin: 5px 0;
      }
    
      .hmstudio-upsell-variants select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        color: #333;
      }
    
      .hmstudio-upsell-variants label {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
    
      /* Product Controls Styles */
      .hmstudio-upsell-product-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 5px;
      }
    
      .hmstudio-upsell-product-quantity {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        margin: 10px auto;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 2px;
        width: fit-content;
      }
    
      .hmstudio-upsell-quantity-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #666;
        padding: 0;
      }
    
      .hmstudio-upsell-product-quantity input {
        width: 40px;
        border: none;
        text-align: center;
        font-size: 14px;
        padding: 0;
        -moz-appearance: textfield;
        background: transparent;
      }
    
      .hmstudio-upsell-product-quantity input::-webkit-outer-spin-button,
      .hmstudio-upsell-product-quantity input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    
      /* Add to Cart Button */
      .addToCartBtn {
        width: 100%;
        padding: 8px 15px;
        background: var(--theme-primary, #00b286);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: opacity 0.3s;
        font-size: 14px;
      }
    
      .addToCartBtn:hover {
        opacity: 0.9;
      }
    
      /* Mobile Styles */
      @media (max-width: 768px) {
        .hmstudio-upsell-content {
          padding: 20px;
          width: 100%;
          height: 100vh;
          border-radius: 0;
          margin: 0;
        }
    
        .hmstudio-upsell-main {
          flex-direction: column;
          gap: 20px;
        }
    
        .hmstudio-upsell-sidebar {
          width: 100%;
          position: static;
          order: 2;
        }
    
        .hmstudio-upsell-products {
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          order: 1;
        }
    
        .hmstudio-upsell-title {
          font-size: 20px;
        }
    
        .hmstudio-upsell-subtitle {
          font-size: 14px;
        }
      }
    
      /* Small Mobile Styles */
      @media (max-width: 480px) {
        .hmstudio-upsell-content {
          padding: 20px;
          width: 100%;
          height: 100vh;
          border-radius: 15px;
          margin: 10px;
        }
    
        .hmstudio-upsell-products {
          flex-direction: column;
          align-items: center !important;
          display: flex !important;
        }
    
        .hmstudio-upsell-product-card {
          width: 100%;
          display: flex;
          padding: 10px;
        }
    
        .hmstudio-upsell-product-form {
          flex-direction: row;
          align-items: center !important;
          width: 100% !important;
          display: flex;
        }
    
        .hmstudio-upsell-product-image-container {
          width: 100px !important;
          height: 100px !important;
          overflow: unset !important;
          margin-bottom: 0;
          margin-right: 15px;
        }
    
        .hmstudio-upsell-product-image {
          height: 100%;
          margin-bottom: 0;
        }
    
        .hmstudio-upsell-product-content {
          flex: 1;
          gap: 8px;
          text-align: left;
        }
    
        .hmstudio-upsell-product-title {
          min-height: auto;
          font-size: 14px !important;
          text-align: start;
          margin-bottom: 0 !important;
        }
    
        .hmstudio-upsell-product-price {
          justify-content: flex-start !important;
          margin-top: 4px;
        }
    
        .hmstudio-upsell-variants {
          margin: 5px 0;
        }
    
        .hmstudio-upsell-variants select {
          padding: 6px;
          font-size: 12px;
        }
    
        .hmstudio-upsell-variants label {
          font-size: 12px;
          text-align: left;
        }
    
        .hmstudio-upsell-product-controls {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
        }
    
        .hmstudio-upsell-product-quantity {
          margin: 0;
        }
    
        .addToCartBtn {
          flex: 1;
          max-width: 120px;
          padding: 6px 12px;
          font-size: 12px;
        }
      }
    `;
    
    // Add the style tag to the document head
    document.head.appendChild(styleTag);
    
      console.log('Upsell script initialized');
    
      function getStoreIdFromUrl() {
        const scriptTag = document.currentScript;
        const scriptUrl = new URL(scriptTag.src);
        const storeId = scriptUrl.searchParams.get('storeId');
        return storeId ? storeId.split('?')[0] : null;
      }
    
      function getCampaignsFromUrl() {
        const scriptTag = document.currentScript;
        const scriptUrl = new URL(scriptTag.src);
        const campaignsData = scriptUrl.searchParams.get('campaigns');
        
        if (!campaignsData) {
          console.log('No campaigns data found in URL');
          return [];
        }
      
        try {
          const decodedData = atob(campaignsData);
          const parsedData = JSON.parse(decodedData);
          
          return parsedData.map(campaign => ({
            ...campaign,
            textSettings: {
              titleAr: campaign.textSettings?.titleAr || '',
              titleEn: campaign.textSettings?.titleEn || '',
              subtitleAr: campaign.textSettings?.subtitleAr || '',
              subtitleEn: campaign.textSettings?.subtitleEn || ''
            }
          }));
        } catch (error) {
          console.error('Error parsing campaigns data:', error);
          return [];
        }
      }
    
      function getCurrentLanguage() {
        return document.documentElement.lang || 'ar';
      }
    
      const storeId = getStoreIdFromUrl();
      if (!storeId) {
        console.error('Store ID not found in script URL');
        return;
      }
    
      const UpsellManager = {
        campaigns: getCampaignsFromUrl(),
        currentModal: null,
        activeTimeout: null,
    
        async fetchProductData(productId) {
          console.log('Fetching product data for ID:', productId);
          const url = `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getProductData?storeId=${storeId}&productId=${productId}`;
          
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch product data: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Received product data:', data);
            return data;
          } catch (error) {
            console.error('Error fetching product data:', error);
            throw error;
          }
        },
    
        async createProductCard(product, currentCampaign) {
          try {
            const fullProductData = await this.fetchProductData(product.id);
            console.log('Full product data:', fullProductData);
        
            if (!fullProductData) {
              throw new Error('Failed to fetch full product data');
            }
        
            const currentLang = getCurrentLanguage();
            const isRTL = currentLang === 'ar';
        
            let productName = fullProductData.name;
            if (typeof productName === 'object') {
              productName = currentLang === 'ar' ? productName.ar : productName.en;
            }
        
            // Create main card container
            const card = document.createElement('div');
            card.className = 'hmstudio-upsell-product-card';
        
            // Create form
            const form = document.createElement('form');
            form.id = `product-form-${fullProductData.id}`;
            form.className = 'hmstudio-upsell-product-form';
        
            // Product ID input
            const productIdInput = document.createElement('input');
            productIdInput.type = 'hidden';
            productIdInput.id = 'product-id';
            productIdInput.name = 'product_id';
            productIdInput.value = fullProductData.selected_product?.id || fullProductData.id;
            form.appendChild(productIdInput);
        
            // Image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'hmstudio-upsell-product-image-container';
        
            const productImage = document.createElement('img');
            productImage.className = 'hmstudio-upsell-product-image';
            productImage.src = fullProductData.images?.[0]?.url || product.thumbnail;
            productImage.alt = productName;
            imageContainer.appendChild(productImage);
        
            // Product content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'hmstudio-upsell-product-content';
        
            // Title
            const title = document.createElement('h5');
            title.className = 'hmstudio-upsell-product-title';
            title.textContent = productName;
            contentContainer.appendChild(title);
        
            // Price container
            const priceContainer = document.createElement('div');
            priceContainer.className = 'hmstudio-upsell-product-price';
        
            const currentPrice = document.createElement('span');
            const oldPrice = document.createElement('span');
            oldPrice.style.textDecoration = 'line-through';
            oldPrice.style.color = '#999';
            oldPrice.style.fontSize = '0.9em';
        
            const currencySymbol = currentLang === 'ar' ? 'ر.س' : 'SAR';
        
            if (fullProductData.formatted_sale_price) {
              const priceValue = fullProductData.formatted_sale_price.replace(' ر.س', '').replace('SAR', '').trim();
              const oldPriceValue = fullProductData.formatted_price.replace(' ر.س', '').replace('SAR', '').trim();
              
              currentPrice.textContent = isRTL ? `${priceValue} ${currencySymbol}` : `${currencySymbol} ${priceValue}`;
              oldPrice.textContent = isRTL ? `${oldPriceValue} ${currencySymbol}` : `${currencySymbol} ${oldPriceValue}`;
              priceContainer.appendChild(currentPrice);
              priceContainer.appendChild(oldPrice);
            } else {
              const priceValue = fullProductData.formatted_price.replace(' ر.س', '').replace('SAR', '').trim();
              currentPrice.textContent = isRTL ? `${priceValue} ${currencySymbol}` : `${currencySymbol} ${priceValue}`;
              priceContainer.appendChild(currentPrice);
            }
            contentContainer.appendChild(priceContainer);
        
            // Add variants if product has options
            if (fullProductData.has_options && fullProductData.variants?.length > 0) {
              const variantsSection = this.createVariantsSection(fullProductData, currentLang);
              variantsSection.className = 'hmstudio-upsell-variants';
              contentContainer.appendChild(variantsSection);
            }
        
            // Controls container
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'hmstudio-upsell-product-controls';
        
            // Quantity selector
            const quantityContainer = document.createElement('div');
            quantityContainer.className = 'hmstudio-upsell-product-quantity';
        
            // Quantity input
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.id = 'product-quantity';
            quantityInput.name = 'quantity';
            quantityInput.min = '1';
            quantityInput.value = '1';
            quantityInput.style.cssText = 'text-align: center; width: 40px; border: none; background: transparent;';
        
            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'hmstudio-upsell-quantity-btn';
            decreaseBtn.type = 'button';
            decreaseBtn.textContent = '-';
        
            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'hmstudio-upsell-quantity-btn';
            increaseBtn.type = 'button';
            increaseBtn.textContent = '+';
        
            // Add quantity controls functionality
            decreaseBtn.addEventListener('click', () => {
              const currentValue = parseInt(quantityInput.value);
              if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                const event = new Event('change', { bubbles: true });
                quantityInput.dispatchEvent(event);
              }
            });
        
            increaseBtn.addEventListener('click', () => {
              const currentValue = parseInt(quantityInput.value);
              quantityInput.value = currentValue + 1;
              const event = new Event('change', { bubbles: true });
              quantityInput.dispatchEvent(event);
            });
        
            // Prevent manual typing
            quantityInput.addEventListener('keydown', (e) => {
              e.preventDefault();
            });
        
            quantityContainer.appendChild(decreaseBtn);
            quantityContainer.appendChild(quantityInput);
            quantityContainer.appendChild(increaseBtn);
            controlsContainer.appendChild(quantityContainer);
        
            // Add to cart button
            const addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'addToCartBtn';
            addToCartBtn.type = 'button';
            const originalText = currentLang === 'ar' ? 'إضافة للسلة' : 'Add to Cart';
            const loadingText = currentLang === 'ar' ? 'جاري الإضافة...' : 'Adding...';
            addToCartBtn.textContent = originalText;
  
            // Add to cart functionality
            addToCartBtn.addEventListener('click', () => {
              try {
                // If product has variants, validate all variants are selected
                if (fullProductData.has_options && fullProductData.variants?.length > 0) {
                  const selects = form.querySelectorAll('.variant-select');
                  const missingSelections = [];
                  
                  selects.forEach(select => {
                    const labelText = select.previousElementSibling.textContent;
                    if (!select.value) {
                      missingSelections.push(labelText);
                    }
                  });
  
                  if (missingSelections.length > 0) {
                    const message = currentLang === 'ar' 
                      ? `الرجاء اختيار ${missingSelections.join(', ')}`
                      : `Please select ${missingSelections.join(', ')}`;
                    alert(message);
                    return;
                  }
                }
  
                // Get quantity value
                const quantityValue = parseInt(quantityInput.value);
                if (isNaN(quantityValue) || quantityValue < 1) {
                  const message = currentLang === 'ar' 
                    ? 'الرجاء إدخال كمية صحيحة'
                    : 'Please enter a valid quantity';
                  alert(message);
                  return;
                }
  
                // Show loading state
                addToCartBtn.textContent = loadingText;
                addToCartBtn.disabled = true;
                addToCartBtn.style.opacity = '0.7';
  
                // Use Zid's cart function with formId
                zid.store.cart.addProduct({ 
                  formId: form.id
                })
                .then(function(response) {
                  console.log('Add to cart response:', response);
                  if (response.status === 'success') {
                    if (typeof setCartBadge === 'function') {
                      setCartBadge(response.data.cart.products_count);
                    }
                
                    // Add tracking
                    try {
                      const quantityInput = form.querySelector('#product-quantity');
                      const quantity = parseInt(quantityInput.value) || 1;
                      const productId = form.querySelector('input[name="product_id"]').value;
                      const productName = form.querySelector('.hmstudio-upsell-product-title').textContent;
                      const priceElement = form.querySelector('.hmstudio-upsell-product-price');
                      const priceText = priceElement.textContent.replace(/[^0-9.]/g, '');
                      const price = parseFloat(priceText) || 0;
                
                      fetch('https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackUpsellStats', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          storeId,
                          eventType: 'cart_add',  // Add this line
                          productId,
                          productName,
                          quantity,
                          price,
                          campaignId: currentCampaign.id,
                          campaignName: currentCampaign.name,
                          timestamp: new Date().toISOString()
                        })
                      }).catch(error => {
                        console.error('Failed to track upsell stats:', error);
                      });
                    } catch (error) {
                      console.error('Error tracking upsell stats:', error);
                    }              
                  } else {
                    console.error('Add to cart failed:', response);
                    const errorMessage = currentLang === 'ar' 
                      ? response.data.message || 'فشل إضافة المنتج إلى السلة'
                      : response.data.message || 'Failed to add product to cart';
                    alert(errorMessage);
                  }
                })
                .catch(function(error) {
                  console.error('Add to cart error:', error);
                  const errorMessage = currentLang === 'ar' 
                    ? 'حدث خطأ أثناء إضافة المنتج إلى السلة'
                    : 'Error occurred while adding product to cart';
                  alert(errorMessage);
                })
                .finally(function() {
                  // Reset button state
                  addToCartBtn.textContent = originalText;
                  addToCartBtn.disabled = false;
                  addToCartBtn.style.opacity = '1';
                });
              } catch (error) {
                console.error('Critical error in add to cart:', error);
                // Reset button state on error
                addToCartBtn.textContent = originalText;
                addToCartBtn.disabled = false;
                addToCartBtn.style.opacity = '1';
              }
            });
          
            controlsContainer.appendChild(addToCartBtn);
            contentContainer.appendChild(controlsContainer);
        
            // Assemble the card
            form.appendChild(imageContainer);
            form.appendChild(contentContainer);
            card.appendChild(form);
        
            return card;
          } catch (error) {
            console.error('Error creating product card:', error);
            return null;
          }
        },
    
        createVariantsSection(product, currentLang) {
          const variantsContainer = document.createElement('div');
          variantsContainer.className = 'hmstudio-upsell-variants';
        
          if (product.variants && product.variants.length > 0) {
            const variantAttributes = new Map();
            
            product.variants.forEach(variant => {
              if (variant.attributes && variant.attributes.length > 0) {
                variant.attributes.forEach(attr => {
                  if (!variantAttributes.has(attr.name)) {
                    variantAttributes.set(attr.name, {
                      name: attr.name,
                      slug: attr.slug,
                      values: new Set()
                    });
                  }
                  variantAttributes.get(attr.name).values.add(attr.value[currentLang]);
                });
              }
            });
        
            variantAttributes.forEach(attr => {
              const select = document.createElement('select');
              select.className = 'variant-select';
              select.style.cssText = `
                margin: 5px 0;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 100%;
              `;
        
              const labelText = currentLang === 'ar' ? attr.slug : attr.name;
              
              const label = document.createElement('label');
              label.textContent = labelText;
              label.style.cssText = `
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
              `;
        
              const placeholderText = currentLang === 'ar' ? `اختر ${labelText}` : `Select ${labelText}`;
              let optionsHTML = `<option value="">${placeholderText}</option>`;
              
              Array.from(attr.values).forEach(value => {
                optionsHTML += `<option value="${value}">${value}</option>`;
              });
              
              select.innerHTML = optionsHTML;
        
              select.addEventListener('change', () => {
                this.updateSelectedVariant(product, select.closest('form'));
              });
        
              variantsContainer.appendChild(label);
              variantsContainer.appendChild(select);
            });
          }
        
          return variantsContainer;
        },
    
        updateSelectedVariant(product, form) {
          if (!form) {
            console.error('Product form not found');
            return;
          }
        
          const currentLang = getCurrentLanguage();
          const selectedValues = {};
        
          form.querySelectorAll('.variant-select').forEach(select => {
            if (select.value) {
              const labelText = select.previousElementSibling.textContent;
              selectedValues[labelText] = select.value;
            }
          });
        
          console.log('Selected values:', selectedValues);
        
          const selectedVariant = product.variants.find(variant => {
            return variant.attributes.every(attr => {
              const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
              return selectedValues[attrLabel] === attr.value[currentLang];
            });
          });
        
          console.log('Found variant:', selectedVariant);
        
          if (selectedVariant) {
            const productIdInput = form.querySelector('input[name="product_id"]');
            if (productIdInput) {
              productIdInput.value = selectedVariant.id;
              console.log('Updated product ID to:', selectedVariant.id);
            }
    
            const priceElement = form.querySelector('.product-price');
            const oldPriceElement = form.querySelector('.product-old-price');
            const currencySymbol = currentLang === 'ar' ? 'ر.س' : 'SAR';
    
            if (priceElement) {
              if (selectedVariant.formatted_sale_price) {
                priceElement.textContent = selectedVariant.formatted_sale_price.replace('SAR', currencySymbol);
                if (oldPriceElement) {
                  oldPriceElement.textContent = selectedVariant.formatted_price.replace('SAR', currencySymbol);
                  oldPriceElement.style.display = 'inline';
                }
              } else {
                priceElement.textContent = selectedVariant.formatted_price.replace('SAR', currencySymbol);
                if (oldPriceElement) {
                  oldPriceElement.style.display = 'none';
                }
              }
            }
    
            const addToCartBtn = form.parentElement.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
              if (!selectedVariant.unavailable) {
                addToCartBtn.disabled = false;
                addToCartBtn.style.opacity = '1';
                addToCartBtn.style.cursor = 'pointer';
              } else {
                addToCartBtn.disabled = true;
                addToCartBtn.style.opacity = '0.5';
                addToCartBtn.style.cursor = 'not-allowed';
              }
            }
          }
        },
    
        async showUpsellModal(campaign, productCart) {
          console.log('Showing upsell modal:', { campaign, productCart });
          
          if (!campaign?.upsellProducts?.length) {
            console.warn('Invalid campaign data:', campaign);
            return;
          }
          // Track popup open
      try {
        await fetch('https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackUpsellStats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId,
            eventType: 'popup_open',
            campaignId: campaign.id,
            campaignName: campaign.name,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to track upsell popup open:', error);
      }
        
          const currentLang = getCurrentLanguage();
          const isRTL = currentLang === 'ar';
        
          try {
            if (this.currentModal) {
              this.currentModal.remove();
            }
        
            // Create main modal container
            const modal = document.createElement('div');
            modal.className = 'hmstudio-upsell-modal';
            if (isRTL) modal.style.direction = 'rtl';
        
            // Create modal content container
            const content = document.createElement('div');
            content.className = 'hmstudio-upsell-content';
        
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '✕';
            closeButton.style.cssText = `
              position: absolute;
              top: 15px;
              ${isRTL ? 'right' : 'left'}: 15px;
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
              padding: 5px;
              line-height: 1;
              z-index: 1;
            `;
            closeButton.addEventListener('click', () => this.closeModal());
        
            // Create header section
            const header = document.createElement('div');
            header.className = 'hmstudio-upsell-header';
        
            const title = document.createElement('h2');
            title.className = 'hmstudio-upsell-title';
            title.textContent = currentLang === 'ar' ? 
              decodeURIComponent(campaign.textSettings.titleAr) : 
              campaign.textSettings.titleEn;
        
            const subtitle = document.createElement('p');
            subtitle.className = 'hmstudio-upsell-subtitle';
            subtitle.textContent = currentLang === 'ar' ? 
              decodeURIComponent(campaign.textSettings.subtitleAr) : 
              campaign.textSettings.subtitleEn;
        
            header.appendChild(title);
            header.appendChild(subtitle);
        
            // Create main content wrapper
            const mainWrapper = document.createElement('div');
            mainWrapper.className = 'hmstudio-upsell-main';
        
            // Create sidebar section
            const sidebar = document.createElement('div');
            sidebar.className = 'hmstudio-upsell-sidebar';
        
            // Create benefit text
            const benefitText = document.createElement('div');
            benefitText.style.cssText = `
              text-align: center;
              margin-bottom: 20px;
              font-size: 18px;
              color: #333;
              font-weight: bold;
            `;
            benefitText.textContent = currentLang === 'ar' ? 'استفد من العرض' : 'Benefit from the Offer';
            sidebar.appendChild(benefitText);
        
            // Create Add All to Cart button
            const addAllButton = document.createElement('button');
            addAllButton.textContent = currentLang === 'ar' ? 'أضف الكل إلى السلة' : 'Add All to Cart';
            addAllButton.style.cssText = `
              width: 100%;
              padding: 12px 20px;
              background: #000;
              color: white;
              border: none;
              border-radius: 25px;
              font-size: 16px;
              cursor: pointer;
              transition: background-color 0.3s;
            `;
        
            addAllButton.addEventListener('mouseover', () => {
              addAllButton.style.backgroundColor = '#333';
            });
        
            addAllButton.addEventListener('mouseout', () => {
              addAllButton.style.backgroundColor = '#000';
            });
        
            addAllButton.addEventListener('click', async () => {
              const forms = content.querySelectorAll('form');
              const variantForms = Array.from(forms).filter(form => form.querySelector('.variant-select'));
              
              // Check if all variants are selected
              const allVariantsSelected = variantForms.every(form => {
                const selects = form.querySelectorAll('.variant-select');
                return Array.from(selects).every(select => select.value !== '');
              });
            
              if (!allVariantsSelected) {
                const message = currentLang === 'ar' 
                  ? 'الرجاء اختيار جميع الخيارات المطلوبة قبل الإضافة إلى السلة'
                  : 'Please select all required options before adding to cart';
                alert(message);
                return;
              }
            
              // Add loading state to button
              addAllButton.disabled = true;
              addAllButton.style.opacity = '0.7';
              const originalText = addAllButton.textContent;
              addAllButton.textContent = currentLang === 'ar' ? 'جاري الإضافة...' : 'Adding...';
            
              for (const form of forms) {
                await new Promise((resolve) => {
                  const productId = form.querySelector('input[name="product_id"]').value;
                  const productName = form.querySelector('.hmstudio-upsell-product-title').textContent;
                  const quantityInput = form.querySelector('#product-quantity');
                  const quantity = parseInt(quantityInput.value) || 1;
                  const priceElement = form.querySelector('.hmstudio-upsell-product-price');
                  const priceText = priceElement.textContent.replace(/[^0-9.]/g, '');
                  const price = parseFloat(priceText) || 0;
            
                  zid.store.cart.addProduct({ formId: form.id })
                    .then((response) => {
                      console.log('Add to cart response:', response);
                      if (response.status === 'success') {
                        if (typeof setCartBadge === 'function') {
                          setCartBadge(response.data.cart.products_count);
                        }
            
                        // Track each product addition
                        fetch('https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackUpsellStats', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            storeId,
                            eventType: 'cart_add',  // Add this line
                            productId,
                            productName,
                            quantity,
                            price,
                            campaignId: campaign.id,
                            campaignName: campaign.name,
                            timestamp: new Date().toISOString()
                          })
                        }).catch(error => console.error('Tracking error:', error));
                      }
                      resolve();
                    })
                    .catch((error) => {
                      console.error('Add to cart error:', error);
                      resolve();
                    });
                });
              }
            
              modal.remove();
        
              this.closeModal();
            });
        
            sidebar.appendChild(addAllButton);
        
            // Create products grid
            const productsGrid = document.createElement('div');
            productsGrid.className = 'hmstudio-upsell-products';
        
            // Create and append product cards
            const productCards = await Promise.all(
              campaign.upsellProducts.map(product => this.createProductCard(product, campaign))
            );
        
            productCards.filter(Boolean).forEach(card => {
              card.className = 'hmstudio-upsell-product-card';
              productsGrid.appendChild(card);
            });
        
            // Assemble the modal
            mainWrapper.appendChild(sidebar);
            mainWrapper.appendChild(productsGrid);
        
            content.appendChild(closeButton);
            content.appendChild(header);
            content.appendChild(mainWrapper);
            modal.appendChild(content);
        
            // Add modal to document and animate in
            document.body.appendChild(modal);
            requestAnimationFrame(() => {
              modal.style.opacity = '1';
              content.style.transform = 'translateY(0)';
            });
        
            this.currentModal = modal;
        
            // Add mobile swipe to close functionality
            let touchStartY = 0;
            content.addEventListener('touchstart', (e) => {
              touchStartY = e.touches[0].clientY;
            });
        
            content.addEventListener('touchmove', (e) => {
              const touchY = e.touches[0].clientY;
              const diff = touchY - touchStartY;
              
              if (diff > 0 && content.scrollTop === 0) {
                e.preventDefault();
                content.style.transform = `translateY(${diff}px)`;
              }
            });
        
            content.addEventListener('touchend', (e) => {
              const touchY = e.changedTouches[0].clientY;
              const diff = touchY - touchStartY;
              
              if (diff > 100 && content.scrollTop === 0) {
                this.closeModal();
              } else {
                content.style.transform = 'translateY(0)';
              }
            });
        
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
              if (e.target === modal) this.closeModal();
            });
        
            // Handle escape key
            const handleEscape = (e) => {
              if (e.key === 'Escape') this.closeModal();
            };
            document.addEventListener('keydown', handleEscape);
        
            // Clean up event listener when modal closes
            modal.addEventListener('remove', () => {
              document.removeEventListener('keydown', handleEscape);
            });
        
          } catch (error) {
            console.error('Error creating upsell modal:', error);
          }
        },
    
        closeModal() {
          if (this.currentModal) {
            this.currentModal.style.opacity = '0';
            const content = this.currentModal.querySelector('.hmstudio-upsell-content');
            if (content) {
              content.style.transform = 'translateY(20px)';
            }
            setTimeout(() => {
              if (this.currentModal) {
                this.currentModal.remove();
                this.currentModal = null;
              }
            }, 300);
          }
        },
    
        initialize() {
          console.log('Initializing Upsell');
          
          // Make sure the global object is available
          if (!window.HMStudioUpsell) {
            window.HMStudioUpsell = {
              showUpsellModal: (...args) => {
                console.log('showUpsellModal called with args:', args);
                return this.showUpsellModal.apply(this, args);
              },
              closeModal: () => this.closeModal()
            };
            console.log('Global HMStudioUpsell object created');
          }
    
          // Handle page visibility changes
          document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentModal) {
              this.closeModal();
            }
          });
    
          // Handle window resize
          window.addEventListener('resize', () => {
            if (this.currentModal) {
              const content = this.currentModal.querySelector('.hmstudio-upsell-content');
              if (content) {
                content.style.maxHeight = `${window.innerHeight * 0.9}px`;
              }
            }
          });
    
          // Clean up on page unload
          window.addEventListener('beforeunload', () => {
            if (this.currentModal) {
              this.closeModal();
            }
          });
        }
      };
    
      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          UpsellManager.initialize();
        });
      } else {
        UpsellManager.initialize();
      }
    })();
  })();
