<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RainViewerService
{
    public function latest()
    {
        $response = Http::get(
            'https://api.rainviewer.com/public/weather-maps.json'
        );

        if (!$response->successful()) {
            return null;
        }

        $json = $response->json();

        $host = $json['host'];

        $latestRadar =
            end($json['radar']['past']);

        return [

            'host' => $host,

            'path' => $latestRadar['path'],

            'time' => $latestRadar['time'],

        ];
    }
}