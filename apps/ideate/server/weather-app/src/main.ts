// Simple Weather App - Main TypeScript File

const API_KEY = 'demo'; // Using demo mode for testing
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
}

// Get DOM elements
const cityInput = document.getElementById('cityInput') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const weatherInfo = document.getElementById('weatherInfo') as HTMLDivElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;

// Weather info elements
const cityName = document.getElementById('cityName') as HTMLDivElement;
const temperature = document.getElementById('temperature') as HTMLDivElement;
const condition = document.getElementById('condition') as HTMLDivElement;
const feelsLike = document.getElementById('feelsLike') as HTMLDivElement;
const humidity = document.getElementById('humidity') as HTMLDivElement;
const windSpeed = document.getElementById('windSpeed') as HTMLDivElement;
const pressure = document.getElementById('pressure') as HTMLDivElement;

// Convert Kelvin to Celsius
function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}

// Show error message
function showError(message: string): void {
  error.textContent = message;
  error.classList.add('show');
  weatherInfo.classList.remove('show');
  loading.classList.remove('show');
}

// Hide error message
function hideError(): void {
  error.classList.remove('show');
}

// Show loading state
function showLoading(): void {
  loading.classList.add('show');
  weatherInfo.classList.remove('show');
  hideError();
}

// Hide loading state
function hideLoading(): void {
  loading.classList.remove('show');
}

// Display weather data
function displayWeather(data: WeatherData): void {
  hideLoading();
  hideError();

  cityName.textContent = data.name;
  temperature.textContent = `${kelvinToCelsius(data.main.temp)}°C`;
  condition.textContent = data.weather[0].description;
  feelsLike.textContent = `${kelvinToCelsius(data.main.feels_like)}°C`;
  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${data.wind.speed} m/s`;
  pressure.textContent = `${data.main.pressure} hPa`;

  weatherInfo.classList.add('show');
}

// Fetch weather data
async function fetchWeather(city: string): Promise<void> {
  if (!city.trim()) {
    showError('Please enter a city name');
    return;
  }

  showLoading();

  try {
    // Note: For demo purposes, using a mock response
    // In production, you would need a valid API key from OpenWeatherMap
    const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        showError('City not found. Please try another city.');
      } else if (response.status === 401) {
        // For demo, show sample data when API key is invalid
        showDemoData(city);
      } else {
        showError('Failed to fetch weather data. Please try again.');
      }
      return;
    }

    const data: WeatherData = await response.json();
    displayWeather(data);
  } catch (err) {
    // For demo purposes, show sample data
    showDemoData(city);
  }
}

// Show demo data (for testing without API key)
function showDemoData(city: string): void {
  const demoData: WeatherData = {
    name: city,
    main: {
      temp: 295.15, // 22°C
      feels_like: 294.15, // 21°C
      humidity: 65,
      pressure: 1013,
    },
    weather: [
      {
        main: 'Clear',
        description: 'clear sky',
      },
    ],
    wind: {
      speed: 3.5,
    },
  };

  displayWeather(demoData);
}

// Event listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value;
  fetchWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value;
    fetchWeather(city);
  }
});

// Load default city on page load
window.addEventListener('DOMContentLoaded', () => {
  // Optional: Load a default city
  // fetchWeather('London');
});
