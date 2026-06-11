# Security Policy

## Supported Versions

| Version | Supported              |
| ------- | ---------------------- |
| 1.0.x   | :white_check_mark: Yes |
| < 1.0   | :x: No                 |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps to report it responsibly:

### How to Report

1. **Do NOT** open a public issue or disclose the vulnerability publicly
2. Send an email to: security@devlauncher.app
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue
- Once the vulnerability is resolved, we will publicly disclose it in our security advisories

### Security Best Practices for Users

#### Project Configuration Security

- **Review Project Paths**: Only add project directories you trust
- **Validate Commands**: Be cautious with custom startup commands
- **Avoid Sensitive Data**: Don't store sensitive information in project paths or names

#### System Security

- **Principle of Least Privilege**: Run the application with appropriate user permissions
- **Keep Updated**: Always use the latest version of DevLauncher
- **Scan Downloads**: Verify the integrity of downloaded executables

#### Network Security

- **Local Operations Only**: DevLauncher is designed for local development; avoid exposing it to external networks
- **Firewall Configuration**: Ensure proper firewall rules if network access is needed

### Known Security Considerations

1. **Command Execution**
   - DevLauncher executes system commands as specified in project configurations
   - Ensure project configurations are from trusted sources
   - Review custom commands before execution

2. **File System Access**
   - The application has access to the file system for project management
   - Be mindful of the directories you grant access to

3. **Process Management**
   - DevLauncher manages external processes for running projects
   - Ensure proper cleanup of processes when closing the application

4. **Electron Security**
   - The application uses Electron with context isolation enabled
   - Node integration is disabled in the renderer process
   - Content Security Policy is enforced

### Dependency Security

We regularly audit and update our dependencies. If you find a vulnerability in any dependency:

1. Check our issue tracker for existing reports
2. If not reported, follow the reporting process above
3. We will evaluate and update affected dependencies promptly

### Security Auditing

For researchers interested in security auditing:

- Please follow responsible disclosure
- We welcome security research and improvements
- Security improvements can be submitted via pull requests with the `[security]` tag

### Security Headers

The application implements the following security measures:

- **Context Isolation**: Enabled in Electron
- **Node Integration**: Disabled in renderer process
- **Content Security Policy**: Configured to restrict resource loading
- **Script Injection Prevention**: Input validation and sanitization

### Data Privacy

- **Local Data Only**: All project data is stored locally on your machine
- **No Telemetry**: No data is sent to external servers
- **User Control**: You have full control over your project configurations

### Third-Party Services

DevLauncher currently does not use any third-party services for data processing or storage. All operations are performed locally.

### License and Disclaimer

This project is provided as-is under the MIT License. See the [LICENSE](LICENSE) file for details.

### Contact

For security-related questions not involving vulnerabilities:

- Email: security@devlauncher.app
- GitHub: Use the `[security]` tag in issues

---

Thank you for helping keep DevLauncher and its users safe!
