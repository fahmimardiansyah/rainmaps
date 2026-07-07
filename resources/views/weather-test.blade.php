<!DOCTYPE html>
<html>
<head>
    <title>Weather Test</title>
</head>
<body>

<button onclick="getWeather()">
    Test Weather API
</button>

<pre id="result"></pre>

<script>

async function getWeather(){

    const lat = -7.9468;
    const lng = 112.6161;

    const apiKey = "{{ config('services.google_weather.api_key') }}";

    const response = await fetch(
        `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`,
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                location:{
                    latitude:lat,
                    longitude:lng
                }

            })

        }
    );

    const data = await response.json();

    console.log(data);

    document.getElementById("result")
        .textContent =
        JSON.stringify(data,null,2);

}

</script>

</body>
</html>