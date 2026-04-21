# Project Structure: Fish-Wiki

## Overview

Fish-Wiki is a Next.js application designed to serve as a comprehensive resource for aquarium enthusiasts. It features a public-facing wiki for fish and plants, a management system for aquarium "tanks", and an administrative interface for managing the underlying database of species and water parameters.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Backend/Database**: Supabase (Auth & Database)
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **AI Integration**: Google Generative AI, OpenAI (used for various automated tasks)
- **State Management/Data Fetching**: React Server Components & Server Actions

## Core Modules

### 1. Public Interface (`src/app/(public)`)

- **Wiki**: A searchable database of fish and plants with detailed species information.
- **My Tanks**: A user-specific feature where enthusiasts can track and manage their individual aquariums.
- **Plant Gallery**: A dedicated view for exploring aquatic plant species.

### 2. Admin Interface (`src/app/(admin)`)

- **Species Management**: Full CRUD capabilities for Fish, Plants, and Water Profiles.
- **Label Management**: Management of classification labels/icons.
- **Content Control**: Tools for managing images and publishing status.

### 3. API & Server Actions (`src/app/actions/`)

The project heavily relies on **Server Actions** for data mutations and logic:

- `fish.ts`, `plants.ts`, `tanks.ts`, `labels.ts`, `water-profiles.ts`: Handle CRUD operations for respective entities.
- `ai.ts`: Orchestrates AI-driven features.
- `images.ts`, `plant-images.ts`: Manage media uploads and processing.

## Directory Hierarchy

### `src/app/` - Routing & Pages

- `(admin)/`: Routes wrapped in the admin layout.
- `(public)/`: Routes wrapped in the public layout.
- `api/`: API route handlers (e.g., keep-alive routes).
- `auth/`: Authentication callback and logic.
- `actions/`: The core business logic layer (Server Actions).

### `src/components/` - UI Components

- `admin/`: Admin-specific components (Tables, Forms, Nav).
- `public/`: Public-facing components (Cards, Search, Tooltips).
- `tanks/`: Components specifically for aquarium tank visualization and editing.
- `ui/`: Reusable, low-level primitive components (from shadcn/ui).
- `icons/`: Custom SVG/React icons.

### `src/lib/` - Utilities & Infrastructure

- `supabase/`: Supabase client configurations (Client, Server, and Public).
- `utils.ts`: General helper functions (e.g., Tailwind class merging).
- `slug.ts`: URL slug generation/management.

### `src/types/` - Type Definitions

- `fish.ts`, `plant.ts`, `tank.ts`: TypeScript interfaces representing the database schemas.

## Data Models & Entities

- **Fish**: Species name, description, image, variants, and associated water requirements.
- **Plants**: Species name, description, image, and growth requirements.
- **Tanks**: User-owned aquarium instances containing specific fish/plants.
- **Water Profiles**: Templates for chemical/physical water parameters (pH, Temp, etc.).
- **Labels**: Metadata tags for classifying species (e.g., "Cichlid", "Mbuna").

## Key Workflows

- **Data Entry**: Admin uses `FishForm` or `PlantForm` $\rightarrow$ triggers Server Action $\rightarrow$ updates Supabase.
- **Public Browsing**: User visits `wiki/[slug]` $\rightarrow$ Server Component fetches data via Supabase $\rightarrow$ Renders `FishCard`.
- **AI Enhancement**: User/Admin triggers AI action $\rightarrow$ `ai.ts` action calls Gemini/OpenAI $\rightarrow$ Results are saved to the database.
