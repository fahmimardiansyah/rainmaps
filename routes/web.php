<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\RainViewerController;
use App\Http\Controllers\OpenWeatherController;

Route::get('/weather/current', [WeatherController::class, 'current'])
    ->name('weather.current');

Route::get(
    '/rainviewer/latest',
    [RainViewerController::class, 'latest']
);

Route::get('/weather/hourly', [WeatherController::class, 'hourlyForecast']);

Route::view('/', 'pages.home')->name('home');

Route::view('/destination-preview', 'pages.destination-preview')
    ->name('destination.preview');

Route::view('/navigation-route', 'pages.navigation-route')
    ->name('navigation.route');

Route::get('/weather-test', function () {
    return view('weather-test');
});

Route::get(
    '/openweather/tile',
    [OpenWeatherController::class, 'tile']
);
