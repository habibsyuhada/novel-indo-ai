# Novel Indo - Web Novel Reading Application

A modern web application for reading novels online, built with Next.js, DaisyUI, and Supabase.

## Features

### Reading Experience
- Clean, distraction-free reading interface
- Proper paragraph formatting for better readability
- Font size adjustment (saved to localStorage)
- Dark/light mode toggle (saved to localStorage)
- Reading progress indicator
- Mobile-optimized layout

### Accessibility
- Text-to-speech functionality with pause/resume capability
- Visual text highlighting of currently spoken paragraph (without padding)
- Click-to-read functionality for starting speech from any paragraph
- Customizable speech rate and voice selection (saved to localStorage)
- Responsive design for all devices
- Keyboard navigation support

### User Interface
- Intuitive navigation between chapters
- Chapter list view
- Novel details page with description and metadata
- Search functionality on the home page
- Mobile-optimized UI with icon buttons on smaller screens

### User Settings
The application includes a centralized settings panel accessible from any page:
- **Theme Toggle**: Switch between light and dark mode
- **Font Size**: Adjust text size for comfortable reading
- **Text-to-Speech Settings**: 
  - Voice selection from available system voices
  - Speech rate adjustment
  - Pause/resume controls while reading
  - Visual text highlighting for better focus
  - Click-to-read from any paragraph

All user settings are automatically saved to localStorage, ensuring preferences persist between sessions.

## Technical Details

### Technologies Used
- **Frontend**: Next.js, React, TypeScript
- **UI Components**: DaisyUI, Tailwind CSS
- **Database**: Supabase
- **State Management**: React Hooks
- **Styling**: CSS Modules, Tailwind CSS
- **Accessibility**: Native Web Speech API with enhanced controls and visual feedback

### Database Schema
- `novel` table: Stores novel metadata (title, author, description, etc.)
- `novel_chapter` table: Stores chapter content linked to novels

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables for Supabase
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Mobile Optimization

The application is fully optimized for mobile devices:
- Responsive layout adapts to screen size
- Touch-friendly UI elements
- Reduced padding and margins on smaller screens
- Icon buttons replace text buttons on mobile
- Simplified navigation for smaller screens

## Accessibility Features

- Semantic HTML structure
- ARIA attributes for interactive elements
- Keyboard navigation support
- Text-to-speech functionality with pause/resume controls
- Visual highlighting of currently spoken text
- Click-to-read from any paragraph
- Adjustable font sizes
- High contrast mode (via theme toggle)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
