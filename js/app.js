/**
 * QuestFlow - Main Application
 * Initializes and coordinates application modules
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Storage module
    const storageStatus = await Storage.init();
    
    // Show storage support notification
    if (!storageStatus.isFileSystemSupported) {
      utils.showNotification(
        'warning',
        'Limited Storage Support',
        'Your browser does not support the File System Access API. Some features will be limited.'
      );
    }
    
    // Initialize UI module
    await UI.init();
    
    // Show welcome message
    utils.showNotification(
      'info',
      'Welcome to QuestFlow',
      'Create and manage your questions with ease!'
    );
    
  } catch (error) {
    console.error('Error initializing application:', error);
    utils.showNotification(
      'error',
      'Initialization Error',
      'Failed to initialize the application. Please refresh the page.'
    );
  }
}); 