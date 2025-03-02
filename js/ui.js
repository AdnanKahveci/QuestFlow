/**
 * QuestFlow - UI Module
 * Handles user interface interactions and dynamic content management
 */

const UI = (() => {
  // Private variables
  let _currentSection = 'questions';
  let _questionsList = [];
  let _filteredQuestions = [];
  let _searchQuery = '';
  let _selectedType = 'all';

  // Initialize UI
  const init = async () => {
    // Initialize event listeners
    _initializeEventListeners();
    
    // Update connection status
    utils.updateConnectionStatus();
    
    // Load questions
    await _loadQuestions();
    
    // Initialize settings
    _initializeSettings();
    
    // Show initial section
    showSection('questions');
  };

  // Initialize event listeners
  const _initializeEventListeners = () => {
    // Navigation
    document.querySelectorAll('.sidebar nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.getAttribute('data-section');
        showSection(section);
      });
    });

    // Search
    const searchInput = document.getElementById('question-search');
    searchInput.addEventListener('input', utils.debounce((e) => {
      _searchQuery = e.target.value.toLowerCase();
      _filterQuestions();
    }, 300));

    // Type filter
    const typeFilter = document.getElementById('type-filter');
    typeFilter.addEventListener('change', (e) => {
      _selectedType = e.target.value;
      _filterQuestions();
    });

    // Create first question button
    const createFirstButton = document.getElementById('create-first-question');
    createFirstButton.addEventListener('click', () => {
      showSection('create');
    });

    // Question form
    const questionForm = document.getElementById('question-form');
    questionForm.addEventListener('submit', _handleQuestionSubmit);

    // Add option button
    const addOptionButton = document.getElementById('add-option');
    addOptionButton.addEventListener('click', _addOptionRow);

    // Media upload buttons
    document.getElementById('add-image').addEventListener('click', () => _handleMediaUpload('image'));
    document.getElementById('add-audio').addEventListener('click', () => _handleMediaUpload('audio'));

    // Settings form elements
    document.getElementById('api-url').addEventListener('change', _handleSettingChange);
    document.getElementById('api-key').addEventListener('change', _handleSettingChange);
    document.getElementById('auto-sync').addEventListener('change', _handleSettingChange);
    document.getElementById('dark-mode').addEventListener('change', _handleSettingChange);
    document.getElementById('change-storage').addEventListener('click', _handleStorageChange);
    document.getElementById('clear-data').addEventListener('click', _handleDataClear);

    // Sync actions
    document.getElementById('sync-now').addEventListener('click', _handleSync);
    document.getElementById('export-questions').addEventListener('click', _handleExport);
    document.getElementById('import-questions').addEventListener('click', _handleImport);

    // Unity controls
    document.getElementById('load-unity').addEventListener('click', _handleUnityLoad);
    document.getElementById('send-to-unity').addEventListener('click', _handleUnitySend);
    document.getElementById('reset-unity').addEventListener('click', _handleUnityReset);

    // Online/Offline events
    window.addEventListener('online', () => {
      utils.updateConnectionStatus();
      utils.showNotification('success', 'Connection Restored', 'You are now online.');
      _handleAutoSync();
    });

    window.addEventListener('offline', () => {
      utils.updateConnectionStatus();
      utils.showNotification('warning', 'Connection Lost', 'You are now offline. Changes will be saved locally.');
    });
  };

  // Show a specific section
  const showSection = (sectionId) => {
    // Update navigation
    document.querySelectorAll('.sidebar nav li').forEach(li => {
      li.classList.remove('active');
    });
    document.querySelector(`.sidebar nav a[data-section="${sectionId}"]`).parentElement.classList.add('active');

    // Hide all sections
    document.querySelectorAll('main section').forEach(section => {
      section.classList.remove('active-section');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active-section');

    // Update current section
    _currentSection = sectionId;

    // Perform section-specific initialization
    switch (sectionId) {
      case 'questions':
        _loadQuestions();
        break;
      case 'create':
        _resetQuestionForm();
        break;
      case 'sync':
        _updateSyncStatus();
        break;
      case 'settings':
        _loadSettings();
        break;
    }
  };

  // Load and display questions
  const _loadQuestions = async () => {
    _questionsList = await Storage.getQuestions();
    _filteredQuestions = [..._questionsList];
    _renderQuestions();
  };

  // Filter questions based on search and type
  const _filterQuestions = () => {
    _filteredQuestions = _questionsList.filter(question => {
      const matchesSearch = question.question.toLowerCase().includes(_searchQuery);
      const matchesType = _selectedType === 'all' || question.type === _selectedType;
      return matchesSearch && matchesType;
    });
    _renderQuestions();
  };

  // Render questions list
  const _renderQuestions = () => {
    const container = document.getElementById('questions-list');
    const emptyState = container.querySelector('.empty-state');

    if (_filteredQuestions.length === 0) {
      if (_questionsList.length === 0) {
        // No questions at all
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
          <i class="fas fa-question-circle fa-4x"></i>
          <p>No questions found. Create your first question!</p>
          <button class="btn primary" id="create-first-question">Create Question</button>
        `;
      } else {
        // No matching questions
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
          <i class="fas fa-search fa-4x"></i>
          <p>No questions match your search criteria.</p>
        `;
      }
      return;
    }

    // Hide empty state
    emptyState.style.display = 'none';

    // Render questions
    const questionsHTML = _filteredQuestions.map(question => `
      <div class="question-card" data-id="${question.id}">
        <div class="question-type">
          <i class="fas ${_getQuestionTypeIcon(question.type)}"></i>
          ${question.type}
        </div>
        <div class="question-content">
          <h3>${utils.sanitizeHTML(question.question)}</h3>
          ${_renderQuestionPreview(question)}
        </div>
        <div class="question-meta">
          <span class="timestamp">
            <i class="fas fa-clock"></i>
            ${utils.formatDate(question.updatedAt)}
          </span>
          <div class="actions">
            <button class="btn icon edit-question" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn icon delete-question" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = questionsHTML;

    // Add event listeners to question cards
    container.querySelectorAll('.question-card').forEach(card => {
      const id = card.getAttribute('data-id');
      
      card.querySelector('.edit-question').addEventListener('click', () => {
        _editQuestion(id);
      });
      
      card.querySelector('.delete-question').addEventListener('click', () => {
        _deleteQuestion(id);
      });
    });
  };

  // Get icon class for question type
  const _getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'fa-list-ul';
      case 'true_false':
        return 'fa-toggle-on';
      case 'fill_blank':
        return 'fa-pencil-alt';
      default:
        return 'fa-question';
    }
  };

  // Render question preview
  const _renderQuestionPreview = (question) => {
    let preview = '';

    // Add options preview if applicable
    if (question.options && question.options.length > 0) {
      preview += '<div class="options-preview">';
      question.options.forEach((option, index) => {
        preview += `
          <div class="option ${question.answer === index ? 'correct' : ''}">
            <span class="option-marker">${String.fromCharCode(65 + index)}</span>
            ${utils.sanitizeHTML(option)}
          </div>
        `;
      });
      preview += '</div>';
    }

    // Add media preview if available
    if (question.media && question.media.length > 0) {
      preview += '<div class="media-preview-list">';
      question.media.forEach(media => {
        if (media.type.startsWith('image/')) {
          preview += `
            <div class="media-thumbnail">
              <img src="${media.path}" alt="Question media">
            </div>
          `;
        } else if (media.type.startsWith('audio/')) {
          preview += `
            <div class="media-thumbnail audio">
              <i class="fas fa-music"></i>
            </div>
          `;
        }
      });
      preview += '</div>';
    }

    return preview;
  };

  // Handle question form submission
  const _handleQuestionSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Gather question data
    const questionData = {
      type: formData.get('question-type'),
      question: formData.get('question-text'),
      options: [],
      media: []
    };

    // Gather options if applicable
    if (questionData.type !== 'fill_blank') {
      const optionRows = form.querySelectorAll('.option-row');
      optionRows.forEach((row, index) => {
        const optionText = row.querySelector('.option-text').value;
        questionData.options.push(optionText);
        
        if (row.querySelector('input[type="radio"]').checked) {
          questionData.answer = index;
        }
      });
    }

    // Gather media files
    const mediaContainer = form.querySelector('#media-preview');
    mediaContainer.querySelectorAll('.media-preview').forEach(preview => {
      const mediaData = preview.getAttribute('data-media');
      if (mediaData) {
        questionData.media.push(JSON.parse(mediaData));
      }
    });

    try {
      // Save question
      const success = await Storage.addQuestion(questionData);
      
      if (success) {
        utils.showNotification('success', 'Success', 'Question saved successfully.');
        showSection('questions');
      } else {
        utils.showNotification('error', 'Error', 'Failed to save question.');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      utils.showNotification('error', 'Error', 'An unexpected error occurred while saving the question.');
    }
  };

  // Add a new option row to the question form
  const _addOptionRow = () => {
    const container = document.querySelector('.option-inputs');
    const optionRows = container.querySelectorAll('.option-row');
    
    if (optionRows.length >= 6) {
      utils.showNotification('warning', 'Limit Reached', 'Maximum 6 options allowed.');
      return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'option-row';
    newRow.innerHTML = `
      <input type="radio" name="correct-answer" value="${optionRows.length}">
      <input type="text" class="option-text" placeholder="Option ${String.fromCharCode(65 + optionRows.length)}" required>
      <button type="button" class="remove-option"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(newRow);

    // Add event listener to remove button
    newRow.querySelector('.remove-option').addEventListener('click', () => {
      newRow.remove();
      _updateOptionLabels();
    });
  };

  // Update option labels after removing an option
  const _updateOptionLabels = () => {
    const container = document.querySelector('.option-inputs');
    const optionRows = container.querySelectorAll('.option-row');
    
    optionRows.forEach((row, index) => {
      row.querySelector('input[type="radio"]').value = index;
      row.querySelector('.option-text').placeholder = `Option ${String.fromCharCode(65 + index)}`;
    });
  };

  // Handle media upload
  const _handleMediaUpload = async (type) => {
    const accept = type === 'image' ? 'image/*' : 'audio/*';
    
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} files`,
          accept: { [accept]: [] }
        }]
      });

      const file = await fileHandle.getFile();
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        utils.showNotification('error', 'File Too Large', 'Please select a file smaller than 5MB.');
        return;
      }

      // Create preview
      const preview = document.createElement('div');
      preview.className = 'media-preview';

      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button type="button" class="remove-media"><i class="fas fa-times"></i></button>
          `;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = `
          <div class="audio-preview">
            <i class="fas fa-music fa-2x"></i>
            <span>${file.name}</span>
          </div>
          <button type="button" class="remove-media"><i class="fas fa-times"></i></button>
        `;
      }

      // Store media data
      preview.setAttribute('data-media', JSON.stringify({
        type: file.type,
        name: file.name,
        data: file
      }));

      // Add to preview container
      const container = document.getElementById('media-preview');
      container.appendChild(preview);

      // Add remove event listener
      preview.querySelector('.remove-media').addEventListener('click', () => {
        preview.remove();
      });

    } catch (error) {
      console.error('Error uploading media:', error);
      utils.showNotification('error', 'Upload Error', 'Failed to upload media file.');
    }
  };

  // Initialize settings
  const _initializeSettings = () => {
    const settings = Storage.getSettings();
    
    // Apply settings to form
    document.getElementById('api-url').value = settings.apiUrl;
    document.getElementById('api-key').value = settings.apiKey;
    document.getElementById('auto-sync').checked = settings.autoSync;
    document.getElementById('dark-mode').checked = settings.darkMode;
    
    if (settings.directoryName) {
      document.getElementById('storage-location').value = settings.directoryName;
    }
  };

  // Handle setting changes
  const _handleSettingChange = (e) => {
    const setting = e.target;
    const value = setting.type === 'checkbox' ? setting.checked : setting.value;
    
    Storage.updateSettings({
      [setting.id]: value
    });
  };

  // Handle storage location change
  const _handleStorageChange = async () => {
    const success = await Storage.chooseDirectory();
    
    if (success) {
      const settings = Storage.getSettings();
      document.getElementById('storage-location').value = settings.directoryName;
      utils.showNotification('success', 'Storage Updated', 'Storage location has been updated successfully.');
    }
  };

  // Handle data clear
  const _handleDataClear = async () => {
    const confirmed = await utils.showModal(
      'Clear All Data',
      'Are you sure you want to clear all data? This action cannot be undone.',
      'Clear Data',
      'Cancel'
    );

    if (confirmed) {
      const success = await Storage.clearData();
      
      if (success) {
        utils.showNotification('success', 'Data Cleared', 'All data has been cleared successfully.');
        _loadQuestions();
      } else {
        utils.showNotification('error', 'Error', 'Failed to clear data.');
      }
    }
  };

  // Handle sync
  const _handleSync = async () => {
    // TODO: Implement sync functionality
    utils.showNotification('info', 'Coming Soon', 'Sync functionality will be available soon.');
  };

  // Handle auto sync
  const _handleAutoSync = async () => {
    const settings = Storage.getSettings();
    if (settings.autoSync && utils.isOnline()) {
      await _handleSync();
    }
  };

  // Handle export
  const _handleExport = async () => {
    const success = await Storage.exportQuestions();
    
    if (success) {
      utils.showNotification('success', 'Export Complete', 'Questions exported successfully.');
    } else {
      utils.showNotification('error', 'Export Error', 'Failed to export questions.');
    }
  };

  // Handle import
  const _handleImport = async () => {
    const result = await Storage.importQuestions();
    
    if (result === false) {
      utils.showNotification('error', 'Import Error', 'Failed to import questions.');
    } else {
      utils.showNotification('success', 'Import Complete', `${result} questions imported successfully.`);
      _loadQuestions();
    }
  };

  // Handle Unity loading
  const _handleUnityLoad = () => {
    // TODO: Implement Unity loading
    utils.showNotification('info', 'Coming Soon', 'Unity integration will be available soon.');
  };

  // Handle sending questions to Unity
  const _handleUnitySend = () => {
    // TODO: Implement sending questions to Unity
    utils.showNotification('info', 'Coming Soon', 'Unity integration will be available soon.');
  };

  // Handle Unity reset
  const _handleUnityReset = () => {
    // TODO: Implement Unity reset
    utils.showNotification('info', 'Coming Soon', 'Unity integration will be available soon.');
  };

  // Reset question form
  const _resetQuestionForm = () => {
    const form = document.getElementById('question-form');
    form.reset();

    // Clear options
    const optionsContainer = form.querySelector('.option-inputs');
    optionsContainer.innerHTML = `
      <div class="option-row">
        <input type="radio" name="correct-answer" value="0" checked>
        <input type="text" class="option-text" placeholder="Option A" required>
        <button type="button" class="remove-option"><i class="fas fa-times"></i></button>
      </div>
      <div class="option-row">
        <input type="radio" name="correct-answer" value="1">
        <input type="text" class="option-text" placeholder="Option B" required>
        <button type="button" class="remove-option"><i class="fas fa-times"></i></button>
      </div>
    `;

    // Clear media preview
    const mediaPreview = form.querySelector('#media-preview');
    mediaPreview.innerHTML = '';
  };

  // Edit a question
  const _editQuestion = async (id) => {
    const question = Storage.getQuestionById(id);
    
    if (!question) {
      utils.showNotification('error', 'Error', 'Question not found.');
      return;
    }

    // Switch to create section
    showSection('create');

    // Fill form with question data
    const form = document.getElementById('question-form');
    form.querySelector('#question-type').value = question.type;
    form.querySelector('#question-text').value = question.question;

    // Fill options
    if (question.options && question.options.length > 0) {
      const optionsContainer = form.querySelector('.option-inputs');
      optionsContainer.innerHTML = question.options.map((option, index) => `
        <div class="option-row">
          <input type="radio" name="correct-answer" value="${index}" ${question.answer === index ? 'checked' : ''}>
          <input type="text" class="option-text" placeholder="Option ${String.fromCharCode(65 + index)}" value="${option}" required>
          <button type="button" class="remove-option"><i class="fas fa-times"></i></button>
        </div>
      `).join('');
    }

    // Add media previews
    if (question.media && question.media.length > 0) {
      const mediaPreview = form.querySelector('#media-preview');
      question.media.forEach(media => {
        const preview = document.createElement('div');
        preview.className = 'media-preview';

        if (media.type.startsWith('image/')) {
          preview.innerHTML = `
            <img src="${media.path}" alt="Preview">
            <button type="button" class="remove-media"><i class="fas fa-times"></i></button>
          `;
        } else {
          preview.innerHTML = `
            <div class="audio-preview">
              <i class="fas fa-music fa-2x"></i>
              <span>${media.name}</span>
            </div>
            <button type="button" class="remove-media"><i class="fas fa-times"></i></button>
          `;
        }

        preview.setAttribute('data-media', JSON.stringify(media));
        mediaPreview.appendChild(preview);
      });
    }

    // Update form to edit mode
    form.setAttribute('data-mode', 'edit');
    form.setAttribute('data-id', id);
  };

  // Delete a question
  const _deleteQuestion = async (id) => {
    const confirmed = await utils.showModal(
      'Delete Question',
      'Are you sure you want to delete this question? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (confirmed) {
      const success = await Storage.deleteQuestion(id);
      
      if (success) {
        utils.showNotification('success', 'Question Deleted', 'Question has been deleted successfully.');
        _loadQuestions();
      } else {
        utils.showNotification('error', 'Delete Error', 'Failed to delete question.');
      }
    }
  };

  // Update sync status
  const _updateSyncStatus = () => {
    const settings = Storage.getSettings();
    document.getElementById('last-sync-time').textContent = utils.formatDate(settings.lastSyncTime);
    document.getElementById('local-question-count').textContent = _questionsList.length;
    // TODO: Update cloud question count when sync is implemented
    document.getElementById('cloud-question-count').textContent = '0';
  };

  // Public API
  return {
    init,
    showSection
  };
})();

// Export the UI module
window.UI = UI;
