# QuestFlow

QuestFlow is an innovative question management system that works both offline and online, with Unity integration capabilities for interactive educational experiences.

## Project Overview

QuestFlow allows educators and content creators to:
- Create and manage various types of questions (multiple choice, true/false, fill in the blank)
- Work offline with local file storage and seamlessly sync when online
- Integrate questions with Unity WebGL applications
- Analyze question performance through an online dashboard

## Core Features

### 1. Offline Question Management
- Create, edit, and store questions locally using browser's File System API
- Support for various question types with media attachments
- Structured JSON format for question data

### 2. Offline/Online Synchronization
- Automatic detection of internet connectivity
- Conflict resolution based on timestamps
- Secure API-based synchronization

### 3. Unity Integration
- Embed Unity WebGL builds via iframe
- Two-way communication using postMessage API
- Pass questions to Unity and receive answers back

### 4. Online Dashboard
- User management and authentication
- Question analytics and performance metrics
- Event management and advertisement integration
- CRUD operations for all system entities

## Technical Architecture

### Frontend (Offline)
- HTML/CSS/JavaScript with File System Access API
- Lightweight framework: Preact or Lit
- Unity WebGL integration via iframe

### Frontend (Online Dashboard)
- Laravel Blade templates
- Livewire/Alpine.js for dynamic UI components
- Alternatively: Inertia.js for SPA-like experience

### Backend
- Laravel API for data storage and synchronization
- Laravel Sanctum for authentication
- RESTful endpoints for question management

## Data Structure

Questions are stored in JSON format:
```json
{
  "type": "multiple_choice|true_false|fill_blank",
  "question": "Question text",
  "media": [{ "type": "image|audio", "path": "question_1/img.jpg" }],
  "options": ["Option A", "Option B", "Option C"],
  "answer": "Option A"
}
```

File system structure:
```
/questions/
  ├── q1.json  
  └── media/  
      ├── q1_image.jpg  
      └── q1_audio.mp3  
```

## Development Roadmap

### Phase 1: Offline Core System
- Question editor UI implementation
- File System API integration for local storage
- Basic question types and media handling

### Phase 2: Unity Integration
- WebGL build and iframe embedding
- postMessage communication protocol
- Question rendering in Unity

### Phase 3: Backend Development
- Laravel API setup with authentication
- Synchronization endpoints
- User management

### Phase 4: Dashboard Development
- Admin panel with Blade/Livewire
- Analytics and reporting features
- User role management

### Phase 5: Testing and Deployment
- Offline functionality testing
- Synchronization testing
- Performance optimization

## Technical Challenges and Solutions

### Browser Compatibility
- File System API is currently limited to Chromium-based browsers
- Fallback to IndexedDB or localStorage for unsupported browsers

### Media Size Management
- Warning system for large media files
- Compression options for images and audio

### Security Considerations
- Sandbox restrictions for Unity iframe
- Content Security Policy implementation
- Secure API authentication

## Getting Started

*Detailed setup instructions will be added as development progresses*

## License

*To be determined*

## Contributors

*To be added* 