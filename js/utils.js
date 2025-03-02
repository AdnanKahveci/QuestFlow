/**
 * QuestFlow - Utility Functions
 * Contains helper functions used throughout the application
 */

// Check if the browser supports the File System Access API
const isFileSystemAccessSupported = () => {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};

// Check if the browser is online
const isOnline = () => {
  return navigator.onLine;
};

// Generate a unique ID
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Format date to a readable string
const formatDate = (date) => {
  if (!date) return 'Never';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString(undefined, options);
};

// Format file size to a readable string
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function to limit how often a function can be called
const debounce = (func, delay) => {
  let timeout;
  
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// Throttle function to limit how often a function can be called
const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone an object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if two objects are equal
const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Sanitize HTML to prevent XSS attacks
const sanitizeHTML = (html) => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

// Show a notification
const showNotification = (type, title, message, duration = 5000) => {
  const notificationContainer = document.getElementById('notification-container');
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let iconClass = '';
  switch (type) {
    case 'success':
      iconClass = 'fas fa-check-circle';
      break;
    case 'error':
      iconClass = 'fas fa-exclamation-circle';
      break;
    case 'info':
      iconClass = 'fas fa-info-circle';
      break;
    case 'warning':
      iconClass = 'fas fa-exclamation-triangle';
      break;
  }
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="${iconClass}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${sanitizeHTML(title)}</div>
      <div class="notification-message">${sanitizeHTML(message)}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  notificationContainer.appendChild(notification);
  
  // Add event listener to close button
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove notification after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
  
  return notification;
};

// Show a modal dialog
const showModal = (title, content, confirmText = 'Confirm', cancelText = 'Cancel') => {
  return new Promise((resolve) => {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const modalClose = document.getElementById('modal-close');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modalConfirm.textContent = confirmText;
    modalCancel.textContent = cancelText;
    
    modalOverlay.classList.remove('hidden');
    
    const handleConfirm = () => {
      modalOverlay.classList.add('hidden');
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      modalOverlay.classList.add('hidden');
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      modalConfirm.removeEventListener('click', handleConfirm);
      modalCancel.removeEventListener('click', handleCancel);
      modalClose.removeEventListener('click', handleCancel);
    };
    
    modalConfirm.addEventListener('click', handleConfirm);
    modalCancel.addEventListener('click', handleCancel);
    modalClose.addEventListener('click', handleCancel);
  });
};

// Update connection status UI
const updateConnectionStatus = () => {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  if (isOnline()) {
    statusIcon.className = 'online';
    statusIcon.innerHTML = '<i class="fas fa-wifi"></i>';
    statusText.textContent = 'Online';
  } else {
    statusIcon.className = 'offline';
    statusIcon.innerHTML = '<i class="fas fa-wifi-slash"></i>';
    statusText.textContent = 'Offline';
  }
};

// Export all utility functions
window.utils = {
  isFileSystemAccessSupported,
  isOnline,
  generateUniqueId,
  formatDate,
  formatFileSize,
  debounce,
  throttle,
  deepClone,
  isEqual,
  sanitizeHTML,
  showNotification,
  showModal,
  updateConnectionStatus
}; 