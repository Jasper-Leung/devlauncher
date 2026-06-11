# DevLauncher

<div align="center">

**Local Development Project Management System**

A powerful desktop application to help developers efficiently manage multiple local development projects.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-40.0.0-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://react.dev/)

[English Documentation](README.md) | [中文文档](README.zh-CN.md)

</div>

## Screenshots

### Main Interface (Dark Theme)
![Main Dark](screenshots/main-dark.png)

### Main Interface (Light Theme)
![Main Light](screenshots/main-light.png)

### Add Project Dialog
![Add Project](screenshots/add-project.png)

### Batch Import
![Batch Import](screenshots/batch-import.png)

### Startup Profiles
![Startup Profiles](screenshots/startup-profiles.png)

### Log Viewer
![Log Viewer](screenshots/log-viewer.png)

## Features

### Project Management

- ✅ Add/Edit/Delete projects
- ✅ Project list display with status monitoring
- ✅ Search and filter projects (by name, path, tags)
- ✅ Project group management
- ✅ Persistent project configuration storage
- ✅ Batch project import (automatic directory scanning)
- ✅ Batch operations (start/stop/delete)
- ✅ Import/Export project configurations
- ✅ Virtual scrolling support (optimized for large project lists)

### Core Interactions

- ✅ Multiple startup profiles support (Frontend/Backend/Docker)
- ✅ One-click start/stop projects
- ✅ Open IDE (supports VS Code, Cursor, etc.)
- ✅ Open system terminal (cross-platform support)
- ✅ Open project folder
- ✅ Custom command execution
- ✅ Real-time log output with search
- ✅ Log copy and clear functions

### UI/UX

- ✅ Modern dark/light theme
- ✅ Internationalization support (Chinese/English)
- ✅ Responsive layout
- ✅ Grid/List view toggle
- ✅ Toast notifications
- ✅ Empty state indicators
- ✅ Error boundary protection
- ✅ README preview (Markdown support)
- ✅ Tag filtering and exclusion

### Technical Optimizations

- ✅ Code splitting and lazy loading
- ✅ Virtual scrolling optimization
- ✅ Zustand state management
- ✅ Component modularity
- ✅ TypeScript type safety
- ✅ Comprehensive unit test coverage

## Tech Stack

- **Desktop Framework**: Electron 40 + React 19
- **Language**: TypeScript 5.7
- **Build Tool**: Vite 6
- **State Management**: Zustand 5
- **Internationalization**: i18next + react-i18next
- **Terminal Emulation**: node-pty
- **Data Storage**: JSON files
- **Styling**: CSS3
- **Testing**: Vitest 3 + Testing Library

## Installation

### Requirements

- Node.js >= 18.0.0
- Operating System: Windows 10+, macOS 10.15+, Linux

### Clone the Repository

```bash
git clone https://github.com/Jasper-Leung/devlauncher.git
cd devlauncher
```

### Install Dependencies

```bash
npm install
```

## Development

### Start Development Server

```bash
npm run dev
```

### Start Electron in Dev Mode

```bash
npm run electron:dev
```

This will start both the Vite dev server and Electron app.

### Build

```bash
npm run build
```

### Package Application

```bash
npm run electron:build
```

## Usage

### Adding a Project

1. Click the "Add Project" button
2. Select the project folder
3. The system will auto-detect project information (name, type, startup commands, etc.)
4. Configure startup profiles (you can add multiple):
   - Frontend projects (e.g., Vite, Webpack)
   - Backend projects (e.g., Node.js, Python)
   - Docker containers
5. Save the project

### Starting a Project

1. Select a project from the left sidebar
2. Choose a startup profile and click the "Start" button
3. Logs will be displayed in real-time in the console output area
4. Search and copy logs are supported

### Opening IDE/Terminal

- Click "Open IDE" to open the project in your configured IDE
- Click "Open Folder" to open the project in system file manager
- Click "Open Terminal" to open the project directory in system terminal

### Batch Operations

