# SVG Logo Maker

A modern, feature-rich SVG logo maker built with React and TypeScript.

## Features

- Create and edit SVG graphics with multiple element types:
  - Rectangles
  - Circles
  - Text elements
  - Paths
- Intuitive drag-and-drop interface
- Edit element properties in real-time
- Color picker for fill and stroke colors
- Undo/redo functionality
- Export options (SVG, PNG)
- Zoom and grid features

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/svg-logo-maker.git

# Navigate to the project directory
cd logo-maker

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Use the toolbar on the left to add elements to your canvas
2. Select elements by clicking on them
3. Edit element properties in the panel on the right
4. Use the toolbar actions for undo, redo, and delete operations
5. Export your logo in SVG or PNG format

## Tech Stack

- React
- TypeScript
- Vite
- HTML5 Canvas & SVG
- react-color for color picking
- html-to-image for export functionality
- file-saver for downloading exports

## Project Structure

```
src/
├── components/
│   ├── canvas/        # Canvas-related components
│   ├── controls/      # UI controls and toolbars
│   └── elements/      # SVG element components
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── App.tsx            # Main application component
```

## License

MIT 