@extends('layouts.app')

@section('google-maps')
@endsection

@section('title', 'Home - Weather Maps')

@section('content')

    <div class="map-container overflow-hidden">
        {{-- <div class="w-full h-full" data-alt="A clean, light-mode minimalist map view of a suburban neighborhood"
            data-location="Malang"
            style="
          background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuD0pmXIVhzyb8AjQpQfg6lAkFFk2EVo-mLdfdO2HfxdZ7HTln8y1cm5nxl1E4_Z5pY8JInvsc3SImQR4bL2oQ-uB0vb0dSvnLCS9dgOEGN-Mf0k8p4S6MitqptBlW8hjx7ZxHmfxTtBW507Xe_8EC9tMo738GsoX7e8WL4R9-5MxgdfctLl4tDPqSgibGiSfD0YW2vKbAe-3RTd5XtoEkFid6pbz8UWnPN5glkrtvQJY853WQG9ePwJOmN050QLD3GplteoXX0G-sYp&quot;);
          background-size: cover;
        ">
        </div> --}}
        <div id="map" class="absolute inset-0">
        </div>
        <!-- Heatmap Overlay Shader -->
        <div class="absolute inset-0 opacity-40 pointer-events-none"></div>
    </div>
    <!-- UI Overlay Layer -->
    <main class="relative z-10 w-full h-screen flex flex-col pointer-events-none">
        <!-- Floating Search and Alerts (Top) -->
        <div class="mt-6 px-4 space-y-3 pointer-events-auto">
            <!-- Search Card -->
            <div class="bg-surface-container-lowest rounded-xl p-4 search-card-shadow border border-surface-container">
                <div class="flex items-center gap-3 mb-3">
                    <span class="material-symbols-outlined text-secondary"
                        style="font-variation-settings: &quot;FILL&quot; 1">location_on</span>
                    <div class="flex-1">
                        <p id="destination-title" class="text-on-surface font-body-lg text-body-lg">
                            Current Location
                        </p>
                    </div>
                </div>

                <div class="w-full h-px bg-surface-container mb-3"></div>

                <div class="flex items-center gap-3">

                    <span class="material-symbols-outlined text-outline">
                        search
                    </span>

                    <input id="searchDestination" name="destination"
                        class="bg-transparent border-none focus:ring-0 p-0 w-full text-on-surface font-body-lg text-body-lg placeholder:text-outline"
                        placeholder="Search Destination..." type="text">
                </div>
            </div>
            <!-- Rain Alert Banner -->
            <div class="rain-gradient rounded-full p-4 flex items-start gap-3 text-white shadow-lg">
                <span id="rain-alert-icon" class="material-symbols-outlined mt-1"
                    style="font-variation-settings: &quot;FILL&quot; 1">cloud_done</span>
                <div>
                    <h3 id="rain-alert-title" class="font-headline-md text-headline-md leading-tight">
                        Rain alert on your area
                    </h3>
                    <p id="rain-alert-description" class="font-body-sm text-body-sm opacity-90">
                        Moderate rain expected in 4 minutes around your area
                    </p>
                </div>
            </div>
        </div>
        <!-- Spacer -->
        <div class="flex-grow"></div>
        <!-- Draggable Bottom Sheet -->
        <div class="bg-surface-container-lowest rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] border-t border-surface-container pointer-events-auto flex flex-col h-[50vh] sheet-collapsed"
            id="bottom-sheet">

            <!-- Handle -->
            <div class="w-full pt-4 pb-2 cursor-grab active:cursor-grabbing" id="sheet-handle">
                <div class="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto"></div>
            </div>

            <div class="px-6 pb-28 flex-grow overflow-y-auto">

                <!-- Current Area -->
                <div class="flex flex-col gap-1 mb-6">

                    <p class="text-on-surface-variant font-label-md text-label-md">
                        Location Right Now
                    </p>

                    <h2 id="area-name" class="text-on-surface font-headline-lg text-headline-lg">
                        --
                    </h2>

                    <div class="flex items-center gap-6 mt-4">

                        <!-- Current Weather -->
                        <div class="flex items-center gap-2">

                            <span id="weather-icon" class="material-symbols-outlined text-tertiary-container text-sm">
                                sunny
                            </span>

                            <span id="weather-temperature" class="text-on-surface font-body-sm text-body-sm">
                                --
                            </span>

                            <span id="weather-condition" class="text-on-surface-variant font-body-sm text-body-sm">
                                --
                            </span>

                        </div>

                        <!-- Rain Alert -->
                        <div class="flex items-center gap-2">

                            <span id="rain-icon" class="material-symbols-outlined text-primary-container text-sm"
                                style="font-variation-settings:'FILL' 1">
                                rainy
                            </span>

                            <span id="rain-info" class="text-primary-container font-body-sm text-body-sm">
                                --
                            </span>

                        </div>

                    </div>

                </div>

                <!-- Forecast -->
                <div class="space-y-6 mt-8">

                    <div class="bg-surface-container rounded-xl overflow-hidden">

                        <div class="p-3 text-center border-b border-surface-container-highest">

                            <span class="font-label-md text-label-md text-on-surface-variant">

                                Today Forecast (In Your Area)

                            </span>

                        </div>

                        <div class="flex flex-col">

                            <!-- Forecast 1 -->
                            <div class="flex justify-between items-center p-4 border-b border-surface-container-highest">

                                <span id="forecast-time-1" class="font-body-sm text-body-sm text-on-surface">
                                    --
                                </span>

                                <div class="flex items-center gap-2">

                                    <span id="forecast-icon-1" class="material-symbols-outlined text-on-surface text-sm">
                                        sunny
                                    </span>

                                    <span id="forecast-temp-1" class="font-body-sm text-body-sm text-on-surface">
                                        --
                                    </span>

                                </div>

                            </div>

                            <!-- Forecast 2 -->
                            <div class="flex justify-between items-center p-4 border-b border-surface-container-highest">

                                <span id="forecast-time-2" class="font-body-sm text-body-sm text-on-surface">
                                    --
                                </span>

                                <div class="flex items-center gap-2">

                                    <span id="forecast-icon-2" class="material-symbols-outlined text-on-surface text-sm">
                                        cloudy_snowing
                                    </span>

                                    <span id="forecast-temp-2" class="font-body-sm text-body-sm text-on-surface">
                                        --
                                    </span>

                                </div>

                            </div>

                            <!-- Forecast 3 -->
                            <div class="flex justify-between items-center p-4">

                                <span id="forecast-time-3" class="font-body-sm text-body-sm text-on-surface">
                                    --
                                </span>

                                <div class="flex items-center gap-2">

                                    <span id="forecast-icon-3" class="material-symbols-outlined text-on-surface text-sm">
                                        cloud
                                    </span>

                                    <span id="forecast-temp-3" class="font-body-sm text-body-sm text-on-surface">
                                        --
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    </main>

    @push('scripts')
        <script>
            const destinationPreviewUrl = "{{ route('destination.preview') }}";
        </script>

        <script src="{{ asset('assets/js/home.js') }}"></script>
    @endpush
@endsection
