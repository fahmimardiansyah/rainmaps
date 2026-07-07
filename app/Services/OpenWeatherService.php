<?php

namespace App\Services;

class OpenWeatherService
{
    public function tileInfo()
    {
        return [
            'apiKey' => env('OPENWEATHER_API_KEY'),
            'layer' => 'precipitation_new'
        ];
    }
}