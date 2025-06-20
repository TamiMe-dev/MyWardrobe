
const { status } = require("express/lib/response");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// Function to send a request to the OpenWeatherMap API and get the weather
exports.getWeather = async (req, res) => {
    const city = req.params.city;
    const apiKey =process.env.apiKey
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=he`;

    try {
        const response = await axios.get(url);
        const weatherData = response.data;
        res.status(200).json(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        res.status(500).json({ message: 'Failed to fetch weather data' });
    }
};
