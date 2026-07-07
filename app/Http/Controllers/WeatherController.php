<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WeatherController extends Controller
{
    public function current(Request $request)
    {
        $response = Http::get(
            "https://weather.googleapis.com/v1/currentConditions:lookup",
            [
                "key" => config("services.google_maps.api_key"),

                "location.latitude" => $request->lat,

                "location.longitude" => $request->lng,
            ]
        );

        $weather = $response->json();

        return response()->json([

            "time" => $weather["currentTime"],

            "temperature" => round(
                $weather["temperature"]["degrees"]
            ),

            "condition" => $weather["weatherCondition"]["type"],

            "description" => $weather["weatherCondition"]["description"]["text"],

            "rainProbability" =>
            $weather["precipitation"]["probability"]["percent"] ?? 0,

        ]);
    }

    public function hourlyForecast(Request $request)
    {
        $response = Http::get(
            "https://weather.googleapis.com/v1/forecast/hours:lookup",
            [

                "key" => config("services.google_maps.api_key"),

                "location.latitude" => $request->lat,

                "location.longitude" => $request->lng,

                // hanya 24 forecast pertama
                "hours" => 24,

            ]
        );

        if (!$response->successful()) {

            return response()->json([
                "message" => "Failed to fetch hourly forecast.",
                "response" => $response->json(),
            ], $response->status());
        }

        $forecast = $response->json();

        $forecastHours = collect($forecast["forecastHours"] ?? []);

        $targetHours = [7, 13, 20];

        $result = collect();

        foreach ($targetHours as $targetHour) {

            $hour = $forecastHours->first(function ($item) use ($targetHour) {

                return (int) date(
                    "H",
                    strtotime($item["interval"]["startTime"])
                ) === $targetHour;
            });

            if (!$hour) {

                continue;
            }

            $result->push([

                "time" => date(
                    "H.i",
                    strtotime($hour["interval"]["startTime"])
                ),

                "temperature" => round(
                    $hour["temperature"]["degrees"]
                ),

                "condition" =>
                $hour["weatherCondition"]["type"],

                "description" =>
                $hour["weatherCondition"]["description"]["text"],

                "rainProbability" =>
                $hour["precipitation"]["probability"]["percent"] ?? 0,

            ]);
        }

        return response()->json($result->values());
    }
}
