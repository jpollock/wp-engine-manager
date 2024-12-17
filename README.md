# WP Engine Manager

A Next.js application for managing WP Engine resources including accounts, sites, and users. This tool provides a modern web interface for bulk operations and resource management across your WP Engine infrastructure.

## Features

- **Account Management**: View and manage WP Engine accounts
- **Site Management**: Monitor and control your WP Engine sites
- **User Management**: 
  - Bulk user operations
  - Add/modify user access
  - User permission management
- **Modern UI**: Built with a clean, responsive interface using Tailwind CSS and Radix UI components

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **UI Components**: 
  - Radix UI primitives
  - Tailwind CSS for styling
  - Custom shadcn/ui components
- **API Integration**: WP Engine TypeScript SDK (@elasticapi/wpengine-typescript-sdk)
- **Development Tools**:
  - ESLint for code quality
  - Turbopack for fast development builds
  - TypeScript for type safety

## Prerequisites

- Node.js (LTS version recommended)
- WP Engine User Portal credentials
- npm or yarn package manager

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd wp-engine-manager
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

4. Log in using your WP Engine User Portal credentials when prompted.

## Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/            
│   ├── accounts/          # Account management components
│   ├── auth/              # Authentication components
│   ├── dialogs/           # Modal dialogs
│   ├── layout/            # Layout components
│   ├── shared/            # Shared/common components
│   ├── ui/                # Base UI components
│   └── views/             # Main view components
├── lib/                   # Utilities and hooks
│   └── hooks/             # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Development

The application uses Next.js App Router and React Server Components. Key development features include:

- Fast Refresh for instant feedback
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Radix UI for accessible components

## Authentication

The application uses Basic Authentication with your WP Engine User Portal credentials. These credentials are securely handled through the application's login interface and are never stored in environment variables or configuration files.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For support or questions, please contact the development team.
