/**
 * QuestFlow - Sync Module
 * Handles data synchronization with the backend
 */

const Sync = (() => {
  // Private variables
  let _isSyncing = false;
  let _lastSyncTime = null;
  let _syncQueue = [];

  // Initialize sync module
  const init = () => {
    _lastSyncTime = Storage.getSettings().lastSyncTime;
    
    // Listen for online/offline events
    window.addEventListener('online', _handleOnline);
    window.addEventListener('offline', _handleOffline);
    
    // Start sync queue processor
    _processSyncQueue();
  };

  // Add item to sync queue
  const addToSyncQueue = (action, data) => {
    _syncQueue.push({
      id: utils.generateUniqueId(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    });
    
    // Save queue to localStorage
    _saveSyncQueue();
    
    // Try to process queue if online
    if (utils.isOnline()) {
      _processSyncQueue();
    }
  };

  // Process sync queue
  const _processSyncQueue = async () => {
    if (_isSyncing || !utils.isOnline() || _syncQueue.length === 0) {
      return;
    }
    
    _isSyncing = true;
    
    try {
      const settings = Storage.getSettings();
      
      if (!settings.apiUrl || !settings.apiKey) {
        throw new Error('API configuration not found');
      }
      
      // Process each item in queue
      for (let i = 0; i < _syncQueue.length; i++) {
        const item = _syncQueue[i];
        
        try {
          await _syncItem(item, settings);
          
          // Remove successfully synced item
          _syncQueue.splice(i, 1);
          i--;
          
          // Save updated queue
          _saveSyncQueue();
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          
          // Increment retry count
          item.retries++;
          
          // Remove item if max retries reached
          if (item.retries >= 3) {
            _syncQueue.splice(i, 1);
            i--;
            
            utils.showNotification(
              'error',
              'Sync Failed',
              `Failed to sync item after 3 attempts: ${error.message}`
            );
          }
          
          // Save updated queue
          _saveSyncQueue();
        }
      }
      
      // Update last sync time
      _lastSyncTime = new Date().toISOString();
      Storage.updateSettings({ lastSyncTime: _lastSyncTime });
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
      utils.showNotification(
        'error',
        'Sync Error',
        'Failed to process sync queue: ' + error.message
      );
    } finally {
      _isSyncing = false;
    }
  };

  // Sync a single item
  const _syncItem = async (item, settings) => {
    const { apiUrl, apiKey } = settings;
    
    const response = await fetch(`${apiUrl}/${item.action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        ...item.data,
        timestamp: item.timestamp
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  };

  // Save sync queue to localStorage
  const _saveSyncQueue = () => {
    localStorage.setItem('questflow_sync_queue', JSON.stringify(_syncQueue));
  };

  // Load sync queue from localStorage
  const _loadSyncQueue = () => {
    const queue = localStorage.getItem('questflow_sync_queue');
    if (queue) {
      try {
        _syncQueue = JSON.parse(queue);
      } catch (error) {
        console.error('Error loading sync queue:', error);
        _syncQueue = [];
      }
    }
  };

  // Handle online event
  const _handleOnline = () => {
    utils.showNotification(
      'info',
      'Connection Restored',
      'Processing pending sync items...'
    );
    _processSyncQueue();
  };

  // Handle offline event
  const _handleOffline = () => {
    utils.showNotification(
      'warning',
      'Connection Lost',
      'Changes will be synced when connection is restored.'
    );
  };

  // Force sync
  const forceSync = async () => {
    if (_isSyncing) {
      utils.showNotification(
        'warning',
        'Sync in Progress',
        'Please wait for the current sync to complete.'
      );
      return false;
    }
    
    try {
      const settings = Storage.getSettings();
      
      if (!settings.apiUrl || !settings.apiKey) {
        throw new Error('API configuration not found');
      }
      
      if (!utils.isOnline()) {
        throw new Error('No internet connection');
      }
      
      // Get all questions
      const questions = Storage.getQuestions();
      
      // Add all questions to sync queue
      questions.forEach(question => {
        addToSyncQueue('questions', question);
      });
      
      // Process queue
      await _processSyncQueue();
      
      utils.showNotification(
        'success',
        'Sync Complete',
        'All questions have been synchronized.'
      );
      
      return true;
    } catch (error) {
      console.error('Error forcing sync:', error);
      utils.showNotification(
        'error',
        'Sync Error',
        'Failed to synchronize: ' + error.message
      );
      return false;
    }
  };

  // Get sync status
  const getStatus = () => {
    return {
      isSyncing: _isSyncing,
      lastSyncTime: _lastSyncTime,
      queueLength: _syncQueue.length
    };
  };

  // Public API
  return {
    init,
    addToSyncQueue,
    forceSync,
    getStatus
  };
})();

// Export the Sync module
window.Sync = Sync; 