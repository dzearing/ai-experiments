# Simple Weather App

A clean, straightforward weather application that displays current weather conditions for any city, helping users quickly check temperature, conditions, and forecasts.

## Features

- 🌤️ Real-time weather information for any city
- 🌡️ Temperature display in Celsius
- 💨 Wind speed information
- 💧 Humidity levels
- 🔍 Easy city search functionality
- 📱 Responsive design
- 🎨 Clean, modern UI

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
# Build for production
npm run build
```

### Preview Production Build

```bash
# Preview the production build
npm run preview
```

## API Configuration

This app uses the OpenWeatherMap API. For production use:

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Replace the `API_KEY` in `src/main.ts` with your key

**Note**: The current demo version shows sample data for testing purposes.

## Weather Information Displayed

- **City Name**: The searched city
- **Temperature**: Current temperature in Celsius
- **Conditions**: Weather description (e.g., clear sky, cloudy)
- **Feels Like**: Perceived temperature
- **Humidity**: Humidity percentage
- **Wind Speed**: Wind speed in m/s
- **Pressure**: Atmospheric pressure in hPa

## Technology Stack

- **TypeScript**: For type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Vanilla CSS**: For styling
- **OpenWeatherMap API**: Weather data source

## Project Structure

```
weather-app/
├── public/
│   └── index.html          # Main HTML file with UI
├── src/
│   └── main.ts             # TypeScript logic for weather fetching
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## Future Enhancements

- 5-day forecast display
- Geolocation support
- Multiple unit systems (Celsius/Fahrenheit)
- Weather icons
- Favorite cities
- Local storage for recent searches

## License

ISC
