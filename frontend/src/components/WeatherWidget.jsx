import { useState, useEffect } from "react";
import { weatherAPI } from "../services/api";
import { translate } from "../utils/translation";
import "./WeatherWidget.css";

function WeatherWidget({ city = "College Station", language = "en" }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [translatedCity, setTranslatedCity] = useState(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await weatherAPI.getWeather(city);
        setWeather(data);
      } catch (err) {
        console.error("Failed to fetch weather:", err);
        setError("Unable to load weather");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh weather every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [city]);

  // Translate weather description and city when language or weather changes
  useEffect(() => {
    const translateWeather = async () => {
      if (!weather) {
        setTranslatedDescription(null);
        setTranslatedCity(null);
        return;
      }

      if (language === "en") {
        setTranslatedDescription(weather.description);
        setTranslatedCity(weather.city);
        setTranslating(false);
        return;
      }

      setTranslating(true);
      try {
        const [translatedDesc, translatedCityName] = await Promise.all([
          translate(weather.description, language),
          translate(weather.city, language)
        ]);
        setTranslatedDescription(translatedDesc);
        setTranslatedCity(translatedCityName);
      } catch (err) {
        console.error("[WeatherWidget] Failed to translate weather:", err);
        setTranslatedDescription(weather.description);
        setTranslatedCity(weather.city);
      } finally {
        setTranslating(false);
      }
    };

    translateWeather();
  }, [language, weather]);

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="weather-loading">
          {language === "es" ? "Cargando clima..." : "Loading weather..."}
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null; // Don't show anything if there's an error
  }

  const getWeatherEmoji = (icon) => {
    // Map weather icons to emojis
    if (icon.includes("01")) return "☀️"; // Clear sky
    if (icon.includes("02")) return "⛅"; // Partly cloudy
    if (icon.includes("03") || icon.includes("04")) return "☁️"; // Cloudy
    if (icon.includes("09") || icon.includes("10")) return "🌧️"; // Rain
    if (icon.includes("11")) return "⛈️"; // Thunderstorm
    if (icon.includes("13")) return "❄️"; // Snow
    if (icon.includes("50")) return "🌫️"; // Fog
    return "🌤️"; // Default
  };

  // Use translated values if available, otherwise fall back to original
  const displayCity = translatedCity !== null ? translatedCity : weather.city;
  const displayDescription = translatedDescription !== null ? translatedDescription : weather.description;

  return (
    <div className="weather-widget">
      <div className="weather-icon">{getWeatherEmoji(weather.icon)}</div>
      <div className="weather-info">
        <div className="weather-temp">{Math.round(weather.temperature)}°F</div>
        <div className="weather-city">{displayCity}</div>
        <div className="weather-desc">{displayDescription}</div>
      </div>
    </div>
  );
}

export default WeatherWidget;

