/**
 * QuestFlow - Unity Integration Module
 * Handles communication between web app and Unity WebGL build
 */

const UnityIntegration = (() => {
  // Private variables
  let _unityInstance = null;
  let _isLoaded = false;
  let _pendingQuestions = [];

  // Unity configuration
  const _config = {
    containerID: 'unity-iframe-container',
    buildUrl: 'unity/Build/webgl.json',
    width: '100%',
    height: '400px'
  };

  // Initialize Unity integration
  const init = async () => {
    // Check if Unity loader script is available
    if (typeof createUnityInstance === 'undefined') {
      console.error('Unity loader script not found');
      return false;
    }

    try {
      // Create Unity instance
      const container = document.getElementById(_config.containerID);
      
      // Show loading message
      container.innerHTML = '<div class="unity-loading">Loading Unity WebGL build...</div>';
      
      // Create Unity instance
      _unityInstance = await createUnityInstance(container, {
        dataUrl: _config.buildUrl.replace('json', 'data'),
        frameworkUrl: _config.buildUrl.replace('json', 'framework.js'),
        codeUrl: _config.buildUrl.replace('json', 'wasm'),
        streamingAssetsUrl: 'unity/StreamingAssets',
        companyName: 'QuestFlow',
        productName: 'QuestFlow Unity Integration',
        productVersion: '1.0.0'
      });

      // Update UI
      document.getElementById('unity-placeholder').style.display = 'none';
      container.style.display = 'block';
      
      // Enable controls
      document.getElementById('send-to-unity').disabled = false;
      document.getElementById('reset-unity').disabled = false;

      _isLoaded = true;
      
      // Send any pending questions
      if (_pendingQuestions.length > 0) {
        sendQuestions(_pendingQuestions);
        _pendingQuestions = [];
      }

      return true;
    } catch (error) {
      console.error('Error initializing Unity:', error);
      return false;
    }
  };

  // Send questions to Unity
  const sendQuestions = (questions) => {
    if (!_isLoaded) {
      _pendingQuestions = questions;
      return false;
    }

    try {
      // Convert questions to Unity-friendly format
      const unityQuestions = questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        answer: q.answer,
        media: q.media ? q.media.map(m => ({
          type: m.type,
          url: m.path
        })) : []
      }));

      // Send to Unity
      _unityInstance.SendMessage('QuestionManager', 'LoadQuestions', JSON.stringify(unityQuestions));
      
      return true;
    } catch (error) {
      console.error('Error sending questions to Unity:', error);
      return false;
    }
  };

  // Handle answer from Unity
  const handleAnswer = (questionId, answer) => {
    // Dispatch custom event
    const event = new CustomEvent('unity-answer', {
      detail: {
        questionId,
        answer
      }
    });
    window.dispatchEvent(event);
  };

  // Reset Unity state
  const reset = () => {
    if (!_isLoaded) return false;

    try {
      _unityInstance.SendMessage('QuestionManager', 'Reset');
      return true;
    } catch (error) {
      console.error('Error resetting Unity:', error);
      return false;
    }
  };

  // Check if Unity is loaded
  const isLoaded = () => _isLoaded;

  // Public API
  return {
    init,
    sendQuestions,
    handleAnswer,
    reset,
    isLoaded
  };
})();

// Export the Unity Integration module
window.UnityIntegration = UnityIntegration;

// Handle messages from Unity
window.unityAnswerCallback = (questionId, answer) => {
  UnityIntegration.handleAnswer(questionId, answer);
}; 