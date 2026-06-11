# Contributing Guidelines

Thank you for your interest in contributing to DevLauncher! This document will guide you through the process.

## Code of Conduct

- Respect all contributors
- Maintain a friendly and inclusive attitude
- Accept constructive criticism
- Focus on what is best for the community

## How to Contribute

### Reporting Bugs

If you find a bug, please:

1. Check [Issues](https://github.com/Jasper-Leung/devlauncher/issues) to see if it has already been reported
2. If not, create a new Issue with:
   - A clear title
   - Detailed bug description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment information (OS, Electron version, etc.)

### Suggesting Features

We welcome feature suggestions! Please:

1. First check if a similar suggestion already exists
2. Create a Feature Request Issue with:
   - Feature description
   - Use cases
   - Possible implementation approach

### Submitting Code

#### Setup

1. Fork this repository
2. Clone your fork:
   ```bash
   git clone https://github.com/Jasper-Leung/devlauncher.git
   cd devlauncher
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Jasper-Leung/devlauncher.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

#### Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes following these guidelines:
   - Use TypeScript
   - Follow ESLint rules
   - Add necessary comments
   - Keep code clean and clear

3. Run tests:
   ```bash
   npm run lint
   npm run test
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add xxx feature"
   # or
   git commit -m "fix: resolve xxx issue"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation update
   - `style`: Code formatting
   - `refactor`: Code refactoring
   - `test`: Test related
   - `chore`: Build/tooling related

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

#### Pull Request Guidelines

When creating a PR, please ensure:

- Clear title describing the changes
- Detailed description of what was changed and why
- Reference related Issues
- All CI checks pass
- Request to merge into `main` branch

## Code Style Guidelines

### TypeScript

- Use meaningful variable and function names
- Add JSDoc comments for functions
- Define clear types

### React

- Use functional components
- Use Hooks for state management
- Keep components single-purpose
- Clear Props definitions

### CSS

- Use BEM or similar naming convention
- Keep styles modular
- Use CSS variables for theme management

## Testing

- Add tests for new features
- Ensure all tests pass
- Test coverage should not decrease

## Documentation

- Update relevant documentation
- Add necessary comments
- Update README (if needed)

## Getting Help

If you have any questions:

- Check the [documentation](README.md)
- Search [Issues](https://github.com/Jasper-Leung/devlauncher/issues)
- Create a new Issue or Discussion

Thanks again for your contribution!