1. Click the "Batch Operations" button to enter batch mode
2. Select multiple projects
3. Execute batch start/stop/delete operations
4. View real-time progress

### Batch Import

1. Click the "Batch Import" button
2. Select the root directory to scan
3. Set scan depth (1-10 levels)
4. System automatically identifies and displays all projects
5. Select projects to import and complete the import

### Project Groups

1. Click the "Manage Groups" button
2. Create new groups or delete existing ones
3. Select a group when editing a project
4. Use group filters to quickly filter projects

### Internationalization

Click the language switcher button (🇨🇳/🇺🇸) at the top of the sidebar to switch between Chinese and English. Language preference is automatically saved.

## Keyboard Shortcuts

- `Ctrl + N`: Add new project
- `Ctrl + O`: Open IDE for selected project
- `Ctrl + Space`: Start/Stop selected project
- `Ctrl + E`: Edit selected project
- `Ctrl + D`: Export project configuration
- `Ctrl + I`: Import project configuration
- `Delete`: Delete selected project
- `Escape`: Close dialog or cancel selection

## Project Structure

```
devlauncher/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Application entry
│   │   ├── preload.js          # IPC communication bridge
│   │   └── services/
│   │       ├── ProjectService.ts        # Project data management
│   │       ├── CommandService.ts        # Command execution service
│   │       ├── DialogService.ts         # File dialog service
│   │       ├── DirectoryScanService.ts  # Directory scanning service
│   │       ├── BatchImportService.ts    # Batch import service
│   │       └── ProjectDetectionService.ts # Project type detection
│   ├── renderer/               # React renderer process
│   │   ├── App.tsx             # Main application component
│   │   ├── main.tsx            # React entry
│   │   ├── index.css           # Global styles
│   │   ├── i18n/               # Internationalization config
│   │   │   ├── index.ts        # i18next configuration
│   │   │   ├── config.ts       # Language type definitions
│   │   │   └── locales/        # Translation files
│   │   │       ├── zh/         # Chinese translations
│   │   │       └── en/         # English translations
│   │   ├── components/         # UI components
│   │   │   ├── ProjectSidebar.tsx      # Project sidebar
│   │   │   ├── MainContent.tsx         # Main content area
│   │   │   ├── ProjectList.tsx         # Project list
│   │   │   ├── VirtualProjectList.tsx  # Virtual scrolling list
│   │   │   ├── AddProjectModal.tsx     # Add project dialog
│   │   │   ├── GroupManagerModal.tsx   # Group management dialog
│   │   │   ├── BatchImportModal.tsx    # Batch import dialog
│   │   │   ├── BatchActions.tsx        # Batch operations component
│   │   │   ├── StartupProfiles.tsx     # Startup profiles component
│   │   │   ├── LogViewer.tsx           # Log viewer
│   │   │   ├── LanguageSwitcher.tsx    # Language switcher
│   │   │   └── Toast.tsx               # Toast notifications
│   │   ├── stores/             # State management
│   │   │   ├── uiStore.ts      # UI state
│   │   │   ├── projectStore.ts # Project state
│   │   │   └── batchStore.ts   # Batch operations state
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utility functions
│   │   └── global.d.ts         # Global type definitions
│   ├── test/                   # Test files
│   └── shared/
│       ├── types.ts            # Type definitions
│       ├── projectTypeConfig.ts # Project type config
│       └── errorTypes.ts       # Error type definitions
├── package.json
├── tsconfig.json               # Renderer TS config
├── tsconfig.electron.json      # Main process TS config
├── vite.config.ts              # Vite build config
└── index.html                  # HTML entry
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage report
npm run test:coverage

# View test results in UI
npm run test:ui
```

## Code Quality

```bash
# Run ESLint checks
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code
npm run format
```

## Future Plans

- [ ] Docker container integration
- [ ] Environment variable management
- [ ] Log history persistence

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to participate.

## License

This project is licensed under the [MIT](LICENSE) License.

## Acknowledgments

Thanks to all developers who have contributed to this project.

---

<div align="center">

Made with ❤️ by Jasper-Leung

</div>
