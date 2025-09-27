# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.4 application built with React 19.1.0, TypeScript, and Tailwind CSS 4. The project was bootstrapped with `create-next-app` and uses the App Router architecture.

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Build**: `npm run build` (uses Turbopack)
- **Production start**: `npm start` 
- **Lint**: `npm run lint` (ESLint)

No test framework is currently configured.

## Architecture

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 with CSS custom properties for theming
- **Fonts**: Geist Sans and Geist Mono fonts loaded via `next/font/google`
- **TypeScript**: Strict mode enabled with path aliases (`@/*` maps to `./`)

## Project Structure

- `app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with font loading and metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind imports and CSS variables
- `public/` - Static assets (SVG icons)
- Next.js configuration files at root level

## Key Features

- Built-in dark mode support using CSS custom properties and `prefers-color-scheme`
- Responsive design with Tailwind CSS utilities
- Optimized font loading with Next.js font optimization
- TypeScript with strict configuration

## Development Notes

- The app runs on http://localhost:3000 in development
- Hot reloading is enabled for instant updates
- Uses Turbopack for faster development and build performance