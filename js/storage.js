/**
 * QuestFlow - Storage Module
 * Handles local storage and file system operations
 */

// Storage module
const Storage = (() => {
  // Private variables
  let _directoryHandle = null;
  let _questions = [];
  let _settings = {
    apiUrl: '',
    apiKey: '',
    autoSync: true,
    darkMode: false,
    lastSyncTime: null
  };

  // Constants
  const SETTINGS_KEY = 'questflow_settings';
  const QUESTIONS_KEY = 'questflow_questions';
  const MEDIA_FOLDER = 'media';

  // Initialize storage
  const init = async () => {
    // Load settings from localStorage
    _loadSettings();
    
    // Load questions from localStorage (fallback)
    _loadQuestions();
    
    // Apply settings
    _applySettings();
    
    // Return initialization status
    return {
      isFileSystemSupported: utils.isFileSystemAccessSupported(),
      questionsCount: _questions.length,
      settings: _settings
    };
  };

  // Load settings from localStorage
  const _loadSettings = () => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        _settings = { ..._settings, ...JSON.parse(storedSettings) };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  };

  // Save settings to localStorage
  const _saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settings));
  };

  // Apply settings
  const _applySettings = () => {
    // Apply dark mode
    if (_settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Load questions from localStorage (fallback)
  const _loadQuestions = () => {
    const storedQuestions = localStorage.getItem(QUESTIONS_KEY);
    if (storedQuestions) {
      try {
        _questions = JSON.parse(storedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    }
  };

  // Save questions to localStorage (fallback)
  const _saveQuestions = () => {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(_questions));
  };

  // Get all questions
  const getQuestions = () => {
    return [..._questions];
  };

  // Get question by ID
  const getQuestionById = (id) => {
    return _questions.find(q => q.id === id);
  };

  // Add a new question
  const addQuestion = async (question) => {
    // Add ID and timestamp if not present
    if (!question.id) {
      question.id = utils.generateUniqueId();
    }
    
    if (!question.createdAt) {
      question.createdAt = new Date().toISOString();
    }
    
    question.updatedAt = new Date().toISOString();
    
    // Add to questions array
    _questions.push(question);
    
    // Save to localStorage (fallback)
    _saveQuestions();
    
    // If File System API is supported and directory handle is available
    if (utils.isFileSystemAccessSupported() && _directoryHandle) {
      try {
        await _saveQuestionToFileSystem(question);
      } catch (error) {
        console.error('Error saving question to file system:', error);
        utils.showNotification('error', 'Save Error', 'Failed to save question to file system.');
        return false;
      }
    }
    
    return true;
  };

  // Update an existing question
  const updateQuestion = async (id, updatedQuestion) => {
    const index = _questions.findIndex(q => q.id === id);
    
    if (index === -1) {
      return false;
    }
    
    // Update timestamp
    updatedQuestion.updatedAt = new Date().toISOString();
    
    // Update in array
    _questions[index] = { ..._questions[index], ...updatedQuestion };
    
    // Save to localStorage (fallback)
    _saveQuestions();
    
    // If File System API is supported and directory handle is available
    if (utils.isFileSystemAccessSupported() && _directoryHandle) {
      try {
        await _saveQuestionToFileSystem(_questions[index]);
      } catch (error) {
        console.error('Error updating question in file system:', error);
        utils.showNotification('error', 'Update Error', 'Failed to update question in file system.');
        return false;
      }
    }
    
    return true;
  };

  // Delete a question
  const deleteQuestion = async (id) => {
    const index = _questions.findIndex(q => q.id === id);
    
    if (index === -1) {
      return false;
    }
    
    // Remove from array
    const deletedQuestion = _questions.splice(index, 1)[0];
    
    // Save to localStorage (fallback)
    _saveQuestions();
    
    // If File System API is supported and directory handle is available
    if (utils.isFileSystemAccessSupported() && _directoryHandle) {
      try {
        await _deleteQuestionFromFileSystem(deletedQuestion);
      } catch (error) {
        console.error('Error deleting question from file system:', error);
        utils.showNotification('error', 'Delete Error', 'Failed to delete question from file system.');
        return false;
      }
    }
    
    return true;
  };

  // Save a question to the file system
  const _saveQuestionToFileSystem = async (question) => {
    if (!_directoryHandle) {
      throw new Error('No directory handle available');
    }
    
    // Create a file for the question
    const fileHandle = await _directoryHandle.getFileHandle(`${question.id}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    
    // Create a copy of the question without media data (will be stored separately)
    const questionCopy = utils.deepClone(question);
    
    // Handle media files
    if (question.media && question.media.length > 0) {
      // Ensure media directory exists
      let mediaDirHandle;
      try {
        mediaDirHandle = await _directoryHandle.getDirectoryHandle(MEDIA_FOLDER, { create: true });
      } catch (error) {
        console.error('Error creating media directory:', error);
        throw error;
      }
      
      // Process each media item
      for (let i = 0; i < question.media.length; i++) {
        const media = question.media[i];
        
        // If media has data (Blob/File), save it to the file system
        if (media.data) {
          const fileName = `${question.id}_${i}${_getFileExtension(media.type)}`;
          const mediaFileHandle = await mediaDirHandle.getFileHandle(fileName, { create: true });
          const mediaWritable = await mediaFileHandle.createWritable();
          await mediaWritable.write(media.data);
          await mediaWritable.close();
          
          // Update path in the question copy
          questionCopy.media[i].path = `${MEDIA_FOLDER}/${fileName}`;
          
          // Remove data from the copy
          delete questionCopy.media[i].data;
        }
      }
    }
    
    // Write the question data
    await writable.write(JSON.stringify(questionCopy, null, 2));
    await writable.close();
  };

  // Delete a question from the file system
  const _deleteQuestionFromFileSystem = async (question) => {
    if (!_directoryHandle) {
      throw new Error('No directory handle available');
    }
    
    // Delete the question file
    try {
      await _directoryHandle.removeEntry(`${question.id}.json`);
    } catch (error) {
      console.error('Error deleting question file:', error);
      // Continue to try deleting media files
    }
    
    // Delete associated media files
    if (question.media && question.media.length > 0) {
      try {
        const mediaDirHandle = await _directoryHandle.getDirectoryHandle(MEDIA_FOLDER);
        
        for (const media of question.media) {
          if (media.path) {
            const fileName = media.path.split('/').pop();
            try {
              await mediaDirHandle.removeEntry(fileName);
            } catch (error) {
              console.error(`Error deleting media file ${fileName}:`, error);
              // Continue with other files
            }
          }
        }
      } catch (error) {
        console.error('Error accessing media directory:', error);
        throw error;
      }
    }
  };

  // Get file extension based on media type
  const _getFileExtension = (type) => {
    if (type.startsWith('image/')) {
      const format = type.split('/')[1];
      return `.${format === 'jpeg' ? 'jpg' : format}`;
    } else if (type.startsWith('audio/')) {
      const format = type.split('/')[1];
      return `.${format}`;
    }
    return '';
  };

  // Choose a directory for storage
  const chooseDirectory = async () => {
    if (!utils.isFileSystemAccessSupported()) {
      utils.showNotification('error', 'Not Supported', 'Your browser does not support the File System Access API.');
      return false;
    }
    
    try {
      _directoryHandle = await window.showDirectoryPicker({
        id: 'questflow',
        startIn: 'documents',
        mode: 'readwrite'
      });
      
      // Save directory info in settings
      _settings.directoryName = _directoryHandle.name;
      _saveSettings();
      
      // Load questions from the directory
      await _loadQuestionsFromFileSystem();
      
      return true;
    } catch (error) {
      console.error('Error choosing directory:', error);
      return false;
    }
  };

  // Load questions from the file system
  const _loadQuestionsFromFileSystem = async () => {
    if (!_directoryHandle) {
      return false;
    }
    
    try {
      const newQuestions = [];
      
      // Iterate through all files in the directory
      for await (const [name, handle] of _directoryHandle.entries()) {
        // Only process JSON files
        if (handle.kind === 'file' && name.endsWith('.json')) {
          const file = await handle.getFile();
          const content = await file.text();
          
          try {
            const question = JSON.parse(content);
            newQuestions.push(question);
          } catch (error) {
            console.error(`Error parsing question file ${name}:`, error);
          }
        }
      }
      
      // Replace questions array with loaded questions
      _questions = newQuestions;
      
      // Update localStorage (fallback)
      _saveQuestions();
      
      return true;
    } catch (error) {
      console.error('Error loading questions from file system:', error);
      return false;
    }
  };

  // Export all questions
  const exportQuestions = async () => {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'questflow_export.json',
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }]
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(_questions, null, 2));
      await writable.close();
      
      return true;
    } catch (error) {
      console.error('Error exporting questions:', error);
      return false;
    }
  };

  // Import questions
  const importQuestions = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }]
      });
      
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      try {
        const importedQuestions = JSON.parse(content);
        
        // Validate imported questions
        if (!Array.isArray(importedQuestions)) {
          utils.showNotification('error', 'Import Error', 'Invalid questions format.');
          return false;
        }
        
        // Merge with existing questions
        for (const question of importedQuestions) {
          const existingIndex = _questions.findIndex(q => q.id === question.id);
          
          if (existingIndex === -1) {
            // New question
            _questions.push(question);
          } else {
            // Existing question - check which is newer
            const existingDate = new Date(_questions[existingIndex].updatedAt);
            const importedDate = new Date(question.updatedAt);
            
            if (importedDate > existingDate) {
              _questions[existingIndex] = question;
            }
          }
        }
        
        // Save to localStorage (fallback)
        _saveQuestions();
        
        // If File System API is supported and directory handle is available
        if (utils.isFileSystemAccessSupported() && _directoryHandle) {
          // Save all questions to file system
          for (const question of _questions) {
            await _saveQuestionToFileSystem(question);
          }
        }
        
        return importedQuestions.length;
      } catch (error) {
        console.error('Error parsing imported questions:', error);
        utils.showNotification('error', 'Import Error', 'Failed to parse imported questions.');
        return false;
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      return false;
    }
  };

  // Get settings
  const getSettings = () => {
    return { ..._settings };
  };

  // Update settings
  const updateSettings = (newSettings) => {
    _settings = { ..._settings, ...newSettings };
    _saveSettings();
    _applySettings();
    return true;
  };

  // Clear all data
  const clearData = async () => {
    // Clear questions
    _questions = [];
    
    // Clear localStorage
    localStorage.removeItem(QUESTIONS_KEY);
    
    // Reset settings (keep API settings)
    const apiSettings = {
      apiUrl: _settings.apiUrl,
      apiKey: _settings.apiKey
    };
    
    _settings = {
      ..._settings,
      autoSync: true,
      darkMode: false,
      lastSyncTime: null,
      ...apiSettings
    };
    
    _saveSettings();
    
    // If File System API is supported and directory handle is available
    if (utils.isFileSystemAccessSupported() && _directoryHandle) {
      try {
        // Delete all files in the directory
        for await (const [name, handle] of _directoryHandle.entries()) {
          if (handle.kind === 'file' && name.endsWith('.json')) {
            await _directoryHandle.removeEntry(name);
          }
        }
        
        // Delete media directory
        try {
          await _directoryHandle.removeEntry(MEDIA_FOLDER, { recursive: true });
        } catch (error) {
          console.error('Error deleting media directory:', error);
          // Continue
        }
      } catch (error) {
        console.error('Error clearing file system data:', error);
        return false;
      }
    }
    
    return true;
  };

  // Public API
  return {
    init,
    getQuestions,
    getQuestionById,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    chooseDirectory,
    exportQuestions,
    importQuestions,
    getSettings,
    updateSettings,
    clearData
  };
})();

// Export the Storage module
window.Storage = Storage; 