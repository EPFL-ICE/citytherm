# CityTherm Frontend Architecture Specification

## Version History

- v1.0 (2025-08-22): Initial version based on current codebase
- v1.1 (2025-08-22): Fixed TEST text issue in Neighborhood badges and updated documentation
- v1.2 (2025-08-22): Removed debug console.log statements throughout the codebase
- v1.3 (2025-08-22): Implemented city-specific neighborhood storage and persistence
- v1.4 (2025-08-22): Fixed neighborhood badges display issue when switching map layers

## Overview

CityTherm is a web mapping application built with Vue.js 3 that visualizes urban climate data. The application allows users to:

- Select and compare different urban climate layers
- View data on interactive maps
- Select specific geographic features for detailed analysis
- Compare data across multiple layers and neighborhoods

The application is structured as a single-page application (SPA) with a responsive UI built using Vuetify components.

## Technology Stack

### Core Frameworks

- **Vue.js 3**: Progressive JavaScript framework for building user interfaces
- **TypeScript**: Typed superset of JavaScript for enhanced development experience
- **Vite**: Fast build tool and development server

- **Vuetify**: Material Design component framework for Vue.js

### State Management

- **Pinia**: Intuitive, type-safe state management for Vue.js

### Mapping

- **MapLibre GL JS**: Library for interactive vector tile maps
- **PMTiles**: Efficient format for serving map tiles

### Utilities

- **Turf.js**: Geospatial analysis library
- **Lodash**: Utility library for common programming tasks

### Testing

- **Vitest**: Fast unit testing framework
- **Vue Test Utils**: Testing utilities for Vue components

### Code Quality

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **lefthook**: Git hooks manager

## Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── geodata/           # Geographic data files
│   └── style/             # Map styles
├── schema/                # JSON schemas
├── src/                   # Source code
│   ├── assets/            # Images, stylesheets
│   ├── components/        # Vue components
│   ├── composables/       # Vue composables (reusable logic)
│   ├── config/            # Configuration files
│   ├── lib/               # Utility libraries
│   ├── plugins/           # Vue plugins
│   ├── router/            # Vue Router configuration
│   ├── stores/            # Pinia stores
│   ├── utils/             # Utility functions
│   ├── views/             # Page-level components
│   ├── App.vue            # Root component

│   └── main.ts            # Application entry point
├── tests/                 # Test files
└── ...

```

## Core Components Architecture

### Root Component

- **App.vue**: The root component that sets up the Vuetify application container and renders the router view.

### Main Views

- **ComparisonView.vue**: The primary view that displays the main application interface with layer selection, maps, and data tables.

### UI Components

- **LayerGroups.vue**: Displays categorized groups of map layers with expandable sections
- **MapGrid.vue**: Responsive grid container for displaying multiple map panels

- **MapPanel.vue**: Individual map container that wraps the shared map component
- **SelectionBar.vue**: Toolbar for date selection and other global controls
- **TableTab.vue**: Data table component for displaying selected feature information

### Map Components

- **SharedMap.vue**: Wrapper component that manages map state and layer visibility
- **MapLibreMap.vue**: Core MapLibre GL integration component

- **LegendMap.vue**: Map legend component that displays layer information

### Utility Components

- **CustomSlider.vue**: Enhanced slider component with custom styling

- **InfoTooltip.vue**: Information tooltip component

- **JsonWebMap.vue**: Component for rendering GeoJSON data
- **LoadingCircle.vue**: Loading indicator component

## State Management (Pinia Stores)

### City Store (`stores/city.ts`)

Manages the currently selected city and its configuration:

- Available cities (Geneva, Zurich)
- City-specific map center and zoom levels
- Grid data file references

### Layers Store (`stores/layers.ts`)

Handles map layer configuration and selection:

- Layer groups and their visibility states
- Selected layers management
- Layer filtering capabilities
- Expansion state for layer groups

### Compare Store (`stores/compare.ts`)

Manages comparison functionality:

- Selected layers for comparison
- Selected neighborhoods/features
- Table data representation

- Selection limits (6 items maximum)

### Feature Selections Store (`stores/useFeatureSelections.ts`)

Manages selected map features with city-specific storage:

- Collection of selected geographic features, maintained separately for each city
- Feature centroid calculations
- Local storage persistence with city-specific data separation
- Automatic data migration from previous single-city format
- Maximum selection limits (6 items per city)
- City-aware feature collection generation for map display

The store now maintains separate selections for Geneva and Zurich, ensuring that when users switch between cities, their respective neighborhood selections are preserved. When a city is selected, the store automatically loads the appropriate feature selections for that city.

## Mapping Architecture

### Layer Configuration (`config/layerTypes.ts`, `config/mapConfig.ts`)

The application uses a dynamic layer configuration system:

- Layer specifications with MapLibre GL layer definitions
- Source configurations for vector tile data
- Color scales and styling information
- Layer categorization into groups (Urban Morphology, Land Cover, etc.)

### Map Components Integration

1. **MapLibreMap.vue**: Low-level MapLibre GL wrapper
2. **SharedMap.vue**: Mid-level component that manages layer visibility and events

3. **MapPanel.vue**: High-level component that integrates the map with application state

### Event Handling (`composables/useMapEvents.ts`)

Composable for managing map interactions:

- Click events for feature selection
- Hover events for tooltips

- Popup content generation
- Event listener management

## Data Flow

### Initialization

1. Application loads with default city (Geneva)
2. Map configuration is loaded based on selected city
3. Layer groups are initialized and displayed
4. Main map view is rendered

### User Interaction Flow

1. User selects a city → City store updates → Map re-centers
2. User selects layers → Layers store updates → Map displays selected layers
3. User clicks on map features → Feature selections store updates → Badges appear
4. User compares selections → Compare store updates → Table data refreshes

### Data Persistence

- Feature selections are persisted in localStorage
- Application state is managed in-memory through Pinia stores

## Configuration Management

### Environment Configuration

- `.env` file for runtime configuration
- VITE_PARAMETERS_URL: External JSON configuration endpoint

- VITE_STYLE_URL: Map style specification

### Layer Configuration

- Dynamic layer configuration based on selected city
- JSON schemas for validating configuration data
- PMTiles URLs for efficient map data delivery

## UI/UX Components

### Vuetify Integration

- Material Design components for consistent UI
- Responsive grid system for different screen sizes
- Theme customization through Vuetify configuration

### Custom Components

- Enhanced slider for parameter adjustment
- Interactive tooltips for information display
- Loading indicators for asynchronous operations
- Data tables for feature comparison

## Build and Deployment

### Development

- `npm run dev`: Start development server with hot reloading
- TypeScript compilation with vue-tsc
- ESLint and Prettier for code quality

### Production

- `npm run build`: Create optimized production build
- Bundle optimization and minification
- Static asset handling

### Testing

- `npm run test:unit`: Run unit tests with Vitest
- Component testing with Vue Test Utils

### Code Quality

- `npm run lint`: Run ESLint with automatic fixes
- `npm run format`: Format code with Prettier
- Git hooks for pre-commit validation

## Maintenance Guidelines

### Updating This Document

When modifying the codebase, update this document to reflect:

1. New components or significant changes to existing ones
2. Updates to data flow or state management
3. Changes to project structure or build process
4. New features or functionality

### Version Tracking

- Increment version number in the Version History section
- Briefly describe changes made
- Date all updates

### Component Documentation Template

When adding new components, include:

1. Component purpose and responsibilities
2. Props and events
3. Relationship to other components
4. State management interactions
