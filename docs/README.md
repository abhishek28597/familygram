# System Design Documentation

This folder contains detailed system design documentation for the Family Social Media Application.

## Documentation Files

### [System Architecture](./system-architecture.md)
- High-level system architecture diagram
- Service communication flow
- Technology stack overview
- Complete API endpoints list

### [Authentication Flow](./authentication-flow.md)
- Complete authentication process (signup, login, protected routes)
- JWT token lifecycle
- Password hashing process
- Security features

### [Data Model Design](./data-model.md)
- Entity relationship diagram (ERD)
- Database schema details
- Table structures and relationships
- Data flow examples

## Diagram Format

All diagrams are created using [Mermaid](https://mermaid.js.org/), which is:
- Supported natively by GitHub (renders automatically)
- Supported by many markdown viewers
- Text-based (easy to version control)
- Easy to edit and maintain

## Viewing Diagrams

### On GitHub
Diagrams will render automatically when viewing markdown files on GitHub.

### Locally
You can use:
- [Mermaid Live Editor](https://mermaid.live/) - Paste the mermaid code to view
- VS Code with Mermaid extension
- Any markdown viewer that supports Mermaid

### Exporting as Images
1. Copy the mermaid code from any diagram
2. Paste into [Mermaid Live Editor](https://mermaid.live/)
3. Export as PNG/SVG

## Contributing

When updating diagrams:
1. Keep them simple and focused
2. Update related documentation if relationships change
3. Test that diagrams render correctly on GitHub

