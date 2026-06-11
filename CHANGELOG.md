# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI/CD workflow for automated testing and building
- SECURITY.md security policy documentation
- Enhanced test coverage for main process services

### Changed

- Fixed ProjectDetectionService.generateTags() bug where 'R' was matching 'React'
- Updated test mocks to better simulate Electron APIs
- Improved TypeScript type safety in test files

### Fixed

- Test failures in ProjectDetectionService.test.ts
- Test failures in DialogService.test.ts
- Mock implementation issues in unit tests

## [1.0.0] - 2024-02-10

### Added

- Initial release of DevLauncher
- Project management (CRUD operations)
- Multiple startup profiles support (Frontend/Backend/Docker)
- One-click start/stop projects
- IDE integration (VS Code, Cursor, etc.)
- Terminal integration (cross-platform)
- Folder opening support
- Custom command execution
- Real-time log output with search
- Log copy and clear functions
- Modern dark/light theme toggle
- Internationalization (Chinese/English)
- Responsive layout
- Grid/List view toggle
- Toast notifications
- Empty state indicators
- Error boundary protection
- README preview (Markdown support)
- Tag filtering and exclusion
- Virtual scrolling support
- Code splitting and lazy loading
- Zustand state management
- TypeScript type safety
- Comprehensive unit test coverage
- Batch project import (automatic directory scanning)
- Batch operations (start/stop/delete)
- Project group management
- Import/Export project configurations
- Keyboard shortcuts support

### Security

- Enabled Electron context isolation
- Disabled node integration in renderer process
- Content Security Policy enforcement
- Input validation and sanitization
- Security validator for commands

### Performance

- Virtual scrolling optimization for large project lists
- Code splitting for faster initial load
- Optimized dependency bundling
- Lazy loading of components

### Testing

- Unit tests for all main process services
- Unit tests for stores
- Unit tests for utility functions
- Test coverage reporting

[Unreleased]: https://github.com/Jasper-Leung/devlauncher/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Jasper-Leung/devlauncher/releases/tag/v1.0.0
